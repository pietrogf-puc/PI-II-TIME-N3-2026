/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  dashboardRepositorio.ts: consultas ao banco usadas pelo dashboard.
  Todo o SQL do dashboard fica aqui, separado das regras de negócio.
*/

import { RowDataPacket } from 'mysql2/promise';
import { banco } from '../database/conexao';
import { Demanda, FiltrosDashboard } from '../services/dashboardCalculos';

export interface Projeto {
  id: number;
  nome: string;
}

// Projetos cadastrados, para preencher o filtro da tela
export async function buscarProjetos(): Promise<Projeto[]> {
  const [linhas] = await banco.query<RowDataPacket[]>('SELECT id, nome FROM projetos ORDER BY nome');
  return linhas as Projeto[];
}

// Total de demandas no banco, sem nenhum filtro
export async function contarTodasDemandas(): Promise<number> {
  const [linhas] = await banco.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM demandas');
  return Number(linhas[0].total);
}

// Demandas que passam nos filtros de projeto e de período de criação.
// Os valores entram pelos "?": o driver do banco os trata como dados, o que
// impede SQL Injection. Nunca se deve colar o texto do usuário dentro do SQL.
export async function buscarDemandas(filtros: FiltrosDashboard): Promise<Demanda[]> {
  const condicoes: string[] = [];
  const valores: string[] = [];

  if (filtros.projeto) {
    condicoes.push('d.projeto_id = ?');
    valores.push(filtros.projeto);
  }
  if (filtros.dataInicio) {
    condicoes.push('DATE(d.data_criacao) >= ?');
    valores.push(filtros.dataInicio);
  }
  if (filtros.dataFim) {
    condicoes.push('DATE(d.data_criacao) <= ?');
    valores.push(filtros.dataFim);
  }

  const where = condicoes.length > 0 ? 'WHERE ' + condicoes.join(' AND ') : '';

  // LEFT JOIN mantém as demandas que ainda não têm responsável
  const [linhas] = await banco.query<RowDataPacket[]>(
    `SELECT d.id, d.titulo, d.tipo, d.prioridade, d.status, d.prazo,
            u.nome AS responsavel
       FROM demandas d
       LEFT JOIN usuarios u ON u.id = d.responsavel_id
       ${where}`,
    valores
  );
  return linhas as Demanda[];
}
