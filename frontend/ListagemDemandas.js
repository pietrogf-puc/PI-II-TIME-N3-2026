/* Autor: Gustavo Pietro */
/* Tela: Listagem de Demandas | PI II - Time N3 */
/* Descrição: mostra todas as demandas em uma tabela, com busca, filtros e ordenação. */

const demanda1 = {
  titulo: "Demanda exemplo 1",
  descricao:"demanda de teste",
  tipo: "Tarefa",
  prioridade: "Alta",
  status: "Aberta",
  projeto: "Sistema X",
  responsavel: "Fulano",
  dataCriacao: "2026-09-01",
  prazo: "2026-10-30"
};

const demanda2 = {
  titulo: "Modificar GitHub",
  descricao:"git",
  tipo: "Defeito",
  prioridade: "Média",
  status: "Em andamento",
  projeto: "Sistema X",
  responsavel: "José Picolo",
  dataCriacao: "2026-09-02",
  prazo: "2027-01-12"
};

const demanda3 = {
  titulo: "Criar MER",
  descricao:"mer banco de dados",
  tipo: "Melhoria",
  prioridade: "Baixa",
  status: "Em revisão",
  projeto: "Sistema Y",
  responsavel: "Pietro Favari",
  dataCriacao: "2026-09-03",
  prazo: "2026-11-30"
};

const demanda4 = {
  titulo: "Add Banco de Dados",
  descricao:"integração",
  tipo: "Tarefa",
  prioridade: "Alta",
  status: "Concluída",
  projeto: "Sistema Y",
  responsavel: "Vittor Maia",
  dataCriacao: "2026-09-04",
  prazo: "2026-10-12"
};

const demanda5 = {
  titulo: "Corrigir tela login",
  descricao:"corrigi as tela",
  tipo: "Documentação",
  prioridade: "Crítica",
  status: "Cancelada",
  projeto: "Sistema X",
  responsavel: "Luggi Braga",
  dataCriacao: "2026-09-05",
  prazo: "2026-12-30"
}; /*Demandas de exemplo */

const demandas = [demanda1, demanda2, demanda3, demanda4, demanda5]; /*Lista com as demandas criadas anteriormente */

const corpoTabela = document.getElementById("corpoTabela"); /*Busca o conteudo do html */

function formatarData(data) { /*altera a forma que a data é mostrada */
  const partes = data.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function mostrarTabela(lista) {
    corpoTabela.innerHTML = ""; /*apaga as linhas antigas, para não repetir linhas a cada busca ou filtro */

    lista.forEach(function (d) { /*Cada nova demanda criada, seguirá essa estrutura */
        corpoTabela.innerHTML += ` 
    <tr>
      <td>${d.titulo}</td>
      <td>${d.tipo}</td>
      <td>${d.prioridade}</td>
      <td>${d.status}</td>
      <td>${d.projeto}</td>
      <td>${d.responsavel}</td>
      <td>${formatarData(d.dataCriacao)}</td>
      <td>${formatarData(d.prazo)}</td>
      <td class="acoes"><a href="#">Ver</a> <a href="#">Editar</a></td>
    </tr>
  `;
});
}
mostrarTabela(demandas);  /*Mostra todas as demandas quando a página abre */

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
  window.location.href = "cadastro_e_edicao_de_demandas.html";
});