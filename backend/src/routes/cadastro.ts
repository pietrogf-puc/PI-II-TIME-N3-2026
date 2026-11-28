//AUTOR DO CÓDIGO: LUIGGI FRAGA FERREIRA ; RA - 26026323//

// Rotas da tela de Cadastro e Edição de Demandas
//
// GET  /demandas/opcoes  -> listas para preencher os <select>
// POST /demandas         -> cadastra uma demanda nova

import { Router, Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import conexao from "../config/database";
import { verificarPrazoEmFeriado } from "../regras/feriados";
import { exigirPermissao, exigirVinculoComProjeto, participaDoProjeto } from "../middlewares/permissoes"
const router = Router();


/* ---------- Funções de apoio ---------- */

// Devolve a data de hoje no formato "AAAA-MM-DD" (igual ao cadastro.js)
function dataDeHoje(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
}

// Confere se "AAAA-MM-DD" é uma data que existe (ex.: 2027-02-31 não existe)
function dataValida(texto: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    const [ano, mes, dia] = texto.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

function validarCampos(dados: any): string {
    if (typeof dados.titulo !== "string" || dados.titulo.trim().length < 5) {
        return "O título precisa ter pelo menos 5 caracteres.";
    }
    if (dados.titulo.trim().length > 100) {
        return "O título pode ter no máximo 100 caracteres.";
    }
    if (typeof dados.descricao !== "string" || dados.descricao.trim().length < 10) {
        return "A descrição precisa ter pelo menos 10 caracteres.";
    }
    if (!Number.isInteger(Number(dados.id_projeto))) return "Selecione um projeto.";
    if (!Number.isInteger(Number(dados.id_tipo))) return "Selecione um tipo.";
    if (!Number.isInteger(Number(dados.id_prioridade))) return "Selecione uma prioridade.";
    if (typeof dados.prazo !== "string" || !dataValida(dados.prazo)) {
        return "Prazo inválido. Use uma data no formato AAAA-MM-DD.";
    }
    return "";
}


/* ---------- GET /demandas/opcoes ---------- */
// Manda para o frontend as opções dos <select>.
// Essa rota fica ANTES da "/:id", senão o Express acha que "opcoes" é um id.

router.get("/opcoes", async (_req: Request, res: Response) => {
    try {
        const usuario = res.locals.usuario as { id: number; perfil: string };
        const ehAdmin = usuario.perfil === "Administrador";

        // Admin vê todos os projetos; os outros, só os projetos em que participam
        const [projetos] = await conexao.execute<RowDataPacket[]>(
            ehAdmin
                ? "SELECT id_projeto AS id, nome_projeto AS nome FROM projeto WHERE ativo_projeto = TRUE"
                : `SELECT p.id_projeto AS id, p.nome_projeto AS nome
                     FROM projeto p
                     JOIN projeto_usuario pu ON pu.id_projeto = p.id_projeto
                    WHERE p.ativo_projeto = TRUE AND pu.id_usuario = ?`,
            ehAdmin ? [] : [usuario.id]
        );

        const [tipos] = await conexao.execute<RowDataPacket[]>(
            "SELECT id_tipo AS id, nome FROM tipo_demanda"
        );

        const [prioridades] = await conexao.execute<RowDataPacket[]>(
            "SELECT id_prioridade AS id, nome FROM prioridade ORDER BY ordem"
        );

        // Lista de todos os usuários ativos (o modal de edição da listagem ainda usa)
        const [usuarios] = await conexao.execute<RowDataPacket[]>(
            "SELECT id_usuario AS id, nome FROM usuario WHERE ativo = TRUE ORDER BY nome"
        );

        // Quem participa de cada projeto (o front usa para filtrar o responsável)
        const [participantes] = await conexao.execute<RowDataPacket[]>(
            `SELECT pu.id_projeto, u.id_usuario AS id, u.nome
               FROM projeto_usuario pu
               JOIN usuario u ON u.id_usuario = pu.id_usuario
              WHERE u.ativo = TRUE
              ORDER BY u.nome`
        );

        return res.json({ projetos, tipos, prioridades, usuarios, participantes });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Erro ao carregar as opções." });
    }
});


/* ---------- POST /demandas ---------- */
// Cadastra uma demanda nova. Só Administrador e Líder de Projeto podem.

router.post("/", exigirPermissao("criar_demanda"), exigirVinculoComProjeto, async (req: Request, res: Response) => {
    try {
        const dados = req.body;

        // 1. Confere os campos
        const erro = validarCampos(dados);
        if (erro !== "") {
            return res.status(400).json({ mensagem: erro });
        }

        const [tipos] = await conexao.execute<RowDataPacket[]>(
            "SELECT 1 FROM tipo_demanda WHERE id_tipo = ?", [Number(dados.id_tipo)]
        );
        if (tipos.length === 0) {
            return res.status(400).json({ mensagem: "Tipo inválido." });
        }
        const [prioridades] = await conexao.execute<RowDataPacket[]>(
            "SELECT 1 FROM prioridade WHERE id_prioridade = ?", [Number(dados.id_prioridade)]
        );
        if (prioridades.length === 0) {
            return res.status(400).json({ mensagem: "Prioridade inválida." });
        }

        if (dados.prazo < dataDeHoje()) {
            return res.status(400).json({ mensagem: "O prazo não pode ser uma data que já passou." });
        }

        // Confere na API externa se o prazo cai em feriado nacional
        const erroFeriado = await verificarPrazoEmFeriado(dados.prazo);
        if (erroFeriado) {
            return res.status(erroFeriado.codigo).json({ mensagem: erroFeriado.mensagem });
        }


          // Responsável é opcional. Se veio, precisa existir, estar ativo e participar do projeto.
        let idResponsavel: number | null = null;
        if (dados.id_responsavel !== undefined && dados.id_responsavel !== null && dados.id_responsavel !== "") {
            idResponsavel = Number(dados.id_responsavel);

            if (!Number.isInteger(idResponsavel)) {
                return res.status(400).json({ mensagem: "Responsável inválido." });
            }
            const [usuarios] = await conexao.execute<RowDataPacket[]>(
                "SELECT 1 FROM usuario WHERE id_usuario = ? AND ativo = TRUE",
                [idResponsavel]
            );
            if (usuarios.length === 0 || !(await participaDoProjeto(idResponsavel, Number(dados.id_projeto)))) {
                return res.status(400).json({ mensagem: "Responsável inválido ou fora do projeto escolhido." });
            }
        }   

        // 2. Grava a demanda. Toda demanda nova começa com status 1 ("Aberta")
        const [resultado] = await conexao.execute<ResultSetHeader>(
            `INSERT INTO demanda
                (titulo, descricao, prazo_finalizacao, id_projeto, id_tipo, id_prioridade, id_status)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
                dados.titulo.trim(),
                dados.descricao.trim(),
                dados.prazo,
                dados.id_projeto,
                dados.id_tipo,
                dados.id_prioridade
            ]
        );


        // insertId = o id que o banco criou para a demanda nova
        const idNovaDemanda = resultado.insertId;

        // 3. Grava o responsável (se foi escolhido um)
        if (idResponsavel) {
            await conexao.execute(
                "INSERT INTO demanda_responsavel (id_demanda, id_usuario) VALUES (?, ?)",
                [idNovaDemanda, dados.id_responsavel]
            );
        }

        // 4. Grava no histórico quem criou a demanda
        const idUsuarioLogado = res.locals.usuario.id;

        await conexao.execute(
            `INSERT INTO historico (tipo_alteracao, valor_anterior, valor_novo, id_usuario, id_demanda)
             VALUES ('Criação', NULL, 'Aberta', ?, ?)`,
            [idUsuarioLogado, idNovaDemanda]
        );

        return res.status(201).json({
            mensagem: "Demanda cadastrada com sucesso!",
            id: idNovaDemanda
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Erro ao cadastrar a demanda." });
    }
});

export default router;
