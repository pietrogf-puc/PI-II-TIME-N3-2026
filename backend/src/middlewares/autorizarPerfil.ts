// Feito por Pietro Giati de Favari Ra: 26028869
// Middleware que libera a rota somente para os perfis informados.
import { Request, Response, NextFunction } from "express";

type PerfilSistema =
    | "Administrador"
    | "Líder de Projeto"
    | "Membro da Equipe";

export function autorizarPerfil(...perfisPermitidos: PerfilSistema[]) {
    return (req: Request, res: Response, next: NextFunction): void => {

        const usuario = res.locals.usuario as {
            id: number;
            perfil: string;
        } | undefined;

        if (!usuario) {
            res.status(401).json({
                mensagem: "Usuário não autenticado."
            });
            return;
        }

        if (!perfisPermitidos.includes(usuario.perfil as PerfilSistema)) {
            res.status(403).json({
                mensagem: "Você não tem permissão para acessar este recurso."
            });
            return;
        }

        next();
    };
}
