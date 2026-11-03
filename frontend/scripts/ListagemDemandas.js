/* Autor: Gustavo Pietro de Assis Silva */
/* Tela: Listagem de Demandas | PI II - Time N3 */
/* Descrição: mostra as demandas vindas da API em uma tabela, com busca, filtros e ordenação. */

/* Lista de demandas. Começa vazia e é preenchida com o que a API devolver.
   Usa "let" (e não "const") porque ela recebe um valor novo depois. */
let demandas = [];

const contador = document.getElementById("contador"); /*Pega o texto do contador no html */
const corpoTabela = document.getElementById("corpoTabela"); /*Busca o conteudo do html */

function formatarData(data) { /*altera a forma que a data é mostrada */
  const partes = data.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function mostrarTabela(lista) {
    corpoTabela.innerHTML = ""; /*apaga as linhas antigas, para não repetir linhas a cada busca ou filtro */

    lista.forEach(function (d) { /*Cada demanda da lista segue essa estrutura */
        corpoTabela.innerHTML += ` 
    <tr>
      <td>${d.titulo}</td>
      <td>${d.tipo}</td>
      <td>${d.prioridade}</td>
      <td>${d.status}</td>
      <td>${d.projeto}</td>
      <td>${d.responsavel || "—"}</td>
      <td>${formatarData(d.dataCriacao)}</td>
      <td>${formatarData(d.prazo)}</td>
      <td class="acoes"><a href="detalhes.html">Ver</a> <button type="button" class="botaoEditar" data-id="${d.id}">Editar</button></td>
    </tr>
  `;
});
contador.textContent = "Mostrando " + lista.length + " de " + demandas.length; /*Atualiza o contador com a quantidade de linhas da tabela */
}

/* Busca as demandas na API e mostra na tabela quando a página abre */
async function carregarDemandas() {
  const token = sessionStorage.getItem("token"); /* o token que o login guardou */

  const resposta = await fetch("http://localhost:3000/demandas", {
    headers: { "Authorization": "Bearer " + token }
  });

  /* Sem token ou token vencido: volta para a tela de login */
  if (!resposta.ok) {
    window.location.href = "tela_login.html";
    return;
  }

  demandas = await resposta.json(); /* guarda a lista que veio do banco */
  aplicarFiltros(); /* mostra a tabela respeitando a busca, os filtros e a ordenação escolhidos */
}

carregarDemandas();

const campoBusca = document.getElementById("busca");
const filtroStatus = document.getElementById("filtroStatus");
const filtroPrioridade = document.getElementById("filtroPrioridade");
const filtroTipo = document.getElementById("filtroTipo");
const ordenar = document.getElementById("ordenar");
/*getElementByID busca os ids no html ligado a este js*/

const ordemPrioridade = ["Crítica", "Alta", "Média", "Baixa"]; 
const ordemStatus = ["Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada"];
/*ordena as posições de cada prioridade e status, facilitando o seu acesso */

/* função onde será filtrada, ordenada e atualizada a tabela de acordo com o usuario */
function aplicarFiltros() {
  const texto = campoBusca.value.toLowerCase(); /*Faz com que tudo fique com letra minuscula, pra não dar erro na busca */
  const status = filtroStatus.value;
  const prioridade = filtroPrioridade.value;
  const tipo = filtroTipo.value;
  const criterio = ordenar.value;

  const resultado = demandas.filter(function (d) {
    const bateTexto = d.titulo.toLowerCase().includes(texto) || d.descricao.toLowerCase().includes(texto);
    const bateStatus = status === "" || d.status === status; /*== "", nenhum filtro escolhido*/
    const batePrioridade = prioridade === "" || d.prioridade === prioridade;
    const bateTipo = tipo === "" || d.tipo === tipo;

    return bateTexto && bateStatus && batePrioridade && bateTipo;
  });
  
   /*Se o usuario querer ordenar as demandas... */
  if (criterio === "dataCriacao" || criterio === "prazo") {
    resultado.sort(function (a, b) {
      return a[criterio].localeCompare(b[criterio]);
    });
  } else if (criterio === "prioridade") {
    resultado.sort(function (a, b) {
      return ordemPrioridade.indexOf(a.prioridade) - ordemPrioridade.indexOf(b.prioridade);
    });
    /* indexOf dá a posição do valor na lista, começando no 0. 
    Subtrair as posições diz quem vem primeiro: se der negativo, "a" vem antes */
  } else if (criterio === "status") {
    resultado.sort(function (a, b) {
      return ordemStatus.indexOf(a.status) - ordemStatus.indexOf(b.status);
    });
  }
  mostrarTabela(resultado); /*resultado do filtro */
}

/*Roda aplicarFiltros sempre que o usuário digitar ou mudar uma opção */
campoBusca.addEventListener("input", aplicarFiltros);
filtroStatus.addEventListener("change", aplicarFiltros);
filtroPrioridade.addEventListener("change", aplicarFiltros);
filtroTipo.addEventListener("change", aplicarFiltros);
ordenar.addEventListener("change", aplicarFiltros);

/* Leva o usuário para a tela de cadastro e edição de demandas */
const botaoNova = document.getElementById("botaoNova");

botaoNova.addEventListener("click", function () {
  window.location.href = "cadastro.html";
});



/* ===================== MODAL DE EDIÇÃO ===================== */

/* Pega os elementos do modal no HTML */
const modalEditar = document.getElementById("modalEditar");
const formEditar = document.getElementById("formEditar");
const botaoCancelar = document.getElementById("botaoCancelar");

const editTitulo = document.getElementById("editTitulo");
const editDescricao = document.getElementById("editDescricao");
const editProjeto = document.getElementById("editProjeto");
const editTipo = document.getElementById("editTipo");
const editPrioridade = document.getElementById("editPrioridade");
const editStatusTexto = document.getElementById("editStatusTexto");
const editResponsavel = document.getElementById("editResponsavel");
const editPrazo = document.getElementById("editPrazo");

const erroTitulo = document.getElementById("erroTitulo");
const erroDescricao = document.getElementById("erroDescricao");
const erroPrazo = document.getElementById("erroPrazo");
const erroGeral = document.getElementById("erroGeral"); /* mensagem de erro que vem do servidor */

/* Guarda qual demanda está sendo editada no momento.
   Começa vazia (null) porque nenhuma foi escolhida ainda. */
let demandaEmEdicao = null;


/* ----- Funções de erro (mesma ideia do cadastro.js) ----- */

function mostrarErro(campo, erro, texto) {
  campo.classList.add("campo_invalido"); /* deixa a borda vermelha */
  erro.textContent = texto;              /* escreve a mensagem */
  erro.style.display = "block";          /* mostra a mensagem */
}

function limparErro(campo, erro) {
  campo.classList.remove("campo_invalido");
  erro.textContent = "";
  erro.style.display = "none";
}


/*  Abrir o modal  */

function abrirModal(demanda) {
  demandaEmEdicao = demanda; /* lembra qual demanda foi clicada */

  /* Coloca os dados da demanda dentro dos campos */
  editTitulo.value = demanda.titulo;
  editDescricao.value = demanda.descricao;
  editProjeto.value = demanda.projeto;
  editTipo.value = demanda.tipo;
  editPrioridade.value = demanda.prioridade;
  editStatusTexto.textContent = demanda.status; /* só mostra o status atual */
  editResponsavel.value = demanda.responsavel || ""; /* sem responsável, deixa o campo vazio */
  editPrazo.value = demanda.prazo;

  /* Apaga erros que tenham ficado da última vez */
  limparErro(editTitulo, erroTitulo);
  limparErro(editDescricao, erroDescricao);
  limparErro(editPrazo, erroPrazo);
  erroGeral.textContent = "";
  erroGeral.style.display = "none"; /* esconde o erro do servidor da última vez */

  modalEditar.showModal(); /* mostra o modal na tela */
}


/* Clique no botão "Editar" */
/* O clique é escutado na tabela inteira, e não em cada botão.
   Motivo: a tabela é apagada e recriada toda vez que alguém filtra,
   e os botões novos não teriam o evento. A tabela (tbody) nunca é apagada. */

corpoTabela.addEventListener("click", function (evento) {
  const clicado = evento.target; /* o elemento exato que foi clicado */

  /* Se não foi um botão "Editar", não faz nada */
  if (!clicado.classList.contains("botaoEditar")) {
    return;
  }

  /* Lê o id que estava no data-id do botão.
     Vem como texto ("3"), então o Number() transforma em número (3). */
  const id = Number(clicado.dataset.id);

  /* Procura na lista a demanda que tem esse id */
  const demanda = demandas.find(function (d) {
    return d.id === id;
  });

  abrirModal(demanda);
});


/* Botão "Cancelar" */
botaoCancelar.addEventListener("click", function () {
  modalEditar.close(); /* fecha sem salvar nada */
});


/* Botão "Salvar alterações" */
/* "async" porque agora esperamos a resposta do servidor (await) */
formEditar.addEventListener("submit", async function (evento) {
  evento.preventDefault(); /* impede o formulário de recarregar a página */

  /* Validação simples: título, descrição e prazo não podem ficar vazios */
  let tudoCerto = true;

  if (editTitulo.value.trim().length < 5) {
    mostrarErro(editTitulo, erroTitulo, "O título precisa ter pelo menos 5 caracteres");
    tudoCerto = false;
  } else {
    limparErro(editTitulo, erroTitulo);
  }

  if (editDescricao.value.trim() === "") {
    mostrarErro(editDescricao, erroDescricao, "A descrição não pode estar vazia");
    tudoCerto = false;
  } else {
    limparErro(editDescricao, erroDescricao);
  }

  if (editPrazo.value === "") {
    mostrarErro(editPrazo, erroPrazo, "Escolha um prazo");
    tudoCerto = false;
  } else {
    limparErro(editPrazo, erroPrazo);
  }

  /* Se algum campo deu erro, para aqui e deixa o modal aberto */
  if (!tudoCerto) {
    return;
  }

  /* Tudo certo no navegador: monta o que vai ser enviado ao servidor.
     Projeto e responsável ainda não vão, porque esses selects ainda não vêm do banco. */
  const dadosEditados = {
    titulo: editTitulo.value.trim(),
    descricao: editDescricao.value.trim(),
    tipo: editTipo.value,
    prioridade: editPrioridade.value,
    status: demandaEmEdicao.status,
    prazo: editPrazo.value
  };

  const token = sessionStorage.getItem("token");

  /* Envia para a API com o método PUT (editar). O servidor valida tudo de novo. */
  const resposta = await fetch("http://localhost:3000/demandas/" + demandaEmEdicao.id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(dadosEditados)
  });

  /* Token vencido: volta para o login */
  if (resposta.status === 401) {
    window.location.href = "tela_login.html";
    return;
  }

  /* O servidor recusou (400, 403, 404...): mostra a mensagem dele dentro do modal e deixa aberto */
  if (!resposta.ok) {
    const erro = await resposta.json();
    erroGeral.textContent = erro.mensagem;
    erroGeral.style.display = "block";
    return;
  }

  /* Deu certo: fecha o modal e busca a lista de novo no banco, já com a edição */
  modalEditar.close();
  await carregarDemandas();
  alert("Demanda atualizada com sucesso!");
});