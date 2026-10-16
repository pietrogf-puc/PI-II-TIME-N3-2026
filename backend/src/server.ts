//Feito por Pietro Giati de Favari Ra: 26028869

import express from "express"
const servidor = express();
const PORT = 3000


// Rota de teste
//Ao ir no get do thunder client e por http://localhost:3000/ mostra a mensagem
servidor.get('/', (req, res) => {
    res.json({
        mensagem: 'Backend funcionando!'
    });
});


//Inicia o servidor
servidor.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`)
});