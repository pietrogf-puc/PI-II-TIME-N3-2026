//AUTOR DO CÓDIGO: LUIGGI FRAGA FERREIRA ; RA - 26026323//

// Rotas da tela de Cadastro e Edição de Demandas
//
// GET  /demandas/opcoes  -> listas para preencher os <select>
// POST /demandas         -> cadastra uma demanda nova

import { Router, Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import conexao from "../config/database";
import { autorizarPerfil } from "../middlewares/autorizarPerfil";

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

// Confere os campos que vieram do formulário.
// Se tiver algum erro, devolve a mensagem. Se estiver tudo certo, devolve "".
function validarCampos(dados: any): string {
    if (!dados.titulo || dados.titulo.trim().length < 5) {
        return "O título precisa ter pelo menos 5 caracteres.";
    }
    if (dados.titulo.trim().length > 100) {
        return "O título pode ter no máximo 100 caracteres.";
    }
    if (!dados.descricao || dados.descricao.trim().length < 10) {
        return "A descrição precisa ter pelo menos 10 caracteres.";
    }
    if (!dados.id_projeto) {
        return "Selecione um projeto.";
    }
    if (!dados.id_tipo) {
        return "Selecione um tipo.";
    }
    if (!dados.id_prioridade) {
        return "Selecione uma prioridade.";
    }
    if (!dados.prazo) {
        return "Escolha um prazo.";
    }
    return "";
}


/* ---------- GET /demandas/opcoes ---------- */
// Manda para o frontend as opções dos <select>.
// Essa rota fica ANTES da "/:id", senão o Express acha que "opcoes" é um id.

router.get("/opcoes", async (_req: Request, res: Response) => {
    try {
        const [projetos] = await conexao.execute<RowDataPacket[]>(
            "SELECT id_projeto AS id, nome_projeto AS nome FROM projeto WHERE ativo_projeto = TRUE"
        );

        const [tipos] = await conexao.execute<RowDataPacket[]>(
            "SELECT id_tipo AS id, nome FROM tipo_demanda"
        );

        const [prioridades] = await conexao.execute<RowDataPacket[]>(
            "SELECT id_prioridade AS id, nome FROM prioridade ORDER BY ordem"
        );

        const [usuarios] = await conexao.execute<RowDataPacket[]>(
            "SELECT id_usuario AS id, nome FROM usuario WHERE ativo = TRUE ORDER BY nome"
        );

        return res.json({
            projetos: projetos,
            tipos: tipos,
            prioridades: prioridades,
            usuarios: usuarios
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Erro ao carregar as opções." });
    }
});


/* ---------- POST /demandas ---------- */
// Cadastra uma demanda nova. Só Administrador e Líder de Projeto podem.

router.post("/", autorizarPerfil("Administrador", "Líder de Projeto"), async (req: Request, res: Response) => {
    try {
        const dados = req.body;

        // 1. Confere os campos
        const erro = validarCampos(dados);
        if (erro !== "") {
            return res.status(400).json({ mensagem: erro });
        }

        if (dados.prazo < dataDeHoje()) {
            return res.status(400).json({ mensagem: "O prazo não pode ser uma data que já passou." });
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
        if (dados.id_responsavel) {
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
