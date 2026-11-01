/*
  Arquivo: detalhes.js
  Autor: Rafael Carvalho Soares (RA 26029352)
  Projeto: Sistema de Acompanhamento de Demandas - PI II - Time N3
  JS da tela de detalhes: validação do comentário, etapa atual,
  dias até o prazo e botão de cancelar.
*/

// limites do comentário
const MIN_CARACTERES = 5;
const MAX_CARACTERES = 300;

// nome usado nos comentários novos
const AUTOR_EXEMPLO = "Rafael Soares";

// elementos da página
const formulario = document.getElementById("form-comentario");
const campo = document.getElementById("comentario");
const mensagemErro = document.getElementById("erro-comentario");
const contador = document.getElementById("contador");
const historico = document.getElementById("historico");

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

// adiciona um item no histórico (tipo: "comentario" ou "evento")
function adicionarNoHistorico(texto, tipo) {
  const item = document.createElement("li");
  item.className = tipo || "comentario";

  const cabecalho = document.createElement("small");
  const data = new Date().toLocaleDateString("pt-BR");
  cabecalho.textContent = AUTOR_EXEMPLO + " · " + data;

  // createTextNode para o texto digitado não ser lido como HTML
  const conteudo = document.createTextNode(texto);

  item.appendChild(cabecalho);
  item.appendChild(conteudo);
  historico.appendChild(item);
}

// envio do comentário
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // não deixa a página recarregar

  const erro = validarComentario(campo.value);

  // se tiver erro, mostra e não envia
  if (erro !== "") {
    mostrarErro(erro);
    campo.focus();
    return;
  }

  // se estiver ok, adiciona e limpa o campo
  adicionarNoHistorico(campo.value.trim());
  campo.value = "";
  limparErro();
  atualizarContador();
});

atualizarContador();


// ----- etapa atual -----

// ordem das etapas (cancelada fica de fora)
const ETAPAS = ["aberta", "andamento", "revisao", "concluida"];

function desenharEtapas() {
  const lista = document.getElementById("etapas");
  const etiquetaStatus = document.getElementById("status-demanda");
  const aviso = document.getElementById("aviso-etapas");
  if (!lista || !etiquetaStatus || !aviso) return;

  const status = etiquetaStatus.dataset.status;
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

  lista.classList.toggle("cancelada", status === "cancelada");

  if (status === "cancelada") {
    aviso.textContent = "Esta demanda foi cancelada e não segue mais o ciclo de vida.";
  } else if (posicao === -1) {
    aviso.textContent = "Status não reconhecido: confira o data-status no HTML.";
  } else {
    aviso.textContent = "Etapa " + (posicao + 1) + " de " + itens.length + ": " + itens[posicao].textContent + ".";
  }
}


// ----- dias até o prazo -----

// até quantos dias o aviso fica amarelo
const DIAS_ALERTA = 3;

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

function mostrarIndicadorDePrazo() {
  const prazo = document.getElementById("prazo-demanda");
  const indicador = document.getElementById("indicador-prazo");
  const etiquetaStatus = document.getElementById("status-demanda");
  if (!prazo || !indicador) return;

  indicador.className = "indicador-prazo";
  indicador.textContent = "";

  // concluída ou cancelada não mostra o aviso
  const status = etiquetaStatus ? etiquetaStatus.dataset.status : "";
  if (status === "concluida" || status === "cancelada") return;

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

desenharEtapas();
mostrarIndicadorDePrazo();


// ----- cancelar demanda -----

const botaoCancelar = document.getElementById("btn-cancelar");

// desativa o botão se a demanda já estiver encerrada
function atualizarBotaoCancelar() {
  const etiquetaStatus = document.getElementById("status-demanda");
  if (!botaoCancelar || !etiquetaStatus) return;

  const status = etiquetaStatus.dataset.status;
  const encerrada = status === "concluida" || status === "cancelada";
  botaoCancelar.disabled = encerrada;
  botaoCancelar.title = encerrada ? "Esta demanda já está encerrada." : "";
}

if (botaoCancelar) {
  botaoCancelar.addEventListener("click", function () {
    // pede confirmação antes de cancelar
    const confirmou = window.confirm(
      "Tem certeza que deseja cancelar esta demanda?\n" +
      "Ela não será apagada: o status só muda para \"Cancelada\"."
    );
    if (!confirmou) return;

    // muda o status na tela
    const etiquetaStatus = document.getElementById("status-demanda");
    etiquetaStatus.dataset.status = "cancelada";
    etiquetaStatus.textContent = "Cancelada";
    etiquetaStatus.className = "etiqueta status-cancelada";

    // registra no histórico
    adicionarNoHistorico('Alterou o status para "Cancelada"', "evento");

    // atualiza o resto da tela
    desenharEtapas();
    mostrarIndicadorDePrazo();
    atualizarBotaoCancelar();
  });
}

atualizarBotaoCancelar();


// ----- botão editar -----

// leva o id da demanda (detalhes.html?id=3) para a tela de edição (cadastro.html?id=3)
const idDemanda = new URLSearchParams(window.location.search).get("id");
const botaoEditar = document.getElementById("btn-editar");

if (botaoEditar && idDemanda) {
  botaoEditar.href = "cadastro.html?id=" + encodeURIComponent(idDemanda);
}
