/*
  Arquivo: detalhesRegras.test.js
  Autor: Rafael Carvalho Soares (RA 26029352)
  Projeto: Sistema de Acompanhamento de Demandas - PI II - Time N3
  Testes das regras da tela de detalhes (status e texto do histórico).
  Rodar com: npm test
*/

const test = require("node:test");
const assert = require("node:assert");

const {
  ehStatusValido,
  verificarMudancaDeStatus,
  verificarCancelamento,
  proximosStatusPermitidos
} = require("../lib/regras/status");
const { formatarValor, descreverAlteracao } = require("../lib/regras/historico");

const LIDER = "Líder de Projeto";
const ADMIN = "Administrador";
const MEMBRO = "Membro da Equipe";

// ----- status -----

test("só aceita os 5 status do sistema", () => {
  assert.strictEqual(ehStatusValido("Aberta"), true);
  assert.strictEqual(ehStatusValido("Em revisão"), true);
  assert.strictEqual(ehStatusValido("Finalizada"), false);
  assert.strictEqual(ehStatusValido(""), false);
  assert.strictEqual(ehStatusValido(3), false);
});

test("caminho normal: Aberta -> Em andamento -> Em revisão -> Concluída", () => {
  assert.deepStrictEqual(verificarMudancaDeStatus("Aberta", "Em andamento", LIDER), { permitido: true });
  assert.deepStrictEqual(verificarMudancaDeStatus("Em andamento", "Em revisão", LIDER), { permitido: true });
  assert.deepStrictEqual(verificarMudancaDeStatus("Em revisão", "Concluída", LIDER), { permitido: true });
});

test("Em revisão pode voltar para Em andamento", () => {
  assert.deepStrictEqual(verificarMudancaDeStatus("Em revisão", "Em andamento", ADMIN), { permitido: true });
});

test("não pode pular etapa (400)", () => {
  const r = verificarMudancaDeStatus("Aberta", "Concluída", ADMIN);
  assert.strictEqual(r.permitido, false);
  assert.strictEqual(r.codigo, 400);
});

test("não pode mudar para o mesmo status (400)", () => {
  const r = verificarMudancaDeStatus("Aberta", "Aberta", LIDER);
  assert.strictEqual(r.codigo, 400);
});

test("Concluída e Cancelada não mudam mais (400)", () => {
  assert.strictEqual(verificarMudancaDeStatus("Concluída", "Em andamento", ADMIN).codigo, 400);
  assert.strictEqual(verificarMudancaDeStatus("Cancelada", "Aberta", ADMIN).codigo, 400);
});

test("membro faz só Aberta -> Em andamento e Em andamento -> Em revisão", () => {
  assert.deepStrictEqual(verificarMudancaDeStatus("Aberta", "Em andamento", MEMBRO), { permitido: true });
  assert.deepStrictEqual(verificarMudancaDeStatus("Em andamento", "Em revisão", MEMBRO), { permitido: true });
  assert.strictEqual(verificarMudancaDeStatus("Em revisão", "Concluída", MEMBRO).codigo, 403);
  assert.strictEqual(verificarMudancaDeStatus("Em revisão", "Em andamento", MEMBRO).codigo, 403);
});

// ----- cancelamento -----

test("líder e admin cancelam, membro não (403)", () => {
  assert.deepStrictEqual(verificarCancelamento("Em andamento", LIDER), { permitido: true });
  assert.deepStrictEqual(verificarCancelamento("Aberta", ADMIN), { permitido: true });
  assert.strictEqual(verificarCancelamento("Aberta", MEMBRO).codigo, 403);
});

test("não cancela demanda concluída ou já cancelada (400)", () => {
  assert.strictEqual(verificarCancelamento("Concluída", LIDER).codigo, 400);
  assert.strictEqual(verificarCancelamento("Cancelada", LIDER).codigo, 400);
});

// ----- botões que aparecem na tela -----

test("botões de status de cada perfil", () => {
  assert.deepStrictEqual(proximosStatusPermitidos("Aberta", LIDER), ["Em andamento", "Cancelada"]);
  assert.deepStrictEqual(proximosStatusPermitidos("Em revisão", LIDER), ["Em andamento", "Concluída", "Cancelada"]);
  assert.deepStrictEqual(proximosStatusPermitidos("Aberta", MEMBRO), ["Em andamento"]);
  assert.deepStrictEqual(proximosStatusPermitidos("Em revisão", MEMBRO), []);
  assert.deepStrictEqual(proximosStatusPermitidos("Concluída", ADMIN), []);
});

// ----- texto do histórico -----

test("data do banco vira dd/mm/aaaa", () => {
  assert.strictEqual(formatarValor("2026-11-20"), "20/11/2026");
  assert.strictEqual(formatarValor("Alta"), "Alta");
  assert.strictEqual(formatarValor(null), "");
});

test("frases do histórico", () => {
  assert.strictEqual(descreverAlteracao("Criação", null, "Aberta"), "Criou a demanda");
  assert.strictEqual(
    descreverAlteracao("Status", "Aberta", "Em andamento"),
    'Alterou o status de "Aberta" para "Em andamento"'
  );
  assert.strictEqual(
    descreverAlteracao("Prazo", "2026-11-20", "2026-12-01"),
    'Alterou o prazo de "20/11/2026" para "01/12/2026"'
  );
  assert.strictEqual(descreverAlteracao("Responsável", null, "Rafael"), 'Definiu o responsável como "Rafael"');
});

test("responsável removido não fica com texto vazio", () => {
  assert.strictEqual(descreverAlteracao("Responsável", "Rafael", null), 'Removeu o responsável "Rafael"');
});
