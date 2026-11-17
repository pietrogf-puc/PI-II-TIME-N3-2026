// Feito por Pietro Giati de Favari Ra: 26028869
// Middleware que confere o token JWT enviado no cabeçalho Authorization.
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import conexao from "../config/database";

interface DadosToken extends JwtPayload {
    id: number;
    perfil: string;
}

export async function autenticar(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const cabecalho = req.headers.authorization;

    if (!cabecalho) {
        res.status(401).json({
            mensagem: "Token não informado."
        });
        return;
    }

    const [tipo, token] = cabecalho.split(" ");

    if (tipo !== "Bearer" || !token) {
        res.status(401).json({
            mensagem: "Formato de token inválido."
        });
        return;
    }

    const segredoJWT = process.env.JWT_SECRET;

    if (!segredoJWT) {
        res.status(500).json({
            mensagem: "Configuração de autenticação ausente."
        });
        return;
    }

    let dados: DadosToken;

    try {
        dados = jwt.verify(token, segredoJWT) as DadosToken;
    } catch {
        res.status(401).json({
            mensagem: "Token inválido ou expirado."
        });
        return;
    }

    try {
        // Confere no banco se o usuário ainda existe, está ativo e qual é o perfil ATUAL
        // (assim, uma conta desativada ou um perfil alterado valem na hora, sem esperar o token expirar)
        const [usuarios] = await conexao.execute<RowDataPacket[]>(
            `SELECT u.ativo, p.nome AS perfil
               FROM usuario u
               INNER JOIN perfil p ON p.id = u.id_perfil
              WHERE u.id_usuario = ?`,
            [dados.id]
        );

        if (usuarios.length === 0 || !usuarios[0].ativo) {
            res.status(401).json({
                mensagem: "Usuário inexistente ou desativado."
            });
            return;
        }

        res.locals.usuario = {
            id: dados.id,
            perfil: usuarios[0].perfil
        };

        next();

    } catch (erro) {
        console.error("Erro ao validar o usuário do token:", erro);
        res.status(500).json({
            mensagem: "Erro ao validar o usuário."
        });
    }
}