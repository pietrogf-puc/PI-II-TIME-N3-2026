/*
  Arquivo: detalhes.ts
  Autor: Rafael Carvalho Soares (RA 26029352)
  Projeto: Sistema de Acompanhamento de Demandas - PI II - Time N3
  Rotas da tela de detalhes: consultar uma demanda, mudar status/cancelar,
  comentários e histórico.
*/
import { Router, Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import conexao from "../config/database";
import { autenticar } from "../middlewares/autenticacao";
import {
    exigirPermissao,
    exigirVinculoComDemanda,
    exigirResponsavelSeMembro,
    ehResponsavel,
    permissoesDoPerfil,
    DemandaCarregada
} from "../middlewares/permissoes";
import { ehStatusValido, verificarMudancaDeStatus, proximosStatusPermitidos, Perfil, Status } from "../regras/status";
import { descreverAlteracao } from "../regras/historico";

const router = Router();

// limites do comentário (iguais aos da tela)
const MIN_COMENTARIO = 5;
const MAX_COMENTARIO = 300;

interface UsuarioLogado {
    id: number;
    perfil: string;
}

// status para onde o usuário logado pode mover a demanda agora
async function proximosStatus(usuario: UsuarioLogado, idDemanda: number, statusAtual: Status): Promise<Status[]> {
    const permissoes = await permissoesDoPerfil(usuario.perfil);
    if (!permissoes.includes("alterar_status")) {
        return [];
    }
    // membro só mexe nas demandas dele
    if (usuario.perfil === "Membro da Equipe" && !(await ehResponsavel(usuario.id, idDemanda))) {
        return [];
    }
    return proximosStatusPermitidos(statusAtual, usuario.perfil as Perfil);
}

// registros do histórico de uma demanda, do mais antigo para o mais novo
async function buscarHistorico(idDemanda: number) {
    const [linhas] = await conexao.execute<RowDataPacket[]>(
        `SELECT h.tipo_alteracao, h.valor_anterior, h.valor_novo, u.nome AS autor,
                DATE_FORMAT(h.data_hora, '%Y-%m-%dT%H:%i:%s') AS dataHora
           FROM historico h
           JOIN usuario u ON u.id_usuario = h.id_usuario
          WHERE h.id_demanda = ?
          ORDER BY h.data_hora, h.id_historico`,
        [idDemanda]
    );

    return linhas.map((linha) => ({
        autor: linha.autor,
        dataHora: linha.dataHora,
        tipo: linha.tipo_alteracao,
        valorAnterior: linha.valor_anterior,
        valorNovo: linha.valor_novo,
        descricao: descreverAlteracao(linha.tipo_alteracao, linha.valor_anterior, linha.valor_novo)
    }));
}


/* ==== GET /demandas/:id ==== */
// dados da demanda + histórico + para quais status o usuário pode mover

router.get(
    "/:id",
    autenticar,
    exigirPermissao("visualizar_demandas"),
    exigirVinculoComDemanda,
    async (_req: Request, res: Response) => {
        try {
            const usuario = res.locals.usuario as UsuarioLogado;
            const demanda = res.locals.demanda as DemandaCarregada;

            const [linhas] = await conexao.execute<RowDataPacket[]>(
                `SELECT d.id_demanda AS id, d.titulo, d.descricao,
                        t.nome AS tipo, p.nome AS prioridade, s.nome_status AS status,
                        pr.nome_projeto AS projeto,
                        (SELECT GROUP_CONCAT(u.nome ORDER BY u.nome SEPARATOR ', ')
                           FROM demanda_responsavel dr
                           JOIN usuario u ON u.id_usuario = dr.id_usuario
                          WHERE dr.id_demanda = d.id_demanda) AS responsavel,
                        DATE_FORMAT(d.data_criacao, '%Y-%m-%dT%H:%i:%s') AS dataCriacao,
                        DATE_FORMAT(d.data_atualizacao, '%Y-%m-%dT%H:%i:%s') AS dataAtualizacao,
                        DATE_FORMAT(d.prazo_finalizacao, '%Y-%m-%d') AS prazo
                   FROM demanda d
                   JOIN tipo_demanda t   ON t.id_tipo = d.id_tipo
                   JOIN prioridade p     ON p.id_prioridade = d.id_prioridade
                   JOIN status_demanda s ON s.id_status = d.id_status
                   JOIN projeto pr       ON pr.id_projeto = d.id_projeto
                  WHERE d.id_demanda = ?`,
                [demanda.id]
            );

            if (linhas.length === 0) {
                res.status(404).json({ mensagem: "Demanda não encontrada." });
                return;
            }

            const permissoes = await permissoesDoPerfil(usuario.perfil);
            const historico = permissoes.includes("visualizar_historico") ? await buscarHistorico(demanda.id) : [];

            res.status(200).json({
                ...linhas[0],
                proximosStatus: await proximosStatus(usuario, demanda.id, linhas[0].status as Status),
                historico: historico
            });
        } catch (erro) {
            console.error("Erro ao buscar a demanda:", erro);
            res.status(500).json({ mensagem: "Erro ao buscar a demanda." });
        }
    }
);


/* ==== PATCH /demandas/:id/status ==== */
// muda o status (também usado para cancelar). As regras ficam em regras/status.ts

router.patch(
    "/:id/status",
    autenticar,
    exigirPermissao("alterar_status"),
    exigirVinculoComDemanda,
    exigirResponsavelSeMembro,
    async (req: Request, res: Response) => {
        try {
            const usuario = res.locals.usuario as UsuarioLogado;
            const demanda = res.locals.demanda as DemandaCarregada;
            const novoStatus = req.body?.status;

            if (!ehStatusValido(novoStatus)) {
                res.status(400).json({ mensagem: "Status inválido." });
                return;
            }

            const atual = demanda.status as Status;
            const resultado = verificarMudancaDeStatus(atual, novoStatus, usuario.perfil as Perfil);
            if (!resultado.permitido) {
                res.status(resultado.codigo).json({ mensagem: resultado.mensagem });
                return;
            }

            // o UPDATE e o histórico são gravados juntos (transação)
            const con = await conexao.getConnection();
            try {
                await con.beginTransaction();

                // o "AND id_status" evita gravar se alguém mudou o status ao mesmo tempo
                const [resultadoUpdate] = await con.execute<ResultSetHeader>(
                    `UPDATE demanda
                        SET id_status = (SELECT id_status FROM status_demanda WHERE nome_status = ?)
                      WHERE id_demanda = ?
                        AND id_status = (SELECT id_status FROM status_demanda WHERE nome_status = ?)`,
                    [novoStatus, demanda.id, atual]
                );

                if (resultadoUpdate.affectedRows !== 1) {
                    await con.rollback();
                    res.status(409).json({ mensagem: "O status desta demanda foi alterado por outra pessoa. Recarregue a página." });
                    return;
                }

                await con.execute(
                    `INSERT INTO historico (tipo_alteracao, valor_anterior, valor_novo, id_usuario, id_demanda)
                     VALUES ('Status', ?, ?, ?, ?)`,
                    [atual, novoStatus, usuario.id, demanda.id]
                );

                await con.commit();
            } catch (erroGravar) {
                await con.rollback();
                throw erroGravar;
            } finally {
                con.release();
            }

            const mensagem = novoStatus === "Cancelada" ? "Demanda cancelada." : `Status alterado para "${novoStatus}".`;
            res.status(200).json({ mensagem: mensagem });
        } catch (erro) {
            console.error("Erro ao alterar o status:", erro);
            res.status(500).json({ mensagem: "Erro ao alterar o status da demanda." });
        }
    }
);


/* ==== GET /demandas/:id/comentarios ==== */

router.get(
    "/:id/comentarios",
    autenticar,
    exigirPermissao("visualizar_comentarios"),
    exigirVinculoComDemanda,
    async (_req: Request, res: Response) => {
        try {
            const demanda = res.locals.demanda as DemandaCarregada;

            const [linhas] = await conexao.execute<RowDataPacket[]>(
                `SELECT c.id_comentario AS id, c.texto, u.nome AS autor,
                        DATE_FORMAT(c.data_hora, '%Y-%m-%dT%H:%i:%s') AS dataHora
                   FROM comentario c
                   JOIN usuario u ON u.id_usuario = c.id_usuario
                  WHERE c.id_demanda = ?
                  ORDER BY c.data_hora, c.id_comentario`,
                [demanda.id]
            );

            res.status(200).json(linhas);
        } catch (erro) {
            console.error("Erro ao buscar comentários:", erro);
            res.status(500).json({ mensagem: "Erro ao buscar os comentários." });
        }
    }
);


/* ==== POST /demandas/:id/comentarios ==== */

router.post(
    "/:id/comentarios",
    autenticar,
    exigirPermissao("registrar_comentarios"),
    exigirVinculoComDemanda,
    async (req: Request, res: Response) => {
        try {
            const usuario = res.locals.usuario as UsuarioLogado;
            const demanda = res.locals.demanda as DemandaCarregada;
            const texto = typeof req.body?.texto === "string" ? req.body.texto.trim() : "";

            // mesma validação da tela, porque o servidor não pode confiar só no navegador
            if (texto === "") {
                res.status(400).json({ mensagem: "Escreva um comentário antes de enviar." });
                return;
            }
            if (texto.length < MIN_COMENTARIO) {
                res.status(400).json({ mensagem: `O comentário precisa ter pelo menos ${MIN_COMENTARIO} caracteres.` });
                return;
            }
            if (texto.length > MAX_COMENTARIO) {
                res.status(400).json({ mensagem: `O comentário pode ter no máximo ${MAX_COMENTARIO} caracteres.` });
                return;
            }

            const [resultado] = await conexao.execute<ResultSetHeader>(
                "INSERT INTO comentario (texto, id_usuario, id_demanda) VALUES (?, ?, ?)",
                [texto, usuario.id, demanda.id]
            );

            res.status(201).json({ mensagem: "Comentário registrado.", id: resultado.insertId });
        } catch (erro) {
            console.error("Erro ao registrar comentário:", erro);
            res.status(500).json({ mensagem: "Erro ao registrar o comentário." });
        }
    }
);


/* ==== GET /demandas/:id/historico ==== */

router.get(
    "/:id/historico",
    autenticar,
    exigirPermissao("visualizar_historico"),
    exigirVinculoComDemanda,
    async (_req: Request, res: Response) => {
        try {
            const demanda = res.locals.demanda as DemandaCarregada;
            res.status(200).json(await buscarHistorico(demanda.id));
        } catch (erro) {
            console.error("Erro ao buscar o histórico:", erro);
            res.status(500).json({ mensagem: "Erro ao buscar o histórico." });
        }
    }
);

export default router;
