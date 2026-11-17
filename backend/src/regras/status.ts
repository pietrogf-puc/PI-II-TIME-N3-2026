/*
  Arquivo: status.ts
  Autor: Rafael Carvalho Soares (RA 26029352)
  Projeto: Sistema de Acompanhamento de Demandas - PI II - Time N3
  Regras de mudança de status e cancelamento (quem pode mudar pra qual status).
*/

// tem que ser igual ao que está no banco
export type Status = "Aberta" | "Em andamento" | "Em revisão" | "Concluída" | "Cancelada";

// perfis de usuário
export type Perfil = "Administrador" | "Líder de Projeto" | "Membro da Equipe";

// se não puder já volta o código http e a mensagem
export type Resultado =
  | { permitido: true }
  | { permitido: false; codigo: 400 | 403; mensagem: string };

const STATUS_VALIDOS: Status[] = ["Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada"];

// pra onde cada status pode ir (cancelar fica separado)
const TRANSICOES: Record<Status, Status[]> = {
  "Aberta": ["Em andamento"],
  "Em andamento": ["Em revisão"],
  "Em revisão": ["Concluída", "Em andamento"],
  "Concluída": [],
  "Cancelada": []
};

// o membro só pode fazer essas duas
const TRANSICOES_DO_MEMBRO: [Status, Status][] = [
  ["Aberta", "Em andamento"],
  ["Em andamento", "Em revisão"]
];

// confere se o status que veio no body existe
export function ehStatusValido(valor: unknown): valor is Status {
  return typeof valor === "string" && STATUS_VALIDOS.includes(valor as Status);
}

// vê se pode mudar de atual pra novo
export function verificarMudancaDeStatus(atual: Status, novo: Status, perfil: Perfil): Resultado {
  if (atual === novo) {
    return { permitido: false, codigo: 400, mensagem: `A demanda já está com o status "${atual}".` };
  }

  // cancelar é separado
  if (novo === "Cancelada") {
    return verificarCancelamento(atual, perfil);
  }

  // concluída e cancelada não mudam mais
  if (atual === "Concluída" || atual === "Cancelada") {
    return { permitido: false, codigo: 400, mensagem: `Uma demanda "${atual}" não pode mais mudar de status.` };
  }

  if (!TRANSICOES[atual].includes(novo)) {
    return { permitido: false, codigo: 400, mensagem: `Não é permitido mudar de "${atual}" para "${novo}".` };
  }

  // agora vê o perfil
  if (perfil === "Membro da Equipe") {
    const podeFazer = TRANSICOES_DO_MEMBRO.some(([de, para]) => de === atual && para === novo);
    if (!podeFazer) {
      return { permitido: false, codigo: 403, mensagem: `Membro da Equipe não pode mudar de "${atual}" para "${novo}".` };
    }
  }

  return { permitido: true };
}

// só líder ou admin cancela, e não pode se já tiver concluída
export function verificarCancelamento(atual: Status, perfil: Perfil): Resultado {
  if (perfil === "Membro da Equipe") {
    return { permitido: false, codigo: 403, mensagem: "Apenas Líder de Projeto ou Administrador pode cancelar uma demanda." };
  }
  if (atual === "Concluída") {
    return { permitido: false, codigo: 400, mensagem: "Uma demanda concluída não pode ser cancelada." };
  }
  if (atual === "Cancelada") {
    return { permitido: false, codigo: 400, mensagem: "Esta demanda já está cancelada." };
  }
  return { permitido: true };
}

// usado pra montar os botões na tela de detalhes
export function proximosStatusPermitidos(atual: Status, perfil: Perfil): Status[] {
  return STATUS_VALIDOS.filter((novo) => verificarMudancaDeStatus(atual, novo, perfil).permitido);
}
