/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  conexao.ts: conexão da API com o banco MySQL.
*/

import mysql from 'mysql2/promise';

// Lê as configurações do arquivo .env (modelo em .env.example).
// Sem o arquivo, a API continua iniciando e usa os valores padrão abaixo.
try {
  process.loadEnvFile();
} catch {
  console.warn('Arquivo .env não encontrado: usando as configurações padrão do banco.');
}

// Um pool mantém conexões abertas e as reaproveita a cada consulta.
// A primeira conexão só acontece na primeira consulta, então a API não cai ao
// iniciar se o banco estiver desligado.
export const banco = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'sistema_demandas',
  charset: 'utf8mb4',
  // Devolve as datas como texto 'AAAA-MM-DD', sem conversão de fuso horário
  dateStrings: true
});
