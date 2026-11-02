//Feito por Pietro Giati de Favari Ra: 26028869

import express, { Request, Response } from "express";

const servidor = express();
const PORT: number = 3000;

// Rota de teste
// Ao ir no GET do Thunder Client e pôr http://localhost:3000/ mostra a mensagem
servidor.get("/", (req: Request, res: Response) => {
    res.json({
        mensagem: "Backend funcionando!"
    });
});

// Inicia o servidor
servidor.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});