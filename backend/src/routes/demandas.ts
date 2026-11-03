// Autor: Gustavo Pietro de Assis Silva | Rotas da Listagem de Demandas | PI II - Time N3
// Rota GET /demandas: lista as demandas do banco, com filtros, busca e ordenação.
import { Router, Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import conexao from "../config/database";
import { autenticar } from "../middlewares/autenticacao";

const router = Router();

// Colunas permitidas para ordenar. Só valores desta lista entram no SQL,
// o que impede SQL injection no parâmetro "ordenar".
const ordens = new Map<string, string>([
    ["dataCriacao", "d.data_criacao"],
    ["prazo", "d.prazo_finalizacao"],
    ["prioridade", "p.ordem"],
    ["status", "s.id_status"]
]);

// GET /demandas?status=&prioridade=&tipo=&busca=&ordenar=
// Exige token JWT (middleware autenticar).
router.get("/", autenticar, async (req: Request, res: Response) => {
    try {
        const { status, prioridade, tipo, busca, ordenar } = req.query;
        const usuario = res.locals.usuario as { id: number; perfil: string };

        const condicoes: string[] = [];
        const valores: (string | number)[] = [];

        // Administrador vê tudo. Líder e Membro só veem os projetos em que participam.
        if (usuario.perfil !== "Administrador") {
            condicoes.push(
                "d.id_projeto IN (SELECT id_projeto FROM projeto_usuario WHERE id_usuario = ?)"
            );
            valores.push(usuario.id);
        }

        // Cada filtro só entra na consulta se o usuário escolheu algo
        if (typeof status === "string" && status !== "") {
            condicoes.push("s.nome_status = ?");
            valores.push(status);
        }
        if (typeof prioridade === "string" && prioridade !== "") {
            condicoes.push("p.nome = ?");
            valores.push(prioridade);
        }
        if (typeof tipo === "string" && tipo !== "") {
            condicoes.push("t.nome = ?");
            valores.push(tipo);
        }
        if (typeof busca === "string" && busca.trim() !== "") {
            condicoes.push("(d.titulo LIKE ? OR d.descricao LIKE ?)");
            valores.push(`%${busca.trim()}%`, `%${busca.trim()}%`);
        }

        const where = condicoes.length > 0 ? "WHERE " + condicoes.join(" AND ") : "";
        const orderBy =
            (typeof ordenar === "string" && ordens.get(ordenar)) || "d.id_demanda";

        // O responsável fica em outra tabela (demanda_responsavel, relação N:N).
        // O subselect junta os nomes numa só coluna, ou devolve NULL se não houver.
        const sql = `
            SELECT
                d.id_demanda AS id,
                d.titulo,
                d.descricao,
                t.nome AS tipo,
                p.nome AS prioridade,
                s.nome_status AS status,
                pr.nome_projeto AS projeto,
                (SELECT GROUP_CONCAT(u.nome ORDER BY u.nome SEPARATOR ', ')
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
            ORDER BY ${orderBy}`;

        const [linhas] = await conexao.execute<RowDataPacket[]>(sql, valores);
        res.status(200).json(linhas);
    } catch (erro) {
        console.error("Erro ao listar demandas:", erro);
        res.status(500).json({ mensagem: "Erro ao buscar as demandas." });
    }
});

export default router;