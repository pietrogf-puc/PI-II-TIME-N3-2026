/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  dashboardCalculos.test.js: testes dos cálculos do dashboard.
  Usa o node:test, que já vem com o Node (não precisa instalar nada).
  Como rodar: dentro da pasta backend, "npm test". O comando compila o
  TypeScript para a pasta lib e roda este arquivo.
*/

const test = require('node:test');
const assert = require('node:assert');
const { textoParaData, diasAte, validarFiltros, calcularDashboard } = require('../lib/services/dashboardCalculos');

// Dia fixo para os testes darem sempre o mesmo resultado: 10/11/2026
const HOJE = new Date(2026, 10, 10); // no JavaScript, o mês 10 é novembro

// Monta uma demanda de teste; "mudancas" troca só os campos que interessam
function criarDemanda(id, mudancas) {
  return Object.assign({
    id: id,
    titulo: 'Demanda ' + id,
    tipo: 'Tarefa',
    prioridade: 'Média',
    status: 'Aberta',
    responsavel: null,
    prazo: '2026-12-01'
  }, mudancas);
}

// ----- textoParaData -----

test('textoParaData: aceita uma data válida', function () {
  const data = textoParaData('2026-11-10');
  assert.strictEqual(data.getFullYear(), 2026);
  assert.strictEqual(data.getMonth(), 10);
  assert.strictEqual(data.getDate(), 10);
});

test('textoParaData: recusa 31/02, que não existe', function () {
  assert.strictEqual(textoParaData('2026-02-31'), null);
});

test('textoParaData: recusa texto fora do formato AAAA-MM-DD', function () {
  assert.strictEqual(textoParaData('10/11/2026'), null);
  assert.strictEqual(textoParaData('abc'), null);
  assert.strictEqual(textoParaData(''), null);
});

// ----- diasAte -----

test('diasAte: prazo no futuro dá número positivo', function () {
  assert.strictEqual(diasAte('2026-11-13', HOJE), 3);
});

test('diasAte: prazo de hoje dá zero, mesmo no fim do dia', function () {
  assert.strictEqual(diasAte('2026-11-10', new Date(2026, 10, 10, 23, 59)), 0);
});

test('diasAte: demanda atrasada dá número negativo', function () {
  assert.strictEqual(diasAte('2026-11-08', HOJE), -2);
});

test('diasAte: prazo inválido devolve null', function () {
  assert.strictEqual(diasAte('2026-02-31', HOJE), null);
});

// ----- validarFiltros -----

test('validarFiltros: sem filtros ou com filtros certos devolve null', function () {
  assert.strictEqual(validarFiltros({ projeto: '', dataInicio: '', dataFim: '' }), null);
  assert.strictEqual(validarFiltros({ projeto: '2', dataInicio: '2026-11-01', dataFim: '2026-11-10' }), null);
  // início e fim no mesmo dia também vale
  assert.strictEqual(validarFiltros({ projeto: '', dataInicio: '2026-11-10', dataFim: '2026-11-10' }), null);
});

test('validarFiltros: período invertido aponta os dois campos de data', function () {
  const erro = validarFiltros({ projeto: '', dataInicio: '2026-11-10', dataFim: '2026-11-01' });
  assert.deepStrictEqual(erro.campos, ['dataInicio', 'dataFim']);
  assert.match(erro.mensagem, /Período inválido/);
});

test('validarFiltros: data que não existe é recusada', function () {
  assert.deepStrictEqual(validarFiltros({ projeto: '', dataInicio: '2026-02-31', dataFim: '' }).campos, ['dataInicio']);
  assert.deepStrictEqual(validarFiltros({ projeto: '', dataInicio: '', dataFim: 'ontem' }).campos, ['dataFim']);
});

test('validarFiltros: projeto só aceita número inteiro positivo', function () {
  ['abc', '0', '-1', '1.5', '1 OR 1=1'].forEach(function (projeto) {
    const erro = validarFiltros({ projeto: projeto, dataInicio: '', dataFim: '' });
    assert.deepStrictEqual(erro.campos, ['projeto'], 'deveria recusar o projeto "' + projeto + '"');
  });
});

// ----- calcularDashboard -----

test('calcularDashboard: conta o total e as quantidades por status, prioridade e tipo', function () {
  const resumo = calcularDashboard([
    criarDemanda(1, { status: 'Aberta', prioridade: 'Crítica', tipo: 'Defeito' }),
    criarDemanda(2, { status: 'Em andamento', prioridade: 'Alta', tipo: 'Tarefa' }),
    criarDemanda(3, { status: 'Concluída', prioridade: 'Alta', tipo: 'Tarefa' })
  ], HOJE);

  assert.strictEqual(resumo.total, 3);
  assert.deepStrictEqual(resumo.porStatus, { 'Aberta': 1, 'Em andamento': 1, 'Em revisão': 0, 'Concluída': 1, 'Cancelada': 0 });
  assert.deepStrictEqual(resumo.porPrioridade, { 'Crítica': 1, 'Alta': 2, 'Média': 0, 'Baixa': 0 });
  assert.deepStrictEqual(resumo.porTipo, { 'Tarefa': 2, 'Defeito': 1, 'Melhoria': 0, 'Documentação': 0 });
});

test('calcularDashboard: sem demandas devolve tudo zerado', function () {
  const resumo = calcularDashboard([], HOJE);
  assert.strictEqual(resumo.total, 0);
  assert.strictEqual(resumo.porStatus['Aberta'], 0);
  assert.deepStrictEqual(resumo.criticasEmAberto, []);
  assert.deepStrictEqual(resumo.proximasDoPrazo, []);
});

test('calcularDashboard: concluída e cancelada ficam fora de "em aberto"', function () {
  const resumo = calcularDashboard([
    criarDemanda(1, { prioridade: 'Crítica', status: 'Aberta', prazo: '2026-11-12' }),
    criarDemanda(2, { prioridade: 'Crítica', status: 'Concluída', prazo: '2026-11-12' }),
    criarDemanda(3, { prioridade: 'Crítica', status: 'Cancelada', prazo: '2026-11-12' })
  ], HOJE);

  // As três contam no total, mas só a aberta entra nas listas
  assert.strictEqual(resumo.total, 3);
  assert.deepStrictEqual(resumo.criticasEmAberto.map(function (d) { return d.id; }), [1]);
  assert.deepStrictEqual(resumo.proximasDoPrazo.map(function (d) { return d.id; }), [1]);
});

test('calcularDashboard: próximas do prazo traz atrasada, vence hoje e até 7 dias, em ordem', function () {
  const resumo = calcularDashboard([
    criarDemanda(1, { prazo: '2026-11-18' }), // 8 dias: fica de fora
    criarDemanda(2, { prazo: '2026-11-17' }), // 7 dias: entra
    criarDemanda(3, { prazo: '2026-11-10' }), // vence hoje
    criarDemanda(4, { prazo: '2026-11-08' })  // atrasada há 2 dias
  ], HOJE);

  assert.deepStrictEqual(
    resumo.proximasDoPrazo.map(function (d) { return [d.id, d.diasRestantes]; }),
    [[4, -2], [3, 0], [2, 7]]
  );
});

test('calcularDashboard: crítica sem prazo aparece no fim da lista de críticas', function () {
  const resumo = calcularDashboard([
    criarDemanda(1, { prioridade: 'Crítica', prazo: null }),
    criarDemanda(2, { prioridade: 'Crítica', prazo: '2026-11-11' })
  ], HOJE);

  assert.deepStrictEqual(resumo.criticasEmAberto.map(function (d) { return d.id; }), [2, 1]);
  assert.strictEqual(resumo.criticasEmAberto[1].diasRestantes, null);
  // Sem prazo não tem como estar "próxima do prazo"
  assert.deepStrictEqual(resumo.proximasDoPrazo.map(function (d) { return d.id; }), [2]);
});

test('calcularDashboard: valor desconhecido é ignorado na contagem e gera aviso', function (t) {
  // Troca o console.warn por uma versão que só conta as chamadas
  const aviso = t.mock.method(console, 'warn', function () {});

  const resumo = calcularDashboard([
    criarDemanda(1, { status: 'Aberta' }),
    criarDemanda(2, { status: 'ConcluÃ­da' }) // acento quebrado, como viria de um banco mal configurado
  ], HOJE);

  // Só existem as 5 chaves do escopo, e todas com número (nada de null)
  assert.deepStrictEqual(resumo.porStatus, { 'Aberta': 1, 'Em andamento': 0, 'Em revisão': 0, 'Concluída': 0, 'Cancelada': 0 });
  assert.strictEqual(aviso.mock.callCount(), 1);
});
