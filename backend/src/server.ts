//Feito por Pietro Giati de Favari Ra: 26028869

import express, { Request, Response } from "express";
import loginRouter from "./routes/login";
import conexao from "./config/database";
import { autenticar } from "./middlewares/autenticacao";
import cors from "cors";

const servidor = express();
servidor.use(express.json());
servidor.use(cors());

// Rota de login
servidor.use("/login", loginRouter);

const PORT: number = 3000;

// Rota de teste
// Ao ir no GET do Thunder Client e pôr http://localhost:3000/ mostra a mensagem
servidor.get("/", (req: Request, res: Response) => {
    res.json({
        mensagem: "Backend funcionando!"
    });
});

// Rota de teste do MySQL
servidor.get("/teste-banco", async (_req: Request, res: Response) => {
    try {
        await conexao.query("SELECT 1");

        res.json({
            mensagem: "Conexão com MySQL funcionando!"
        });
    } catch (erro) {
        console.error("Erro ao conectar com MySQL:", erro);

        res.status(500).json({
            mensagem: "Erro na conexão com o banco de dados."
        });
    }
});

servidor.get("/perfil", autenticar, (req, res) => {
    res.json({
        mensagem: "Acesso autorizado!",
        usuario: res.locals.usuario
    });
});

// Inicia o servidor
servidor.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});