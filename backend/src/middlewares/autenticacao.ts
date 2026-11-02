
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DadosToken extends JwtPayload {
    id: number;
    perfil: string;
}

export function autenticar(
    req: Request,
    res: Response,
    next: NextFunction
): void {
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

    try {
        const dados = jwt.verify(token, segredoJWT) as DadosToken;

        res.locals.usuario = {
            id: dados.id,
            perfil: dados.perfil
        };

        next();

    } catch {
        res.status(401).json({
            mensagem: "Token inválido ou expirado."
        });
        return;
    }
}
