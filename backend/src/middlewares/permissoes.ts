// Feito por Pietro Giati de Favari Ra: 26028869
// Camada de permissões por perfil (Documento de Visão, item 2.1).
//
// Existem 2 tipos de regra:
//  1) Permissão do PERFIL (tabelas perfil_permissao e permissao): "este perfil pode fazer isso?"
//  2) Escopo (tabelas projeto_usuario e demanda_responsavel): "pode fazer isso NESTE projeto/demanda?"
//
// O fluxo de status (quem faz cada transição e quem cancela) fica em regras/status.ts.

import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import conexao from "../config/database";

// Códigos das permissões (iguais aos da tabela "permissao" do banco)
export type CodigoPermissao =
    | "visualizar_projetos"
    | "visualizar_comentarios"
    | "visualizar_historico"
    | "alterar_status"
    | "alterar_prioridade"
    | "atribuir_alterar_responsavel"
    | "editar_demanda"
    | "criar_demanda"
    | "visualizar_demandas"
    | "registrar_comentarios";

// Dados que o middleware "autenticar" guarda em res.locals.usuario
interface UsuarioLogado {
    id: number;
    perfil: string;
}

// Dados da demanda que o middleware "exigirVinculoComDemanda" guarda em res.locals.demanda
export interface DemandaCarregada {
    id: number;
    idProjeto: number;
    status: string;
}

/* ---------- 1) Permissões do perfil ---------- */

// As permissões quase não mudam, então ficam em memória por 1 minuto
// (evita uma consulta ao banco a cada requisição)
const VALIDADE_CACHE_MS = 60 * 1000;
let cachePermissoes: Map<string, string[]> | null = null;
let cacheCarregadoEm = 0;

// Lê do banco quais permissões cada perfil possui
async function carregarPermissoes(): Promise<Map<string, string[]>> {
    const agora = Date.now();

    if (cachePermissoes !== null && agora - cacheCarregadoEm < VALIDADE_CACHE_MS) {
        return cachePermissoes;
    }

    const [linhas] = await conexao.execute<RowDataPacket[]>(
        `SELECT p.nome AS perfil, pe.codigo
           FROM perfil_permissao pp
           INNER JOIN perfil p     ON p.id = pp.id_perfil
           INNER JOIN permissao pe ON pe.id_permissao = pp.id_permissao`
    );

    const mapa = new Map<string, string[]>();
    for (const linha of linhas) {
        const lista = mapa.get(linha.perfil) ?? [];
        lista.push(linha.codigo);
        mapa.set(linha.perfil, lista);
    }

    cachePermissoes = mapa;
    cacheCarregadoEm = agora;
    return mapa;
}

// Devolve a lista de permissões de um perfil (vazia se o perfil não existir)
export async function permissoesDoPerfil(perfil: string): Promise<string[]> {
    const mapa = await carregarPermissoes();
    return mapa.get(perfil) ?? [];
}

// Middleware: libera a rota só se o perfil do usuário tiver a permissão.
// Uso: router.post("/", exigirPermissao("criar_demanda"), ...)
// Precisa vir DEPOIS do "autenticar".
export function exigirPermissao(codigo: CodigoPermissao) {
    return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const usuario = res.locals.usuario as UsuarioLogado | undefined;

            if (!usuario) {
                res.status(401).json({ mensagem: "Usuário não autenticado." });
                return;
            }

            const permissoes = await permissoesDoPerfil(usuario.perfil);

            if (!permissoes.includes(codigo)) {
                res.status(403).json({
                    mensagem: "Seu perfil não tem permissão para realizar esta ação."
                });
                return;
            }

            next();
        } catch (erro) {
            console.error("Erro ao verificar permissão:", erro);
            res.status(500).json({ mensagem: "Erro ao verificar permissões." });
        }
    };
}

/* ---------- 2) Escopo: projeto e demanda ---------- */

// O usuário participa (está vinculado) ao projeto?
export async function participaDoProjeto(idUsuario: number, idProjeto: number): Promise<boolean> {
    const [linhas] = await conexao.execute<RowDataPacket[]>(
        "SELECT 1 FROM projeto_usuario WHERE id_projeto = ? AND id_usuario = ?",
        [idProjeto, idUsuario]
    );
    return linhas.length > 0;
}

// O usuário é responsável por esta demanda?
export async function ehResponsavel(idUsuario: number, idDemanda: number): Promise<boolean> {
    const [linhas] = await conexao.execute<RowDataPacket[]>(
        "SELECT 1 FROM demanda_responsavel WHERE id_demanda = ? AND id_usuario = ?",
        [idDemanda, idUsuario]
    );
    return linhas.length > 0;
}

// Middleware para rotas que recebem "id_projeto" no corpo (ex.: criar demanda).
// Confere se o projeto existe e está ativo e, se o usuário não for Administrador,
// se ele participa do projeto.
export async function exigirVinculoComProjeto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const usuario = res.locals.usuario as UsuarioLogado | undefined;

        if (!usuario) {
            res.status(401).json({ mensagem: "Usuário não autenticado." });
            return;
        }

        const idProjeto = Number(req.body?.id_projeto);

        if (!Number.isInteger(idProjeto) || idProjeto <= 0) {
            res.status(400).json({ mensagem: "Selecione um projeto." });
            return;
        }

        const [projetos] = await conexao.execute<RowDataPacket[]>(
            "SELECT ativo_projeto FROM projeto WHERE id_projeto = ?",
            [idProjeto]
        );

        if (projetos.length === 0 || !projetos[0].ativo_projeto) {
            res.status(400).json({ mensagem: "Projeto não encontrado ou inativo." });
            return;
        }

        if (usuario.perfil !== "Administrador" && !(await participaDoProjeto(usuario.id, idProjeto))) {
            res.status(403).json({ mensagem: "Você não participa deste projeto." });
            return;
        }

        next();
    } catch (erro) {
        console.error("Erro ao verificar vínculo com o projeto:", erro);
        res.status(500).json({ mensagem: "Erro ao verificar permissões." });
    }
}

// Middleware para rotas com "/:id" de demanda (detalhes, editar, status, comentários...).
// Confere se a demanda existe e, se o usuário não for Administrador, se ele participa
// do projeto dela. Deixa os dados da demanda em res.locals.demanda.
export async function exigirVinculoComDemanda(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const usuario = res.locals.usuario as UsuarioLogado | undefined;

        if (!usuario) {
            res.status(401).json({ mensagem: "Usuário não autenticado." });
            return;
        }

        const id = Number(String(req.params.id));

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensagem: "Id da demanda inválido." });
            return;
        }

        const [demandas] = await conexao.execute<RowDataPacket[]>(
            `SELECT d.id_demanda, d.id_projeto, s.nome_status AS status
               FROM demanda d
               INNER JOIN status_demanda s ON s.id_status = d.id_status
              WHERE d.id_demanda = ?`,
            [id]
        );

        if (demandas.length === 0) {
            res.status(404).json({ mensagem: "Demanda não encontrada." });
            return;
        }

        const idProjeto = demandas[0].id_projeto as number;

        if (usuario.perfil !== "Administrador" && !(await participaDoProjeto(usuario.id, idProjeto))) {
            res.status(403).json({ mensagem: "Você não participa do projeto desta demanda." });
            return;
        }

        const demanda: DemandaCarregada = { id, idProjeto, status: demandas[0].status };
        res.locals.demanda = demanda;

        next();
    } catch (erro) {
        console.error("Erro ao verificar vínculo com a demanda:", erro);
        res.status(500).json({ mensagem: "Erro ao verificar permissões." });
    }
}

// Middleware: o Membro da Equipe só mexe em demandas atribuídas a ele.
// Administrador e Líder passam direto. Precisa vir DEPOIS do "exigirVinculoComDemanda".
export async function exigirResponsavelSeMembro(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const usuario = res.locals.usuario as UsuarioLogado | undefined;
        const demanda = res.locals.demanda as DemandaCarregada | undefined;

        if (!usuario || !demanda) {
            res.status(500).json({ mensagem: "Verificação de permissões incompleta." });
            return;
        }

        if (usuario.perfil === "Membro da Equipe" && !(await ehResponsavel(usuario.id, demanda.id))) {
            res.status(403).json({
                mensagem: "O Membro da Equipe só altera demandas atribuídas a ele."
            });
            return;
        }

        next();
    } catch (erro) {
        console.error("Erro ao verificar responsável da demanda:", erro);
        res.status(500).json({ mensagem: "Erro ao verificar permissões." });
    }
}