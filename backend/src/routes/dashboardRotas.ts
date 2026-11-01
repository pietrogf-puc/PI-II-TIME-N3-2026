/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  dashboardRotas.ts: rota GET /dashboard, que devolve os indicadores em JSON.
  Filtros opcionais na URL: /dashboard?projeto=1&dataInicio=2026-10-01&dataFim=2026-10-31

  Respostas:
    200 - indicadores calculados
    400 - filtro inválido: { erro: mensagem, campos: [campos com problema] }
    500 - falha ao consultar o banco: { erro: mensagem }
*/

import { Router } from 'express';
import { calcularDashboard, FiltrosDashboard, validarFiltros } from '../services/dashboardCalculos';
import { buscarDemandas, buscarProjetos, contarTodasDemandas } from '../repositories/dashboardRepositorio';

export const rotasDashboard = Router();

// Libera a chamada pela tela, que roda em outro endereço (ex.: Live Server na
// porta 5500) e seria bloqueada pelo navegador sem este cabeçalho (CORS).
rotasDashboard.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Lê um parâmetro da URL como texto; qualquer outro formato vira "sem filtro"
function lerParametro(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

rotasDashboard.get('/dashboard', async (req, res) => {
  const filtros: FiltrosDashboard = {
    projeto: lerParametro(req.query.projeto),
    dataInicio: lerParametro(req.query.dataInicio),
    dataFim: lerParametro(req.query.dataFim)
  };

  // 1) Valida os filtros antes de consultar o banco
  const erro = validarFiltros(filtros);
  if (erro) {
    res.status(400).json({ erro: erro.mensagem, campos: erro.campos });
    return;
  }

  try {
    // 2) Confere se o projeto pedido existe
    const projetos = await buscarProjetos();
    if (filtros.projeto && !projetos.some((projeto) => String(projeto.id) === filtros.projeto)) {
      res.status(400).json({ erro: 'Projeto inválido. Escolha um projeto da lista.', campos: ['projeto'] });
      return;
    }

    // 3) Busca as demandas e calcula os indicadores
    const demandas = await buscarDemandas(filtros);
    const totalGeral = await contarTodasDemandas();
    res.json({ ...calcularDashboard(demandas, new Date()), totalGeral, projetos });
  } catch (erroBanco) {
    // O detalhe técnico fica só no terminal do servidor, não vai para o usuário
    console.error('Erro ao consultar o dashboard:', erroBanco);
    res.status(500).json({ erro: 'Não foi possível consultar as demandas no banco de dados. Tente novamente.' });
  }
});
