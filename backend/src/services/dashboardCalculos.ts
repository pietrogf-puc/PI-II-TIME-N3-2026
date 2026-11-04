/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  dashboardCalculos.ts: regras de negócio do dashboard, em funções puras.
  Elas só recebem dados e devolvem resultados: não acessam o banco nem conhecem
  HTTP. Por isso podem ser testadas sem servidor e sem banco de dados.
*/

// ----- Valores do escopo, na ordem em que aparecem no dashboard -----
export const TIPOS = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'] as const;
export const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'] as const;
export const STATUS = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'] as const;

// Transforma as listas acima em tipos do TypeScript
export type Tipo = (typeof TIPOS)[number];
export type Prioridade = (typeof PRIORIDADES)[number];
export type Status = (typeof STATUS)[number];

// Quantos dias antes do prazo a demanda entra em "próximas do prazo"
export const DIAS_ALERTA_PRAZO = 7;

// Dados de uma demanda usados pelo dashboard. As datas ficam no formato
// 'AAAA-MM-DD'. Responsável e prazo podem estar em branco, conforme o escopo.
export interface Demanda {
  id: number;
  titulo: string;
  tipo: Tipo;
  prioridade: Prioridade;
  status: Status;
  responsavel: string | null;
  prazo: string | null;
}

// Demanda com os dias restantes até o prazo (null quando não há prazo)
export interface DemandaComPrazo extends Demanda {
  diasRestantes: number | null;
}

// Filtros recebidos na URL da rota. Texto vazio significa "sem filtro".
export interface FiltrosDashboard {
  projeto: string;
  dataInicio: string;
  dataFim: string;
}

// Erro de validação: a mensagem para o usuário e os campos com problema
export interface ErroFiltro {
  mensagem: string;
  campos: Array<keyof FiltrosDashboard>;
}

// Objeto com todos os números do dashboard
export interface ResumoDashboard {
  total: number;
  porStatus: Record<Status, number>;
  porPrioridade: Record<Prioridade, number>;
  porTipo: Record<Tipo, number>;
  criticasEmAberto: DemandaComPrazo[];
  proximasDoPrazo: DemandaComPrazo[];
}

// Converte 'AAAA-MM-DD' em Date no fuso local, ou null se a data não existir.
// new Date('2026-10-19') usaria o fuso UTC e, no Brasil, viraria o dia anterior.
export function textoParaData(texto: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return null;
  }
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  // Em uma data como 31/02, o JavaScript pula para março; aqui isso é recusado
  if (data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }
  return data;
}

// Dias de "hoje" até o prazo: positivo = falta; 0 = vence hoje; negativo = atrasada
export function diasAte(prazo: string, hoje: Date): number | null {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const dataPrazo = textoParaData(prazo);
  if (!dataPrazo) {
    return null;
  }
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  // Math.round corrige diferenças de 1 hora causadas por horário de verão
  return Math.round((dataPrazo.getTime() - inicioDeHoje.getTime()) / MS_POR_DIA);
}

// Valida os filtros no servidor, mesmo que a tela já tenha validado, porque a
// rota pode ser chamada sem passar pela tela. Devolve null se estiver tudo certo.
export function validarFiltros(filtros: FiltrosDashboard): ErroFiltro | null {
  if (filtros.projeto && !/^[1-9]\d*$/.test(filtros.projeto)) {
    return { mensagem: 'Projeto inválido. Escolha um projeto da lista.', campos: ['projeto'] };
  }

  const inicio = filtros.dataInicio ? textoParaData(filtros.dataInicio) : null;
  const fim = filtros.dataFim ? textoParaData(filtros.dataFim) : null;

  if (filtros.dataInicio && !inicio) {
    return { mensagem: 'A data inicial é inválida.', campos: ['dataInicio'] };
  }
  if (filtros.dataFim && !fim) {
    return { mensagem: 'A data final é inválida.', campos: ['dataFim'] };
  }
  if (inicio && fim && inicio > fim) {
    return {
      mensagem: 'Período inválido: a data inicial não pode ser depois da data final.',
      campos: ['dataInicio', 'dataFim']
    };
  }
  return null;
}

// Conta quantas demandas existem para cada valor de um campo. Todos os valores
// começam em 0, para aparecerem no dashboard mesmo sem nenhuma demanda.
function contarPor<T extends string>(valores: readonly T[], valorDaDemanda: (demanda: Demanda) => T, demandas: Demanda[]): Record<T, number> {
  const contagem = {} as Record<T, number>;
  valores.forEach((valor) => {
    contagem[valor] = 0;
  });
  demandas.forEach((demanda) => {
    contagem[valorDaDemanda(demanda)]++;
  });
  return contagem;
}

// Em aberto = qualquer status que não seja Concluída ou Cancelada
function estaEmAberto(demanda: Demanda): boolean {
  return demanda.status !== 'Concluída' && demanda.status !== 'Cancelada';
}

// Acrescenta os dias restantes sem alterar a demanda original
function comDiasRestantes(demanda: Demanda, hoje: Date): DemandaComPrazo {
  return { ...demanda, diasRestantes: demanda.prazo ? diasAte(demanda.prazo, hoje) : null };
}

// Ordena do prazo mais urgente para o menos urgente; quem não tem prazo fica no fim
function compararPrazo(a: DemandaComPrazo, b: DemandaComPrazo): number {
  if (a.diasRestantes === null) return b.diasRestantes === null ? 0 : 1;
  if (b.diasRestantes === null) return -1;
  return a.diasRestantes - b.diasRestantes;
}

// Junta todos os números do dashboard em um único objeto
export function calcularDashboard(demandas: Demanda[], hoje: Date): ResumoDashboard {
  const emAberto = demandas.filter(estaEmAberto).map((demanda) => comDiasRestantes(demanda, hoje));

  return {
    total: demandas.length,
    porStatus: contarPor(STATUS, (demanda) => demanda.status, demandas),
    porPrioridade: contarPor(PRIORIDADES, (demanda) => demanda.prioridade, demandas),
    porTipo: contarPor(TIPOS, (demanda) => demanda.tipo, demandas),
    criticasEmAberto: emAberto
      .filter((demanda) => demanda.prioridade === 'Crítica')
      .sort(compararPrazo),
    // Entram as atrasadas e as que vencem em até DIAS_ALERTA_PRAZO dias
    proximasDoPrazo: emAberto
      .filter((demanda) => demanda.diasRestantes !== null && demanda.diasRestantes <= DIAS_ALERTA_PRAZO)
      .sort(compararPrazo)
  };
}
