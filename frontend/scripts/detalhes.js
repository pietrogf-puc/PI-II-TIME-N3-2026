/*
  Arquivo: detalhes.js
  Autor: Rafael Carvalho Soares (RA 26029352)
  Projeto: Sistema de Acompanhamento de Demandas - PI II - Time N3
  JS da tela de detalhes: carrega a demanda, etapa atual, prazo,
  histórico/comentários, mudança de status e cancelamento.
*/


// ----- configuração -----

// enquanto o backend não fica pronto uso os dados de exemplo (true = busca na API)
const USAR_API = false;
const URL_API = "http://localhost:3000";

// pega o id da url (detalhes.html?id=3)
const idDemanda = new URLSearchParams(window.location.search).get("id") || (USAR_API ? null : "1");

// limites do comentário
const MIN_CARACTERES = 5;
const MAX_CARACTERES = 300;

// nome usado nos comentários novos
const AUTOR_EXEMPLO = "Rafael Soares";

// até quantos dias o aviso fica amarelo
const DIAS_ALERTA = 3;

// ordem das etapas (cancelada fica de fora)
const ETAPAS = ["Aberta", "Em andamento", "Em revisão", "Concluída"];

// status -> classe do css
const CLASSE_DO_STATUS = {
  "Aberta": "aberta",
  "Em andamento": "andamento",
  "Em revisão": "revisao",
  "Concluída": "concluida",
  "Cancelada": "cancelada"
};

const CLASSE_DA_PRIORIDADE = {
  "Crítica": "critica",
  "Alta": "alta",
  "Média": "media",
  "Baixa": "baixa"
};


// ----- dados de exemplo (igual ao que a API vai mandar) -----

// GET /demandas/:id
const DEMANDA_EXEMPLO = {
  id: 1,
  titulo: "Erro ao salvar demanda sem prazo",
  descricao: "Ao cadastrar uma demanda deixando o campo de prazo vazio, o sistema apresenta erro e não salva a demanda. O prazo deve ser tratado conforme a regra definida pelo grupo.",
  tipo: "Defeito",
  prioridade: "Crítica",
  status: "Em andamento",
  responsavel: "Rafael Soares", // pode vir null
  projeto: "Sistema de Demandas",
  dataCriacao: "2026-09-25T09:00:00",
  dataAtualizacao: "2026-09-28T10:15:00",
  prazo: "2026-10-02",
  // vem do servidor (status.ts), depende do perfil
  proximosStatus: ["Em revisão", "Cancelada"],
  historico: [
    { autor: "Rafael Soares", dataHora: "2026-09-28T10:15:00", descricao: 'Alterou o status de "Aberta" para "Em andamento"' }
  ]
};

// GET /demandas/:id/comentarios
const COMENTARIOS_EXEMPLO = [
  { autor: "Pietro Giati", dataHora: "2026-09-29T14:30:00", texto: "Consegui reproduzir o erro deixando o campo de prazo vazio." }
];

// só pra testar sem o backend (como se fosse Líder)
const PROXIMOS_EXEMPLO = {
  "Aberta": ["Em andamento", "Cancelada"],
  "Em andamento": ["Em revisão", "Cancelada"],
  "Em revisão": ["Em andamento", "Concluída", "Cancelada"],
  "Concluída": [],
  "Cancelada": []
};


// ----- comunicação com a API -----

// faz o fetch e se der erro joga a mensagem que veio do servidor
async function chamarApi(caminho, metodo, corpo) {
  const opcoes = { method: metodo || "GET", headers: {} };

  if (corpo) {
    opcoes.headers["Content-Type"] = "application/json";
    opcoes.body = JSON.stringify(corpo);
  }
  // TODO: ver com o Pietro como mandar o usuário logado

  const resposta = await fetch(URL_API + caminho, opcoes);
  // caso venha sem json
  const dados = await resposta.json().catch(function () { return {}; });

  // 400, 403, 404 vem com { erro: "..." }
  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro " + resposta.status + " ao falar com o servidor.");
  }
  return dados;
}

function caminhoDaDemanda(id) {
  return "/demandas/" + encodeURIComponent(id);
}

async function buscarDemanda(id) {
  if (!USAR_API) return DEMANDA_EXEMPLO;
  return chamarApi(caminhoDaDemanda(id));
}

async function buscarComentarios(id) {
  if (!USAR_API) return COMENTARIOS_EXEMPLO;
  return chamarApi(caminhoDaDemanda(id) + "/comentarios");
}

async function enviarComentario(id, texto) {
  if (!USAR_API) {
    COMENTARIOS_EXEMPLO.push({ autor: AUTOR_EXEMPLO, dataHora: new Date().toISOString(), texto: texto });
    return;
  }
  await chamarApi(caminhoDaDemanda(id) + "/comentarios", "POST", { texto: texto });
}

async function enviarNovoStatus(id, novoStatus) {
  if (!USAR_API) {
    // faz o mesmo que o servidor vai fazer
    const agora = new Date().toISOString();
    DEMANDA_EXEMPLO.historico.push({
      autor: AUTOR_EXEMPLO,
      dataHora: agora,
      descricao: 'Alterou o status de "' + DEMANDA_EXEMPLO.status + '" para "' + novoStatus + '"'
    });
    DEMANDA_EXEMPLO.status = novoStatus;
    DEMANDA_EXEMPLO.dataAtualizacao = agora;
    DEMANDA_EXEMPLO.proximosStatus = PROXIMOS_EXEMPLO[novoStatus];
    return;
  }
  await chamarApi(caminhoDaDemanda(id) + "/status", "PATCH", { status: novoStatus });
}


// ----- formatar datas -----

// "2026-10-02" -> "02/10/2026"
function formatarData(texto) {
  if (!texto) return "—";
  const partes = String(texto).slice(0, 10).split("-");
  if (partes.length !== 3) return texto;
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// "2026-09-28T10:15:00" -> "28/09/2026 às 10:15"
function formatarDataHora(texto) {
  const data = new Date(texto);
  if (!texto || isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR") + " às " +
    data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}


// ----- preencher a tela -----

function escreverTexto(idElemento, texto) {
  document.getElementById(idElemento).textContent = texto;
}

function preencherDemanda(demanda) {
  document.title = demanda.titulo + " | Sistema de Demandas";

  escreverTexto("titulo-demanda", demanda.titulo);
  escreverTexto("tipo-demanda", demanda.tipo);
  escreverTexto("responsavel-demanda", demanda.responsavel || "Sem responsável");
  escreverTexto("projeto-demanda", demanda.projeto || "—");
  escreverTexto("criacao-demanda", formatarDataHora(demanda.dataCriacao));
  escreverTexto("atualizacao-demanda", formatarDataHora(demanda.dataAtualizacao));
  escreverTexto("descricao-demanda", demanda.descricao);

  // troca a cor da etiqueta
  const prioridade = document.getElementById("prioridade-demanda");
  prioridade.textContent = demanda.prioridade;
  prioridade.className = "etiqueta prio-" + (CLASSE_DA_PRIORIDADE[demanda.prioridade] || "");

  const status = document.getElementById("status-demanda");
  status.textContent = demanda.status;
  status.className = "etiqueta status-" + (CLASSE_DO_STATUS[demanda.status] || "");

  const prazo = document.getElementById("prazo-demanda");
  prazo.textContent = formatarData(demanda.prazo);
  prazo.setAttribute("datetime", String(demanda.prazo || "").slice(0, 10));
}


// ----- etapa atual -----

function desenharEtapas(status) {
  const lista = document.getElementById("etapas");
  const aviso = document.getElementById("aviso-etapas");
  const posicao = ETAPAS.indexOf(status);
  const itens = lista.querySelectorAll("li");

  itens.forEach(function (item, indice) {
    item.classList.remove("feita", "atual");
    item.removeAttribute("aria-current");

    if (indice < posicao) {
      item.classList.add("feita"); // já passou
    } else if (indice === posicao) {
      item.classList.add("atual"); // etapa atual
      item.setAttribute("aria-current", "step");
    }
  });

  lista.classList.toggle("cancelada", status === "Cancelada");

  if (status === "Cancelada") {
    aviso.textContent = "Esta demanda foi cancelada e não segue mais o ciclo de vida.";
  } else if (posicao === -1) {
    aviso.textContent = "Status não reconhecido: " + status + ".";
  } else {
    aviso.textContent = "Etapa " + (posicao + 1) + " de " + itens.length + ": " + status + ".";
  }
}


// ----- dias até o prazo -----

// recebe a data (ano-mês-dia) e retorna quantos dias faltam (negativo = atrasada)
function diasAteOPrazo(dataISO) {
  const partes = (dataISO || "").split("-");
  if (partes.length !== 3) return null;

  // no JS o mês começa em 0
  const prazo = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  if (isNaN(prazo.getTime())) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // compara só a data, sem as horas

  const UM_DIA = 24 * 60 * 60 * 1000;
  return Math.round((prazo - hoje) / UM_DIA);
}

// "1 dia" ou "3 dias"
function quantidadeDeDias(n) {
  return n + (n === 1 ? " dia" : " dias");
}

function mostrarIndicadorDePrazo(status) {
  const prazo = document.getElementById("prazo-demanda");
  const indicador = document.getElementById("indicador-prazo");

  indicador.className = "indicador-prazo";
  indicador.textContent = "";

  // concluída ou cancelada não mostra o aviso
  if (status === "Concluída" || status === "Cancelada") return;

  const dias = diasAteOPrazo(prazo.getAttribute("datetime"));
  if (dias === null) return;

  if (dias < 0) {
    indicador.textContent = "Atrasada há " + quantidadeDeDias(-dias);
    indicador.classList.add("atrasado");
  } else if (dias === 0) {
    indicador.textContent = "Vence hoje";
    indicador.classList.add("proximo");
  } else {
    indicador.textContent = (dias === 1 ? "Falta " : "Faltam ") + quantidadeDeDias(dias);
    indicador.classList.add(dias <= DIAS_ALERTA ? "proximo" : "no-prazo");
  }
}


// ----- histórico e comentários -----

const historico = document.getElementById("historico");

// adiciona um item no histórico (tipo: "comentario" ou "evento")
function adicionarNoHistorico(item) {
  const li = document.createElement("li");
  li.className = item.tipo;

  const cabecalho = document.createElement("small");
  cabecalho.textContent = item.autor + " · " + formatarDataHora(item.dataHora);

  // createTextNode para o texto digitado não ser lido como HTML
  li.appendChild(cabecalho);
  li.appendChild(document.createTextNode(item.texto));
  historico.appendChild(li);
}

// junta eventos e comentários em ordem de data
function desenharHistorico(eventos, comentarios) {
  const itens = [];

  (eventos || []).forEach(function (evento) {
    itens.push({ tipo: "evento", autor: evento.autor, dataHora: evento.dataHora, texto: evento.descricao });
  });
  (comentarios || []).forEach(function (comentario) {
    itens.push({ tipo: "comentario", autor: comentario.autor, dataHora: comentario.dataHora, texto: comentario.texto });
  });

  itens.sort(function (a, b) {
    return new Date(a.dataHora) - new Date(b.dataHora);
  });

  historico.replaceChildren(); // limpa a lista
  if (itens.length === 0) {
    const vazio = document.createElement("li");
    vazio.textContent = "Nenhum registro ainda.";
    historico.appendChild(vazio);
    return;
  }
  itens.forEach(adicionarNoHistorico);
}


// ----- mudar status e cancelar -----

const mensagemStatus = document.getElementById("mensagem-status");
const botaoCancelar = document.getElementById("btn-cancelar");

// cria os botões de status (cancelar já tem o dele)
function desenharBotoesDeStatus(proximos) {
  const area = document.getElementById("mudar-status");
  area.replaceChildren();

  (proximos || []).forEach(function (status) {
    if (status === "Cancelada") return;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn-secundario";
    botao.textContent = "Mover para " + status;
    botao.addEventListener("click", function () {
      mudarStatus(status);
    });
    area.appendChild(botao);
  });
}

// desativa se não puder cancelar
function atualizarBotaoCancelar(proximos) {
  const podeCancelar = (proximos || []).includes("Cancelada");
  botaoCancelar.disabled = !podeCancelar;
  botaoCancelar.title = podeCancelar ? "" : "Você não pode cancelar esta demanda.";
}

async function mudarStatus(novoStatus) {
  mensagemStatus.textContent = "";
  try {
    await enviarNovoStatus(idDemanda, novoStatus);
    await carregarTela();
  } catch (erro) {
    // mostra o erro do servidor (400, 403)
    mensagemStatus.textContent = erro.message;
  }
}

botaoCancelar.addEventListener("click", function () {
  // pede confirmação antes de cancelar
  const confirmou = window.confirm(
    "Tem certeza que deseja cancelar esta demanda?\n" +
    "Ela não será apagada: o status só muda para \"Cancelada\"."
  );
  if (confirmou) {
    mudarStatus("Cancelada");
  }
});


// ----- validação e envio do comentário -----

const formulario = document.getElementById("form-comentario");
const campo = document.getElementById("comentario");
const mensagemErro = document.getElementById("erro-comentario");
const contador = document.getElementById("contador");

// valida o comentário: retorna a mensagem de erro ou "" se estiver ok
function validarComentario(texto) {
  const limpo = texto.trim(); // tira os espaços das pontas

  if (limpo === "") {
    return "Escreva um comentário antes de enviar.";
  }
  if (limpo.length < MIN_CARACTERES) {
    return "O comentário precisa ter pelo menos " + MIN_CARACTERES + " caracteres.";
  }
  if (limpo.length > MAX_CARACTERES) {
    return "O comentário pode ter no máximo " + MAX_CARACTERES + " caracteres (agora tem " + limpo.length + ").";
  }
  return "";
}

// mostra e limpa o erro
function mostrarErro(mensagem) {
  mensagemErro.textContent = mensagem;
  campo.classList.add("invalido");
  campo.setAttribute("aria-invalid", "true");
}

function limparErro() {
  mensagemErro.textContent = "";
  campo.classList.remove("invalido");
  campo.removeAttribute("aria-invalid");
}

// contador de caracteres
function atualizarContador() {
  const tamanho = campo.value.length;
  contador.textContent = tamanho + "/" + MAX_CARACTERES;
  contador.classList.toggle("acima", tamanho > MAX_CARACTERES); // vermelho se passar do limite
}

campo.addEventListener("input", function () {
  atualizarContador();
  // apaga o erro quando voltar a digitar
  if (mensagemErro.textContent !== "") {
    limparErro();
  }
});

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault(); // não deixa a página recarregar

  const erro = validarComentario(campo.value);

  // se tiver erro, mostra e não envia
  if (erro !== "") {
    mostrarErro(erro);
    campo.focus();
    return;
  }

  try {
    await enviarComentario(idDemanda, campo.value.trim());
    campo.value = "";
    limparErro();
    atualizarContador();
    await carregarTela();
  } catch (erroServidor) {
    // erro que veio do servidor
    mostrarErro(erroServidor.message);
  }
});


// ----- botão editar -----

// leva o id da demanda (detalhes.html?id=3) para a tela de edição (cadastro.html?id=3)
const botaoEditar = document.getElementById("btn-editar");

if (idDemanda) {
  botaoEditar.href = "cadastro.html?id=" + encodeURIComponent(idDemanda);
}


// ----- carregar a tela -----

// quando não acha a demanda
function mostrarAvisoPagina(mensagem) {
  escreverTexto("aviso-pagina", mensagem);
  document.querySelectorAll(".painel").forEach(function (painel) {
    painel.hidden = true;
  });
  // hidden não funcionou por causa do .btn
  botaoCancelar.style.display = "none";
  botaoEditar.style.display = "none";
}

// busca os dados e monta a tela (chamo de novo depois de cada mudança)
async function carregarTela() {
  if (!idDemanda) {
    mostrarAvisoPagina("Nenhuma demanda foi informada. Abra esta tela pela listagem de demandas.");
    return;
  }

  try {
    const demanda = await buscarDemanda(idDemanda);
    const comentarios = await buscarComentarios(idDemanda);

    preencherDemanda(demanda);
    desenharEtapas(demanda.status);
    mostrarIndicadorDePrazo(demanda.status);
    desenharBotoesDeStatus(demanda.proximosStatus);
    atualizarBotaoCancelar(demanda.proximosStatus);
    desenharHistorico(demanda.historico, comentarios);
  } catch (erro) {
    // 404 cai aqui
    mostrarAvisoPagina(erro.message);
  }
}

atualizarContador();
carregarTela();
