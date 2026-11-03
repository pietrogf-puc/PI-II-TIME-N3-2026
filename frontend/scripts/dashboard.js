/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  dashboard.js: comportamento da tela de Dashboard.

  A tela não calcula mais os indicadores: ela chama a rota GET /dashboard, o
  servidor lê as demandas no banco MySQL, faz as contas e devolve um JSON.
  Este arquivo cuida do que é da tela: validar os filtros, pedir os dados,
  mostrar o resultado e avisar o usuário quando algo der errado.

  Organização do arquivo:
    1. Configurações
    2. Validação dos filtros e formatação dos dados
    3. Login e comunicação com a API
    4. Funções de TELA (manipulação do DOM)
    5. Eventos e inicialização
*/


/* ===================================================================
   1. CONFIGURAÇÕES
   =================================================================== */

// Endereço da API (o servidor de backend roda na porta 3000)
const URL_API = 'http://localhost:3000';

// Página para onde o usuário vai quando não está logado ou o login expirou
const PAGINA_LOGIN = 'tela_login.html';

// Classe CSS (cor da etiqueta) de cada status e de cada prioridade
const CLASSE_STATUS = {
  'Aberta': 'status-aberta',
  'Em andamento': 'status-andamento',
  'Em revisão': 'status-revisao',
  'Concluída': 'status-concluida',
  'Cancelada': 'status-cancelada'
};

const CLASSE_PRIORIDADE = {
  'Crítica': 'prio-critica',
  'Alta': 'prio-alta',
  'Média': 'prio-media',
  'Baixa': 'prio-baixa'
};

// Relação entre o nome do campo no filtro e o id do elemento na tela
const CAMPOS_FILTRO = {
  projeto: 'filtro-projeto',
  dataInicio: 'filtro-data-inicio',
  dataFim: 'filtro-data-fim'
};


/* ===================================================================
   2. VALIDAÇÃO DOS FILTROS E FORMATAÇÃO DOS DADOS
   =================================================================== */

// Confere o período antes de chamar a API, para avisar o usuário na hora.
// O servidor valida de novo por conta própria. Devolve null se estiver certo.
// As datas 'AAAA-MM-DD' podem ser comparadas como texto, porque nesse formato
// a ordem alfabética é igual à ordem cronológica.
function validarFiltros(filtros) {
  if (filtros.dataInicio && filtros.dataFim && filtros.dataInicio > filtros.dataFim) {
    return {
      mensagem: 'Período inválido: a data inicial não pode ser depois da data final.',
      campos: ['dataInicio', 'dataFim']
    };
  }
  return null;
}

// Converte 'AAAA-MM-DD' em 'DD/MM/AAAA' para mostrar na tela
function formatarDataBR(texto) {
  const [ano, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Largura da barra em %, proporcional ao MAIOR valor do gráfico
// (o maior fica com 100%). Evita divisão por zero quando não há demandas.
function calcularPercentual(valor, maiorValor) {
  if (maiorValor === 0) return 0;
  return Math.round((valor / maiorValor) * 100);
}

// Texto e classe CSS da situação do prazo, a partir dos dias restantes
function descreverPrazo(dias) {
  if (dias < 0) {
    const atraso = -dias;
    return { texto: `Atrasada há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`, classe: 'prazo-atrasado' };
  }
  if (dias === 0) {
    return { texto: 'Vence hoje', classe: 'prazo-hoje' };
  }
  return { texto: `${dias === 1 ? 'Falta' : 'Faltam'} ${dias} ${dias === 1 ? 'dia' : 'dias'}`, classe: '' };
}


/* ===================================================================
   3. LOGIN E COMUNICAÇÃO COM A API
   =================================================================== */

// A tela de login guarda o token e os dados do usuário no sessionStorage
function lerToken() {
  return sessionStorage.getItem('token');
}

function lerUsuario() {
  try {
    return JSON.parse(sessionStorage.getItem('usuario'));
  } catch {
    return null; // valor guardado corrompido: tratado como "sem usuário"
  }
}

// Apaga o login guardado e manda o usuário para a tela de login
function voltarParaLogin() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
  window.location.href = PAGINA_LOGIN;
}

// Chama GET /dashboard com os filtros preenchidos e o token no cabeçalho.
// Devolve { resumo } quando dá certo ou { erro: { mensagem, campos } } quando falha.
async function buscarDashboard(filtros) {
  // URLSearchParams monta a parte da URL depois do "?" e trata os caracteres especiais
  const parametros = new URLSearchParams();
  Object.keys(filtros).forEach(function (nome) {
    if (filtros[nome]) parametros.set(nome, filtros[nome]);
  });

  try {
    const resposta = await fetch(`${URL_API}/dashboard?${parametros}`, {
      headers: { 'Authorization': 'Bearer ' + lerToken() }
    });

    // 401: sem login ou login expirado (o token vale 2 horas)
    if (resposta.status === 401) {
      return { semLogin: true };
    }

    const dados = await resposta.json();

    // Status 400 ou 500: o servidor explica o problema no campo "erro".
    // O texto padrão cobre uma resposta de erro que não venha da nossa API.
    if (!resposta.ok) {
      return {
        erro: {
          mensagem: dados.erro || 'O servidor respondeu com um erro inesperado. Tente novamente.',
          campos: dados.campos || []
        }
      };
    }
    return { resumo: dados };
  } catch (falha) {
    // fetch falha quando o servidor está desligado ou a resposta não é um JSON
    console.error('Falha ao chamar a API do dashboard:', falha);
    return {
      erro: {
        mensagem: 'Não foi possível conectar ao servidor. Verifique se o backend está ligado e tente novamente.',
        campos: []
      }
    };
  }
}


/* ===================================================================
   4. FUNÇÕES DE TELA (manipulação do DOM)
   Só mostram na tela o que a API devolveu.
   Os textos são inseridos com textContent (e não innerHTML), assim
   nenhum título de demanda consegue injetar HTML na página.
   =================================================================== */

// Cria uma etiqueta colorida: <span class="etiqueta classe">texto</span>
function criarEtiqueta(texto, classe) {
  const etiqueta = document.createElement('span');
  etiqueta.className = 'etiqueta ' + classe;
  etiqueta.textContent = texto;
  return etiqueta;
}

// Cria uma célula <td>. O conteúdo pode ser um texto ou outro elemento.
function criarCelula(conteudo, classe) {
  const celula = document.createElement('td');
  if (typeof conteudo === 'string') {
    celula.textContent = conteudo;
  } else {
    celula.appendChild(conteudo);
  }
  if (classe) celula.className = classe;
  return celula;
}

// Endereço da tela de detalhes de uma demanda (o id vai na URL)
function linkDetalhes(demanda) {
  return 'detalhes.html?id=' + demanda.id;
}

// Cria uma linha de tabela que leva para os detalhes da demanda.
// A primeira célula tem um link com o título; clicar em qualquer outra
// parte da linha também abre os detalhes.
function criarLinhaDemanda(demanda, outrasCelulas) {
  const linha = document.createElement('tr');
  linha.className = 'linha-link';

  const link = document.createElement('a');
  link.href = linkDetalhes(demanda);
  link.textContent = demanda.titulo;
  linha.appendChild(criarCelula(link));

  outrasCelulas.forEach(function (celula) {
    linha.appendChild(celula);
  });

  linha.addEventListener('click', function (evento) {
    // Se o clique foi no próprio link, o navegador já faz a navegação
    if (evento.target.closest('a')) return;
    window.location.href = linkDetalhes(demanda);
  });
  return linha;
}

// Linha única mostrada quando a tabela não tem nenhuma demanda
function criarLinhaVazia(texto, quantidadeColunas) {
  const linha = document.createElement('tr');
  const celula = criarCelula(texto, 'tabela-vazia');
  celula.colSpan = quantidadeColunas; // a célula ocupa a largura toda
  linha.appendChild(celula);
  return linha;
}

// Escreve o total e a quantidade de cada status nos cards.
// Cada <strong data-contador="..."> diz qual número deve receber.
function renderizarContadores(resumo) {
  document.querySelectorAll('[data-contador]').forEach(function (elemento) {
    const chave = elemento.dataset.contador;
    elemento.textContent = chave === 'total' ? resumo.total : resumo.porStatus[chave];
  });
}

// Monta um gráfico de barras dentro do container.
// "contagem" é o objeto { nome: quantidade }, e "classes" diz a cor de cada barra.
function renderizarGrafico(container, contagem, classes) {
  container.replaceChildren(); // apaga as barras da consulta anterior

  const maiorValor = Math.max(...Object.values(contagem));

  Object.keys(contagem).forEach(function (nome) {
    const quantidade = contagem[nome];
    const percentual = calcularPercentual(quantidade, maiorValor);

    // Estrutura: <div class="barra-linha"> nome | barra | número </div>
    const linha = document.createElement('div');
    linha.className = 'barra-linha';
    linha.title = `${nome}: ${quantidade} ${quantidade === 1 ? 'demanda' : 'demandas'}`;

    const rotulo = document.createElement('span');
    rotulo.textContent = nome;

    const fundo = document.createElement('div');
    fundo.className = 'barra-fundo';

    const barra = document.createElement('div');
    barra.className = 'barra ' + (classes[nome] || '');
    barra.style.width = percentual + '%'; // largura calculada pelo JS
    fundo.appendChild(barra);

    const numero = document.createElement('b');
    numero.textContent = quantidade;

    linha.append(rotulo, fundo, numero);
    container.appendChild(linha);
  });
}

// Preenche a tabela de demandas críticas em aberto.
// Responsável e prazo podem estar em branco, conforme o escopo.
function renderizarCriticas(lista) {
  const corpo = document.getElementById('tabela-criticas');
  corpo.replaceChildren();
  document.getElementById('qtd-criticas').textContent = lista.length;

  if (lista.length === 0) {
    corpo.appendChild(criarLinhaVazia('Nenhuma demanda crítica em aberto.', 4));
    return;
  }

  lista.forEach(function (demanda) {
    // Prazo em vermelho quando a demanda crítica já está atrasada
    const atrasada = demanda.diasRestantes !== null && demanda.diasRestantes < 0;
    corpo.appendChild(criarLinhaDemanda(demanda, [
      criarCelula(criarEtiqueta(demanda.status, CLASSE_STATUS[demanda.status])),
      criarCelula(demanda.responsavel || 'Sem responsável'),
      criarCelula(demanda.prazo ? formatarDataBR(demanda.prazo) : 'Sem prazo', atrasada ? 'prazo-alerta' : '')
    ]));
  });
}

// Preenche a tabela de demandas próximas do prazo, com os dias restantes
function renderizarProximasDoPrazo(lista) {
  const corpo = document.getElementById('tabela-prazos');
  corpo.replaceChildren();
  document.getElementById('qtd-prazos').textContent = lista.length;

  if (lista.length === 0) {
    corpo.appendChild(criarLinhaVazia('Nenhuma demanda atrasada ou perto do prazo.', 5));
    return;
  }

  lista.forEach(function (demanda) {
    const situacao = descreverPrazo(demanda.diasRestantes);
    const linha = criarLinhaDemanda(demanda, [
      criarCelula(criarEtiqueta(demanda.tipo, 'tipo')),
      criarCelula(criarEtiqueta(demanda.prioridade, CLASSE_PRIORIDADE[demanda.prioridade])),
      criarCelula(formatarDataBR(demanda.prazo)),
      criarCelula(situacao.texto, situacao.classe)
    ]);
    // Linha atrasada ganha fundo avermelhado para chamar atenção
    if (demanda.diasRestantes < 0) linha.classList.add('linha-atrasada');
    corpo.appendChild(linha);
  });
}

// Usada quando há erro: apaga os números, gráficos e tabelas, para a tela
// não mostrar resultados de uma consulta anterior junto com a mensagem
function limparResultados(texto) {
  document.querySelectorAll('[data-contador]').forEach(function (elemento) {
    elemento.textContent = '-';
  });
  document.getElementById('grafico-prioridade').replaceChildren();
  document.getElementById('grafico-tipo').replaceChildren();
  document.getElementById('qtd-criticas').textContent = '-';
  document.getElementById('qtd-prazos').textContent = '-';
  document.getElementById('tabela-criticas').replaceChildren(criarLinhaVazia(texto, 4));
  document.getElementById('tabela-prazos').replaceChildren(criarLinhaVazia(texto, 5));
}

// Mostra a mensagem embaixo dos filtros.
// tipo: 'info' (resultado normal), 'vazio' (nada encontrado) ou 'erro'
function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById('mensagem-filtro');
  mensagem.textContent = texto;
  mensagem.className = 'mensagem mensagem-' + tipo;
}

// Mostra o erro e limpa a tela. "campos" são os filtros a marcar em vermelho.
function mostrarErro(erro) {
  marcarCamposInvalidos(erro.campos);
  mostrarMensagem(erro.mensagem, 'erro');
  limparResultados(erro.campos.length > 0 ? 'Corrija o filtro para ver os dados.' : 'Dados indisponíveis no momento.');
}

// Lê os valores escolhidos nos campos de filtro
function lerFiltros() {
  return {
    projeto: document.getElementById(CAMPOS_FILTRO.projeto).value,
    dataInicio: document.getElementById(CAMPOS_FILTRO.dataInicio).value,
    dataFim: document.getElementById(CAMPOS_FILTRO.dataFim).value
  };
}

// Marca em vermelho os campos com erro e tira a marcação dos outros
function marcarCamposInvalidos(nomesCampos) {
  Object.keys(CAMPOS_FILTRO).forEach(function (nome) {
    const campo = document.getElementById(CAMPOS_FILTRO[nome]);
    const invalido = nomesCampos.includes(nome);
    campo.classList.toggle('campo-invalido', invalido);
    campo.setAttribute('aria-invalid', invalido); // informa leitores de tela
  });
}

// Cria uma <option> para cada projeto do banco, só na primeira resposta da API.
// O valor da opção é o id do projeto, que é o que a rota recebe no filtro.
function preencherProjetos(projetos) {
  const select = document.getElementById(CAMPOS_FILTRO.projeto);
  if (select.options.length > 1) return;

  projetos.forEach(function (projeto) {
    const opcao = document.createElement('option');
    opcao.value = projeto.id;
    opcao.textContent = projeto.nome;
    select.appendChild(opcao);
  });
}


/* ===================================================================
   5. EVENTOS E INICIALIZAÇÃO
   =================================================================== */

// Número da consulta mais recente. Se o usuário trocar o filtro antes de a
// resposta chegar, a resposta antiga é ignorada e não sobrescreve a tela.
let ultimaConsulta = 0;

// Pede os dados à API e redesenha o dashboard com os filtros atuais.
// É chamada ao abrir a tela e sempre que um filtro muda.
async function atualizarDashboard() {
  const numeroDaConsulta = ++ultimaConsulta;
  const filtros = lerFiltros();

  // 1) Valida os filtros na tela. Se houver erro, nem chama a API.
  const erroFiltro = validarFiltros(filtros);
  if (erroFiltro) {
    mostrarErro(erroFiltro);
    return;
  }
  marcarCamposInvalidos([]);
  mostrarMensagem('Carregando...', 'info');

  // 2) Pede os dados ao servidor
  const resultado = await buscarDashboard(filtros);
  if (numeroDaConsulta !== ultimaConsulta) return;

  if (resultado.semLogin) {
    alert('Sua sessão expirou. Faça login novamente.');
    voltarParaLogin();
    return;
  }
  if (resultado.erro) {
    mostrarErro(resultado.erro);
    return;
  }

  // 3) Mostra o resultado na tela
  const resumo = resultado.resumo;
  preencherProjetos(resumo.projetos);
  renderizarContadores(resumo);
  renderizarGrafico(document.getElementById('grafico-prioridade'), resumo.porPrioridade, CLASSE_PRIORIDADE);
  renderizarGrafico(document.getElementById('grafico-tipo'), resumo.porTipo, {});
  renderizarCriticas(resumo.criticasEmAberto);
  renderizarProximasDoPrazo(resumo.proximasDoPrazo);

  // 4) Mensagem do resultado: vazio ou quantidade encontrada
  if (resumo.total === 0) {
    mostrarMensagem('Nenhuma demanda encontrada para este filtro. Escolha outro projeto ou período.', 'vazio');
  } else {
    const plural = resumo.totalGeral === 1 ? 'demanda' : 'demandas';
    mostrarMensagem(`Mostrando ${resumo.total} de ${resumo.totalGeral} ${plural}.`, 'info');
  }
}

// Volta todos os filtros ao valor inicial e recalcula
function limparFiltros() {
  document.getElementById('form-filtros').reset();
  atualizarDashboard();
}

// Escreve no cabeçalho o nome, o perfil e as iniciais de quem fez login
function mostrarUsuarioLogado(usuario) {
  const nome = (usuario && usuario.nome) || 'Usuário';
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map(function (parte) {
    return parte[0].toUpperCase();
  }).join('');

  document.getElementById('usuario-nome').textContent = nome;
  document.getElementById('usuario-perfil').textContent = (usuario && usuario.perfil) || '';
  document.getElementById('usuario-iniciais').textContent = iniciais;
}

// Prepara a tela: confere o login, liga os eventos e busca os dados
function iniciarDashboard() {
  // Sem login, nem mostra o dashboard: vai direto para a tela de login
  if (!lerToken()) {
    voltarParaLogin();
    return;
  }
  mostrarUsuarioLogado(lerUsuario());

  // "Sair" apaga o login antes de voltar para a tela de login
  document.getElementById('link-sair').addEventListener('click', function (evento) {
    evento.preventDefault();
    voltarParaLogin();
  });

  // Data de hoje no subtítulo
  document.getElementById('data-hoje').textContent = new Date().toLocaleDateString('pt-BR');

  // Qualquer mudança nos filtros atualiza o dashboard na hora
  Object.values(CAMPOS_FILTRO).forEach(function (id) {
    document.getElementById(id).addEventListener('change', atualizarDashboard);
  });
  document.getElementById('btn-limpar').addEventListener('click', limparFiltros);

  // Impede que o Enter dentro do formulário recarregue a página
  document.getElementById('form-filtros').addEventListener('submit', function (evento) {
    evento.preventDefault();
    atualizarDashboard();
  });

  atualizarDashboard();
}

// Começa quando o HTML terminar de carregar
document.addEventListener('DOMContentLoaded', iniciarDashboard);
