// Autor: Gustavo Pietro de Assis Silva | Rotas da Listagem de Demandas | PI II - Time N3
// GET /demandas: devolve as demandas do banco, com filtros, busca e ordenação.
// PUT /demandas/:id: edita uma demanda (usada pelo modal de edição da Listagem).
import { Router, Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import conexao from "../config/database";
import { autenticar } from "../middlewares/autenticacao";
// As regras de status (quem pode mudar para qual status)
import { ehStatusValido, verificarMudancaDeStatus, Perfil, Status } from "../regras/status";

const router = Router();

/* === GET /demandas ==== */

router.get("/", autenticar, async (req: Request, res: Response) => {
    try {
        // Pega o que veio na URL, por exemplo /demandas?status=Aberta
        const status = req.query.status;
        const prioridade = req.query.prioridade;
        const tipo = req.query.tipo;
        const busca = req.query.busca;
        const ordenar = req.query.ordenar;

        // Quem está logado (o middleware guardou isso a partir do token)
        const usuario = res.locals.usuario;

        // Listas que vão montando o WHERE do SQL
        const condicoes: string[] = [];
        const valores: (string | number)[] = [];

        // Quem não é Administrador só vê os projetos em que participa
        if (usuario.perfil !== "Administrador") {
            condicoes.push("d.id_projeto IN (SELECT id_projeto FROM projeto_usuario WHERE id_usuario = ?)");
            valores.push(usuario.id);
        }

        // Cada filtro só entra se o usuário escolheu algo
        if (status) {
            condicoes.push("s.nome_status = ?");
            valores.push(String(status));
        }
        if (prioridade) {
            condicoes.push("p.nome = ?");
            valores.push(String(prioridade));
        }
        if (tipo) {
            condicoes.push("t.nome = ?");
            valores.push(String(tipo));
        }
        // trim() tira os espaços das pontas, assim uma busca só com espaços é ignorada
        if (busca && String(busca).trim() !== "") {
            condicoes.push("(d.titulo LIKE ? OR d.descricao LIKE ?)");
            valores.push("%" + String(busca).trim() + "%");
            valores.push("%" + String(busca).trim() + "%");
        }

        // Junta as condições com AND. Se não tem nenhuma, não tem WHERE.
        let where = "";
        if (condicoes.length > 0) {
            where = "WHERE " + condicoes.join(" AND ");
        }

        // Escolhe a coluna da ordenação. Por padrão ordena pelo id.
        let colunaOrdem = "d.id_demanda";
        if (ordenar === "dataCriacao") {
            colunaOrdem = "d.data_criacao";
        } else if (ordenar === "prazo") {
            colunaOrdem = "d.prazo_finalizacao";
        } else if (ordenar === "prioridade") {
            colunaOrdem = "p.ordem";
        } else if (ordenar === "status") {
            colunaOrdem = "s.id_status";
        }

        // O responsável fica em outra tabela, então o subselect busca os nomes
        // dessa demanda e junta num texto só (ex.: "Ana, Bruno").
        const sql = `
            SELECT
                d.id_demanda AS id,
                d.titulo,
                d.descricao,
                t.nome AS tipo,
                p.nome AS prioridade,
                s.nome_status AS status,
                pr.nome_projeto AS projeto,
                (SELECT GROUP_CONCAT(u.nome SEPARATOR ', ')
                   FROM demanda_responsavel dr
                   JOIN usuario u ON u.id_usuario = dr.id_usuario
                  WHERE dr.id_demanda = d.id_demanda) AS responsavel,
                DATE_FORMAT(d.data_criacao, '%Y-%m-%d') AS dataCriacao,
                DATE_FORMAT(d.prazo_finalizacao, '%Y-%m-%d') AS prazo
            FROM demanda d
            JOIN tipo_demanda t   ON t.id_tipo = d.id_tipo
            JOIN prioridade p     ON p.id_prioridade = d.id_prioridade
            JOIN status_demanda s ON s.id_status = d.id_status
            JOIN projeto pr       ON pr.id_projeto = d.id_projeto
            ${where}
            ORDER BY ${colunaOrdem}`;

        // Executa no banco e devolve a lista
        const [linhas] = await conexao.execute(sql, valores);
        res.status(200).json(linhas);
    } catch (erro) {
        console.error("Erro ao listar demandas:", erro);
        res.status(500).json({ mensagem: "Erro ao buscar as demandas." });
    }
});


/* ==== PUT /demandas/:id ===== */

// Valores aceitos (têm que ser iguais aos que estão no banco)
const TIPOS = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
const PRIORIDADES = ["Crítica", "Alta", "Média", "Baixa"];

// Confere se um texto "AAAA-MM-DD" é uma data que existe (ex.: 2026-02-31 não existe)
function dataValida(texto: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return false;
    }
    const [ano, mes, dia] = texto.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

router.put("/:id", autenticar, async (req: Request, res: Response) => {
    try {

        const id = Number(String(req.params.id));
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensagem: "Id da demanda inválido." });
            return;
        }

        // req.body é o JSON que o modal envia
        const dados = req.body || {};
        const titulo: string = typeof dados.titulo === "string" ? dados.titulo.trim() : "";
        const descricao: string = typeof dados.descricao === "string" ? dados.descricao.trim() : "";
        const tipo: string = dados.tipo;
        const prioridade: string = dados.prioridade;
        const prazo: string = typeof dados.prazo === "string" ? dados.prazo : "";

        const erros: string[] = [];
        if (titulo.length < 5 || titulo.length > 150) {
            erros.push("O título deve ter entre 5 e 150 caracteres.");
        }
        if (descricao === "") {
            erros.push("A descrição não pode estar vazia.");
        }
        if (!TIPOS.includes(tipo)) {
            erros.push("Tipo inválido.");
        }
        if (!PRIORIDADES.includes(prioridade)) {
            erros.push("Prioridade inválida.");
        }
        if (!ehStatusValido(dados.status)) {
            erros.push("Status inválido.");
        }
        if (!dataValida(prazo)) {
            erros.push("Prazo inválido. Use uma data no formato AAAA-MM-DD.");
        }

        // Qualquer erro: responde 400 (dados inválidos) e para aqui
        if (erros.length > 0) {
            res.status(400).json({ mensagem: erros[0], erros: erros });
            return;
        }

        const novoStatus: Status = dados.status;

        const usuario = res.locals.usuario as { id: number; perfil: string };
        const perfil = usuario.perfil as Perfil;

        // Busca como a demanda está hoje no banco
        const [atuais] = await conexao.execute<RowDataPacket[]>(
            `SELECT d.id_projeto, d.titulo, d.descricao,
                    DATE_FORMAT(d.prazo_finalizacao, '%Y-%m-%d') AS prazo,
                    t.nome AS tipo, p.nome AS prioridade, s.nome_status AS status
               FROM demanda d
               JOIN tipo_demanda t   ON t.id_tipo = d.id_tipo
               JOIN prioridade p     ON p.id_prioridade = d.id_prioridade
               JOIN status_demanda s ON s.id_status = d.id_status
              WHERE d.id_demanda = ?`,
            [id]
        );

        // Não achou: 404 (recurso não encontrado)
        if (atuais.length === 0) {
            res.status(404).json({ mensagem: "Demanda não encontrada." });
            return;
        }
        const atual = atuais[0];

        // Quem não é Administrador só edita demandas dos projetos em que participa
        if (perfil !== "Administrador") {
            const [vinculos] = await conexao.execute<RowDataPacket[]>(
                "SELECT 1 FROM projeto_usuario WHERE id_projeto = ? AND id_usuario = ?",
                [atual.id_projeto, usuario.id]
            );
            if (vinculos.length === 0) {
                res.status(403).json({ mensagem: "Você não participa do projeto desta demanda." });
                return;
            }
        }

        // Membro da Equipe: só mexe em demanda atribuída a ele, e só no status
        if (perfil === "Membro da Equipe") {
            const [atribuidas] = await conexao.execute<RowDataPacket[]>(
                "SELECT 1 FROM demanda_responsavel WHERE id_demanda = ? AND id_usuario = ?",
                [id, usuario.id]
            );
            if (atribuidas.length === 0) {
                res.status(403).json({ mensagem: "O Membro da Equipe só altera demandas atribuídas a ele." });
                return;
            }

            const mudouOutraCoisa =
                titulo !== String(atual.titulo).trim() ||
                descricao !== String(atual.descricao).trim() ||
                tipo !== atual.tipo ||
                prioridade !== atual.prioridade ||
                prazo !== atual.prazo;

            if (mudouOutraCoisa) {
                res.status(403).json({ mensagem: "O Membro da Equipe só pode alterar o status da demanda." });
                return;
            }
        }

        // Regras do fluxo de status. Só confere se o status mudou.
        if (novoStatus !== atual.status) {
            const resultado = verificarMudancaDeStatus(atual.status as Status, novoStatus, perfil);
            if (!resultado.permitido) {
                res.status(resultado.codigo).json({ mensagem: resultado.mensagem });
                return;
            }
        }

        // Lista do que mudou, para registrar no histórico: [tipo da alteração, valor antigo, valor novo]
        const mudancas: string[][] = [];
        if (novoStatus !== atual.status) {
            mudancas.push(["Status", atual.status, novoStatus]);
        }
        if (prioridade !== atual.prioridade) {
            mudancas.push(["Prioridade", atual.prioridade, prioridade]);
        }
        if (prazo !== atual.prazo) {
            mudancas.push(["Prazo", atual.prazo, prazo]);
        }

        // Transação: o UPDATE e o histórico são gravados juntos.
        // Se um deles falhar, o rollback desfaz tudo e o banco não fica pela metade.
        const con = await conexao.getConnection();
        try {
            await con.beginTransaction();

            // Os nomes de tipo, prioridade e status viram ids pelas subconsultas.
            // A data_atualizacao o MySQL atualiza sozinho.
            await con.execute(
                `UPDATE demanda
                    SET titulo = ?,
                        descricao = ?,
                        prazo_finalizacao = ?,
                        id_tipo = (SELECT id_tipo FROM tipo_demanda WHERE nome = ?),
                        id_prioridade = (SELECT id_prioridade FROM prioridade WHERE nome = ?),
                        id_status = (SELECT id_status FROM status_demanda WHERE nome_status = ?)
                  WHERE id_demanda = ?`,
                [titulo, descricao, prazo, tipo, prioridade, novoStatus, id]
            );

            // Um registro de histórico para cada coisa que mudou
            for (const mudanca of mudancas) {
                await con.execute(
                    `INSERT INTO historico (tipo_alteracao, valor_anterior, valor_novo, id_usuario, id_demanda)
                     VALUES (?, ?, ?, ?, ?)`,
                    [mudanca[0], mudanca[1], mudanca[2], usuario.id, id]
                );
            }

            await con.commit();
        } catch (erroGravar) {
            await con.rollback();
            throw erroGravar; // cai no catch de baixo, que responde 500
        } finally {
            con.release(); // devolve a conexão ao pool
        }

        res.status(200).json({ mensagem: "Demanda atualizada com sucesso." });
    } catch (erro) {
        console.error("Erro ao editar demanda:", erro);
        res.status(500).json({ mensagem: "Erro ao editar a demanda." });
    }
});

export default router;