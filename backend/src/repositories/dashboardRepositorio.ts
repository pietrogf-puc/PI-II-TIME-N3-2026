/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  dashboardRepositorio.ts: consultas ao banco usadas pelo dashboard.
  Todo o SQL do dashboard fica aqui, separado das regras de negócio.
  As tabelas são as do database/schema.sql do grupo.
*/

import { RowDataPacket } from 'mysql2';
import conexao from '../config/database';
import { Demanda, FiltrosDashboard } from '../services/dashboardCalculos';

export interface Projeto {
  id: number;
  nome: string;
}

// Usuário logado, como o middleware de autenticação guarda a partir do token
export interface UsuarioLogado {
  id: number;
  perfil: string;
}

// Regra de acesso: o Administrador vê todos os projetos; os demais perfis
// só veem os projetos em que participam (tabela projeto_usuario).
// Devolve o trecho de SQL e o valor que ele usa, ou null para o Administrador.
function restricaoDeAcesso(usuario: UsuarioLogado, colunaProjeto: string): { sql: string; valor: number } | null {
  if (usuario.perfil === 'Administrador') {
    return null;
  }
  return {
    sql: `${colunaProjeto} IN (SELECT id_projeto FROM projeto_usuario WHERE id_usuario = ?)`,
    valor: usuario.id
  };
}

// Projetos que o usuário pode ver, para preencher o filtro da tela
export async function buscarProjetos(usuario: UsuarioLogado): Promise<Projeto[]> {
  const acesso = restricaoDeAcesso(usuario, 'p.id_projeto');
  const [linhas] = await conexao.query<RowDataPacket[]>(
    `SELECT p.id_projeto AS id, p.nome_projeto AS nome
       FROM projeto p
       ${acesso ? 'WHERE ' + acesso.sql : ''}
      ORDER BY p.nome_projeto`,
    acesso ? [acesso.valor] : []
  );
  return linhas as Projeto[];
}

// Total de demandas que o usuário pode ver, sem os filtros da tela
export async function contarDemandasVisiveis(usuario: UsuarioLogado): Promise<number> {
  const acesso = restricaoDeAcesso(usuario, 'd.id_projeto');
  const [linhas] = await conexao.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM demanda d ${acesso ? 'WHERE ' + acesso.sql : ''}`,
    acesso ? [acesso.valor] : []
  );
  return Number(linhas[0].total);
}

// Demandas visíveis ao usuário que passam nos filtros de projeto e período.
// Os valores entram pelos "?": o driver do banco os trata como dados, o que
// impede SQL Injection. Nunca se deve colar o texto do usuário dentro do SQL.
export async function buscarDemandas(filtros: FiltrosDashboard, usuario: UsuarioLogado): Promise<Demanda[]> {
  const condicoes: string[] = [];
  const valores: (string | number)[] = [];

  const acesso = restricaoDeAcesso(usuario, 'd.id_projeto');
  if (acesso) {
    condicoes.push(acesso.sql);
    valores.push(acesso.valor);
  }
  if (filtros.projeto) {
    condicoes.push('d.id_projeto = ?');
    valores.push(Number(filtros.projeto));
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

  // Tipo, prioridade e status ficam em tabelas próprias, por isso os JOINs.
  // Uma demanda pode ter vários responsáveis (tabela demanda_responsavel):
  // o subselect junta os nomes em um texto só, como "Ana, Bruno".
  // DATE_FORMAT devolve o prazo como texto 'AAAA-MM-DD', sem mudança de fuso.
  const [linhas] = await conexao.query<RowDataPacket[]>(
    `SELECT d.id_demanda AS id,
            d.titulo,
            t.nome AS tipo,
            p.nome AS prioridade,
            s.nome_status AS status,
            DATE_FORMAT(d.prazo_finalizacao, '%Y-%m-%d') AS prazo,
            (SELECT GROUP_CONCAT(u.nome ORDER BY u.nome SEPARATOR ', ')
               FROM demanda_responsavel dr
               JOIN usuario u ON u.id_usuario = dr.id_usuario
              WHERE dr.id_demanda = d.id_demanda) AS responsavel
       FROM demanda d
       JOIN tipo_demanda t ON t.id_tipo = d.id_tipo
       JOIN prioridade p ON p.id_prioridade = d.id_prioridade
       JOIN status_demanda s ON s.id_status = d.id_status
       ${where}`,
    valores
  );
  return linhas as Demanda[];
}
