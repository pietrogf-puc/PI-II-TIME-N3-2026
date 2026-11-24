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
      <td class="acoes"><a href="detalhes.html?id=${d.id}">Ver</a> <button type="button" class="botaoEditar" data-id="${d.id}">Editar</button></td>
    </tr>
  `;
});
contador.textContent = "Mostrando " + lista.length + " de " + demandas.length; /*Atualiza o contador com a quantidade de linhas da tabela */
}


/* Pega as iniciais do nome: "Administrador Teste" -> "AT" */
function pegarIniciais(nome) {
  const partes = nome.trim().split(" ");
  const primeira = partes[0][0];
  let ultima = "";
  if (partes.length > 1) {
    ultima = partes[partes.length - 1][0];
  }
  return (primeira + ultima).toUpperCase();
}

/* Escreve no cabeçalho o nome, o perfil e as iniciais de quem fez login */
function mostrarUsuario() {
  /* O sessionStorage só guarda texto, então o JSON.parse transforma de volta em objeto */
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));

  /* Sem usuário guardado = ninguém fez login */
  if (!usuario) {
    window.location.href = "tela_login.html";
    return;
  }

  document.getElementById("nome_usuario").textContent = usuario.nome;
  document.getElementById("perfil_usuario").textContent = usuario.perfil;
  document.getElementById("avatar").textContent = pegarIniciais(usuario.nome);
}

mostrarUsuario();


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

    /* Se a URL tem ?editar=ID (vindo da tela de detalhes), abre o modal dessa demanda */
  const idParaEditar = new URLSearchParams(window.location.search).get("editar");

  if (idParaEditar) {
    const demanda = demandas.find(function (d) {
      return d.id === Number(idParaEditar);
    });

    if (demanda) {
      abrirModal(demanda);
    }

    /* Tira o ?editar= da URL, senão o modal reabriria toda vez que a lista for recarregada */
    window.history.replaceState(null, "", window.location.pathname);
  }
}


carregarDemandas();

const campoBusca = document.getElementById("busca");
const filtroStatus = document.getElementById("filtroStatus");
const filtroPrioridade = document.getElementById("filtroPrioridade");
const filtroTipo = document.getElementById("filtroTipo");
const ordenar = document.getElementById("ordenar");
/*getElementByID busca os ids no html ligado a este js*/
/* Se a URL tem ?status=... (vindo do dashboard), já marca esse status no filtro.
   Fica fora da carregarDemandas para valer só quando a página abre, e não a cada recarga da lista */
const statusDaUrl = new URLSearchParams(window.location.search).get("status");
if (statusDaUrl) {
  filtroStatus.value = statusDaUrl;
}
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
const editProjetoTexto = document.getElementById("editProjetoTexto");
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

/* Preenche o select de responsável com os usuários do banco (GET /demandas/opcoes) */
async function carregarUsuarios() {
  const resposta = await fetch("http://localhost:3000/demandas/opcoes", {
    headers: { "Authorization": "Bearer " + sessionStorage.getItem("token") }
  });

  if (!resposta.ok) {
    return;
  }

  const opcoes = await resposta.json();

  opcoes.usuarios.forEach(function (u) {
    const opcao = document.createElement("option");
    opcao.value = u.id;         /* o que vai para o servidor */
    opcao.textContent = u.nome; /* o que aparece na tela */
    editResponsavel.appendChild(opcao);
  });
}

carregarUsuarios();


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
  editProjetoTexto.textContent = demanda.projeto;
  editTipo.value = demanda.tipo;
  editPrioridade.value = demanda.prioridade;
  editStatusTexto.textContent = demanda.status; /* só mostra o status atual */
  editResponsavel.value = "";
  for (const opcao of editResponsavel.options) {
    if (opcao.textContent === demanda.responsavel) {
      editResponsavel.value = opcao.value; /* Marca o responsável atual. A lista só traz o nome, então procura a opção pelo nome. */
    }
  }
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

  /* monta o que vai ser enviado ao servidor.
     O projeto não muda na edição, e o responsável só vai se foi trocado */
  const dadosEditados = {
    titulo: editTitulo.value.trim(),
    descricao: editDescricao.value.trim(),
    tipo: editTipo.value,
    prioridade: editPrioridade.value,
    status: demandaEmEdicao.status,
    prazo: editPrazo.value
  };

  /* Só manda o responsável se foi trocado por outra pessoa. Se não mexeu, o servidor mantém o atual. */
  if (editResponsavel.value !== "" && editResponsavel.selectedOptions[0].textContent !== demandaEmEdicao.responsavel) {
    dadosEditados.id_responsavel = Number(editResponsavel.value);
  }

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

/* Botão "Sair": apaga o login guardado antes de voltar para a tela de login */
document.getElementById("sair").addEventListener("click", function () {
  sessionStorage.removeItem("token"); /* apaga o token */
  sessionStorage.removeItem("usuario"); /* apaga os dados do usuário */
});