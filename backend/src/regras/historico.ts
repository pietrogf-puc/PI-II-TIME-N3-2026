/*
  Arquivo: historico.ts
  Autor: Rafael Carvalho Soares (RA 26029352)
  Projeto: Sistema de Acompanhamento de Demandas - PI II - Time N3
  Monta a frase que aparece na linha do tempo da tela de detalhes
  a partir de um registro da tabela historico.
*/

// "Status" -> "o status", para a frase ficar natural
const CAMPO_COM_ARTIGO: Record<string, string> = {
  "Status": "o status",
  "Prioridade": "a prioridade",
  "Prazo": "o prazo",
  "Responsável": "o responsável"
};

// "2026-11-20" -> "20/11/2026" (outros textos ficam iguais)
export function formatarValor(valor: string | null): string {
  if (valor === null) {
    return "";
  }
  const data = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  return data ? `${data[3]}/${data[2]}/${data[1]}` : valor;
}

// ex.: ("Status", "Aberta", "Em andamento") -> 'Alterou o status de "Aberta" para "Em andamento"'
export function descreverAlteracao(tipo: string, anterior: string | null, novo: string | null): string {
  if (tipo === "Criação") {
    return "Criou a demanda";
  }

  const campo = CAMPO_COM_ARTIGO[tipo] || tipo;
  const semAnterior = anterior === null || anterior === "";
  const semNovo = novo === null || novo === "";

  if (semAnterior && semNovo) {
    return `Alterou ${campo}`;
  }
  if (semAnterior) {
    return `Definiu ${campo} como "${formatarValor(novo)}"`;
  }
  if (semNovo) {
    return `Removeu ${campo} "${formatarValor(anterior)}"`;
  }
  return `Alterou ${campo} de "${formatarValor(anterior)}" para "${formatarValor(novo)}"`;
}
