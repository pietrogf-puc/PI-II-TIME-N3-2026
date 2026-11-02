import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";
import conexao from "../config/database";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";

const router = Router();

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        mensagem: "Muitas tentativas de login. Tente novamente em 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false
});

interface Usuario extends RowDataPacket {
    id_usuario: number;
    nome: string;
    email: string;
    senha_hash: string;
    ativo: boolean;
    perfil: string;
}

router.post("/", limiteLogin, async (req: Request, res: Response) => {
    try {
        const { email, senha } = req.body;

        // Verifica se os campos foram preenchidos
        if (
            typeof email !== "string" ||
            typeof senha !== "string" ||
            email.trim() === "" ||
            senha.trim() === ""
        ) {
            return res.status(400).json({
                mensagem: "Informe o e-mail e a senha."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const dominiosPermitidos = [
            "gmail.com",
            "puccampinas.edu.br",
            "puc-campinas.edu.br"
        ];

        const dominioPermitido = dominiosPermitidos.some(
            dominio => emailNormalizado.endsWith(`@${dominio}`)
        );

        if (!formatoEmail.test(emailNormalizado) || !dominioPermitido) {
            return res.status(400).json({
                mensagem: "Informe um e-mail válido e permitido."
            });
        }
        // Busca o usuário e seu perfil no banco
        const [usuarios] = await conexao.execute<Usuario[]>(
            `SELECT
                u.id_usuario,
                u.nome,
                u.email,
                u.senha_hash,
                u.ativo,
                p.nome AS perfil
            FROM usuario u
            INNER JOIN perfil p ON u.id_perfil = p.id
            WHERE u.email = ?
            LIMIT 1`,
            [emailNormalizado]
        );

        // Verifica se o usuário existe
        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos."
            });
        }

        const usuario = usuarios[0];

        // Verifica se a conta está ativa
        if (!usuario.ativo) {
            return res.status(403).json({
                mensagem: "Esta conta está desativada."
            });
        }

        // Compara a senha digitada com o hash armazenado
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos."
            });
        }

        const segredoJWT = process.env.JWT_SECRET;

        if (!segredoJWT) {
            throw new Error("JWT_SECRET não configurado no .env");
        }

        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                perfil: usuario.perfil
            },
            segredoJWT,
            {
                expiresIn: "2h"
            }
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token,
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil
            }
        });
    } catch (erro) {
        console.error("Erro no login:", erro);

        return res.status(500).json({
            mensagem: "Erro interno ao realizar login."
        });
    }
});

export default router;