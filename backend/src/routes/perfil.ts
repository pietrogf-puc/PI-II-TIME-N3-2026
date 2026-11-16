// Feito por Pietro Giati de Favari Ra: 26028869
// Rota GET /perfil: confirma o token e devolve o usuário e as permissões do perfil dele.
// O frontend usa essa lista para mostrar ou esconder botões conforme o perfil.
import { Router, Request, Response } from "express";
import { autenticar } from "../middlewares/autenticacao";
import { permissoesDoPerfil } from "../middlewares/permissoes";

const router = Router();

router.get("/", autenticar, async (_req: Request, res: Response) => {
    try {
        const usuario = res.locals.usuario as { id: number; perfil: string };
        const permissoes = await permissoesDoPerfil(usuario.perfil);

        res.json({
            mensagem: "Acesso autorizado!",
            usuario,
            permissoes
        });
    } catch (erro) {
        console.error("Erro ao buscar permissões:", erro);
        res.status(500).json({ mensagem: "Erro ao buscar permissões." });
    }
});

export default router;