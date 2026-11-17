// Feito por Pietro Giati de Favari Ra: 26028869
// Configuração do pool de conexões com o MySQL (dados vêm do .env).
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const conexao = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default conexao;