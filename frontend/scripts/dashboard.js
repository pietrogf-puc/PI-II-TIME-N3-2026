/*
  Feito por Gustavo Manera Marialva - RA 26029581
  Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas

  dashboard.js: comportamento da tela de Dashboard.

  Organização do arquivo:
    1. Valores do escopo (tipos, prioridades, status e projetos)
    2. Dados de teste (enquanto o backend não envia as demandas)
    3. Funções de CÁLCULO: funções puras, que só recebem dados e devolvem
       resultados, sem mexer na tela. Na próxima etapa, esta parte vira a
       rota GET /dashboard no backend.
    4. Funções de TELA: pegam o resultado do cálculo e montam o HTML (DOM).
    5. Eventos e inicialização (filtros e botão "Limpar filtros").
*/


/* ===================================================================
   1. VALORES DO ESCOPO
   =================================================================== */

// Valores aceitos em cada campo da demanda, na ordem em que aparecem na tela
const TIPOS = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'];
const STATUS = ['Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'];

// Status que encerram a demanda: ela deixa de contar como "em aberto"
const STATUS_ENCERRADOS = ['Concluída', 'Cancelada'];

// Projetos cadastrados. O "Site do Evento" ainda não tem demandas e serve
// para demonstrar o filtro sem resultado.
const PROJETOS = ['Sistema de Demandas', 'Portal do Aluno', 'App Biblioteca', 'Site do Evento'];

// Quantos dias antes do prazo a demanda entra na lista "próximas do prazo"
const DIAS_ALERTA_PRAZO = 7;

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


/* ===================================================================
   2. DADOS DE TESTE
   =================================================================== */

// Devolve a data de hoje somada a "dias" no formato 'AAAA-MM-DD'.
// Ex.: dataRelativa(3) = daqui a 3 dias; dataRelativa(-2) = 2 dias atrás.
// Assim os prazos sempre ficam perto da data atual, em qualquer dia em que
// a tela for aberta (atrasadas, vencendo hoje, vencendo esta semana...).
function dataRelativa(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return paraTextoISO(data);
}

// 18 demandas válidas + 1 demanda com status fora do escopo (a última),
// para demonstrar a validação dos dados.
const DEMANDAS_TESTE = [
  { id: 1,  titulo: 'Erro ao salvar demanda sem prazo',       tipo: 'Defeito',      prioridade: 'Crítica', status: 'Em andamento', projeto: 'Sistema de Demandas', responsavel: 'Rafael Soares',   dataCriacao: dataRelativa(-20), prazo: dataRelativa(-2) },
  { id: 2,  titulo: 'Login não valida senha em branco',       tipo: 'Defeito',      prioridade: 'Crítica', status: 'Aberta',       projeto: 'Sistema de Demandas', responsavel: 'Pietro Giati',    dataCriacao: dataRelativa(-10), prazo: dataRelativa(1) },
  { id: 3,  titulo: 'Filtro de status retorna lista vazia',   tipo: 'Defeito',      prioridade: 'Crítica', status: 'Em revisão',   projeto: 'Sistema de Demandas', responsavel: 'Gustavo Pietro',  dataCriacao: dataRelativa(-8),  prazo: dataRelativa(5) },
  { id: 4,  titulo: 'Corrigir cálculo de multa por atraso',   tipo: 'Defeito',      prioridade: 'Crítica', status: 'Concluída',    projeto: 'App Biblioteca',      responsavel: 'Luiggi Fraga',    dataCriacao: dataRelativa(-40), prazo: dataRelativa(-5) },
  { id: 5,  titulo: 'Criar tela de cadastro de demandas',     tipo: 'Tarefa',       prioridade: 'Alta',    status: 'Em andamento', projeto: 'Sistema de Demandas', responsavel: 'Luiggi Fraga',    dataCriacao: dataRelativa(-25), prazo: dataRelativa(3) },
  { id: 6,  titulo: 'Documentar rotas do backend',            tipo: 'Documentação', prioridade: 'Média',   status: 'Aberta',       projeto: 'Sistema de Demandas', responsavel: 'Pietro Giati',    dataCriacao: dataRelativa(-6),  prazo: dataRelativa(0) },
  { id: 7,  titulo: 'Ajustar layout da listagem no celular',  tipo: 'Melhoria',     prioridade: 'Alta',    status: 'Aberta',       projeto: 'Sistema de Demandas', responsavel: 'Gustavo Pietro',  dataCriacao: dataRelativa(-5),  prazo: dataRelativa(6) },
  { id: 8,  titulo: 'Criar rota GET /dashboard',              tipo: 'Tarefa',       prioridade: 'Alta',    status: 'Aberta',       projeto: 'Sistema de Demandas', responsavel: 'Gustavo Manera',  dataCriacao: dataRelativa(-3),  prazo: dataRelativa(10) },
  { id: 9,  titulo: 'Exportar relatório de demandas em PDF',  tipo: 'Melhoria',     prioridade: 'Baixa',   status: 'Cancelada',    projeto: 'Sistema de Demandas', responsavel: 'Gustavo Manera',  dataCriacao: dataRelativa(-30), prazo: dataRelativa(2) },
  { id: 10, titulo: 'Notas não aparecem no boletim',          tipo: 'Defeito',      prioridade: 'Alta',    status: 'Em andamento', projeto: 'Portal do Aluno',     responsavel: 'Rafael Soares',   dataCriacao: dataRelativa(-12), prazo: dataRelativa(4) },
  { id: 11, titulo: 'Tela de matrícula online',               tipo: 'Tarefa',       prioridade: 'Média',   status: 'Em revisão',   projeto: 'Portal do Aluno',     responsavel: 'Gustavo Pietro',  dataCriacao: dataRelativa(-35), prazo: dataRelativa(12) },
  { id: 12, titulo: 'Manual do usuário do portal',            tipo: 'Documentação', prioridade: 'Baixa',   status: 'Aberta',       projeto: 'Portal do Aluno',     responsavel: 'Luiggi Fraga',    dataCriacao: dataRelativa(-15), prazo: dataRelativa(25) },
  { id: 13, titulo: 'Melhorar busca do acervo',               tipo: 'Melhoria',     prioridade: 'Média',   status: 'Em andamento', projeto: 'App Biblioteca',      responsavel: 'Pietro Giati',    dataCriacao: dataRelativa(-18), prazo: dataRelativa(7) },
  { id: 14, titulo: 'Cadastro de empréstimos',                tipo: 'Tarefa',       prioridade: 'Alta',    status: 'Concluída',    projeto: 'App Biblioteca',      responsavel: 'Gustavo Manera',  dataCriacao: dataRelativa(-60), prazo: dataRelativa(-20) },
  { id: 15, titulo: 'Leitor de código de barras',             tipo: 'Tarefa',       prioridade: 'Média',   status: 'Em andamento', projeto: 'App Biblioteca',      responsavel: 'Rafael Soares',   dataCriacao: dataRelativa(-9),  prazo: dataRelativa(-1) },
  { id: 16, titulo: 'Diagrama do banco de dados',             tipo: 'Documentação', prioridade: 'Média',   status: 'Concluída',    projeto: 'App Biblioteca',      responsavel: 'Luiggi Fraga',    dataCriacao: dataRelativa(-50), prazo: dataRelativa(-30) },
  { id: 17, titulo: 'Notificar prazo por e-mail',             tipo: 'Melhoria',     prioridade: 'Baixa',   status: 'Em revisão',   projeto: 'Portal do Aluno',     responsavel: 'Pietro Giati',    dataCriacao: dataRelativa(-4),  prazo: dataRelativa(20) },
  { id: 18, titulo: 'Migrar servidor de testes',              tipo: 'Tarefa',       prioridade: 'Baixa',   status: 'Cancelada',    projeto: 'Portal do Aluno',     responsavel: 'Gustavo Pietro',  dataCriacao: dataRelativa(-45), prazo: dataRelativa(-10) },
  // Demanda INVÁLIDA de propósito: "Pendente" não é um status do escopo.
  // Ela é ignorada nos cálculos e gera um aviso na tela.
  { id: 19, titulo: 'Revisar textos da tela de login',        tipo: 'Tarefa',       prioridade: 'Baixa',   status: 'Pendente',     projeto: 'Sistema de Demandas', responsavel: 'Gustavo Manera',  dataCriacao: dataRelativa(-2),  prazo: dataRelativa(8) }
];


/* ===================================================================
   3. FUNÇÕES DE CÁLCULO (puras: não mexem na tela)
   Recebem as demandas e devolvem números e listas. Por isso podem ser
   copiadas para o backend na rota GET /dashboard sem mudanças.
   =================================================================== */

// ----- Datas -----

// Converte um objeto Date em texto 'AAAA-MM-DD' (formato do <input type="date">)
function paraTextoISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0'); // getMonth() começa em 0
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Converte o texto 'AAAA-MM-DD' em Date (no fuso local).
// Devolve null se o texto não for uma data válida (ex.: '2026-02-31').
// Obs.: new Date('2026-10-19') usaria o fuso UTC e, no Brasil, viraria o
// dia anterior. Por isso a data é montada com ano, mês e dia separados.
function textoParaData(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return null;
  }
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  // Se o dia não existir, o JS "pula" para o mês seguinte; aqui isso é recusado
  if (data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }
  return data;
}

// Converte 'AAAA-MM-DD' em 'DD/MM/AAAA' para mostrar na tela
function formatarDataBR(texto) {
  const [ano, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Quantos dias faltam do dia "hoje" até o prazo.
// Positivo = ainda falta; 0 = vence hoje; negativo = atrasada.
function diasAte(prazoTexto, hoje) {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const prazo = textoParaData(prazoTexto);
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  // Math.round corrige diferenças de 1 hora causadas por horário de verão
  return Math.round((prazo - inicioDeHoje) / MS_POR_DIA);
}

// ----- Validações -----

// Confere se a demanda usa só valores do escopo e datas válidas.
// Devolve a lista de problemas encontrados (lista vazia = demanda válida).
function validarDemanda(demanda) {
  const erros = [];
  if (!demanda.titulo || demanda.titulo.trim() === '') erros.push('título vazio');
  if (!TIPOS.includes(demanda.tipo)) erros.push(`tipo "${demanda.tipo}" inválido`);
  if (!PRIORIDADES.includes(demanda.prioridade)) erros.push(`prioridade "${demanda.prioridade}" inválida`);
  if (!STATUS.includes(demanda.status)) erros.push(`status "${demanda.status}" inválido`);
  if (!textoParaData(demanda.dataCriacao)) erros.push('data de criação inválida');
  if (!textoParaData(demanda.prazo)) erros.push('prazo inválido');
  return erros;
}

// Separa as demandas em válidas (entram nos cálculos) e inválidas (ignoradas)
function separarDemandasValidas(demandas) {
  const validas = [];
  const invalidas = [];
  demandas.forEach(function (demanda) {
    const erros = validarDemanda(demanda);
    if (erros.length === 0) {
      validas.push(demanda);
    } else {
      invalidas.push({ demanda: demanda, erros: erros });
    }
  });
  return { validas: validas, invalidas: invalidas };
}

// Confere os filtros escolhidos pelo usuário.
// Devolve null se estiver tudo certo, ou um objeto com a mensagem de erro
// e os nomes dos campos com problema (para a tela marcar em vermelho).
function validarFiltros(filtros) {
  if (filtros.projeto && !PROJETOS.includes(filtros.projeto)) {
    return { mensagem: 'Projeto inválido. Escolha um projeto da lista.', campos: ['projeto'] };
  }

  const inicio = filtros.dataInicio ? textoParaData(filtros.dataInicio) : null;
  const fim = filtros.dataFim ? textoParaData(filtros.dataFim) : null;

  if (filtros.dataInicio && !inicio) {
    return { mensagem: 'A data inicial é inválida. Use o formato dia/mês/ano.', campos: ['dataInicio'] };
  }
  if (filtros.dataFim && !fim) {
    return { mensagem: 'A data final é inválida. Use o formato dia/mês/ano.', campos: ['dataFim'] };
  }
  if (inicio && fim && inicio > fim) {
    return {
      mensagem: 'Período inválido: a data inicial não pode ser depois da data final.',
      campos: ['dataInicio', 'dataFim']
    };
  }
  return null;
}

// ----- Filtro e contagens -----

// Devolve só as demandas que passam nos filtros de projeto e de período.
// As datas 'AAAA-MM-DD' podem ser comparadas como texto, porque a ordem
// alfabética é igual à ordem cronológica nesse formato.
function filtrarDemandas(demandas, filtros) {
  return demandas.filter(function (demanda) {
    if (filtros.projeto && demanda.projeto !== filtros.projeto) return false;
    if (filtros.dataInicio && demanda.dataCriacao < filtros.dataInicio) return false;
    if (filtros.dataFim && demanda.dataCriacao > filtros.dataFim) return false;
    return true;
  });
}

// Conta quantas demandas existem para cada valor de um campo.
// Ex.: contarPor(demandas, 'status', STATUS) => { 'Aberta': 5, 'Em andamento': 5, ... }
// Todos os valores começam em 0, para aparecerem mesmo sem nenhuma demanda.
function contarPor(demandas, campo, valores) {
  const contagem = {};
  valores.forEach(function (valor) {
    contagem[valor] = 0;
  });
  demandas.forEach(function (demanda) {
    if (demanda[campo] in contagem) {
      contagem[demanda[campo]]++;
    }
  });
  return contagem;
}

// Demanda "em aberto" = qualquer status que não seja Concluída ou Cancelada
function estaEmAberto(demanda) {
  return !STATUS_ENCERRADOS.includes(demanda.status);
}

// Demandas de prioridade Crítica ainda em aberto, da mais urgente para a menos
function listarCriticasEmAberto(demandas) {
  return demandas
    .filter(function (demanda) {
      return demanda.prioridade === 'Crítica' && estaEmAberto(demanda);
    })
    .sort(function (a, b) {
      return a.prazo.localeCompare(b.prazo); // prazo mais próximo primeiro
    });
}

// Demandas em aberto com prazo nos próximos "limiteDias" dias ou já atrasadas.
// Cada item ganha o campo diasRestantes, para a tela mostrar quantos dias faltam.
function listarProximasDoPrazo(demandas, hoje, limiteDias) {
  return demandas
    .filter(estaEmAberto)
    .map(function (demanda) {
      // Copia a demanda e acrescenta os dias restantes (não altera a original)
      return Object.assign({}, demanda, { diasRestantes: diasAte(demanda.prazo, hoje) });
    })
    .filter(function (demanda) {
      return demanda.diasRestantes <= limiteDias;
    })
    .sort(function (a, b) {
      return a.diasRestantes - b.diasRestantes; // atrasadas primeiro
    });
}

// Função principal do cálculo: junta todos os números do dashboard num objeto.
// É exatamente este objeto que a futura rota GET /dashboard vai devolver em JSON.
function calcularDashboard(demandas, hoje) {
  return {
    total: demandas.length,
    porStatus: contarPor(demandas, 'status', STATUS),
    porPrioridade: contarPor(demandas, 'prioridade', PRIORIDADES),
    porTipo: contarPor(demandas, 'tipo', TIPOS),
    criticasEmAberto: listarCriticasEmAberto(demandas),
    proximasDoPrazo: listarProximasDoPrazo(demandas, hoje, DIAS_ALERTA_PRAZO)
  };
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
   4. FUNÇÕES DE TELA (manipulação do DOM)
   Só mostram na tela o que as funções de cálculo devolveram.
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
  container.replaceChildren(); // apaga as barras do cálculo anterior

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

// Preenche a tabela de demandas críticas em aberto
function renderizarCriticas(lista, hoje) {
  const corpo = document.getElementById('tabela-criticas');
  corpo.replaceChildren();
  document.getElementById('qtd-criticas').textContent = lista.length;

  if (lista.length === 0) {
    corpo.appendChild(criarLinhaVazia('Nenhuma demanda crítica em aberto.', 4));
    return;
  }

  lista.forEach(function (demanda) {
    // Prazo em vermelho quando a demanda crítica já está atrasada
    const classePrazo = diasAte(demanda.prazo, hoje) < 0 ? 'prazo-alerta' : '';
    corpo.appendChild(criarLinhaDemanda(demanda, [
      criarCelula(criarEtiqueta(demanda.status, CLASSE_STATUS[demanda.status])),
      criarCelula(demanda.responsavel),
      criarCelula(formatarDataBR(demanda.prazo), classePrazo)
    ]));
  });
}

// Preenche a tabela de demandas próximas do prazo, com os dias restantes
function renderizarProximasDoPrazo(lista) {
  const corpo = document.getElementById('tabela-prazos');
  corpo.replaceChildren();
  document.getElementById('qtd-prazos').textContent = lista.length;

  if (lista.length === 0) {
    corpo.appendChild(criarLinhaVazia(`Nenhuma demanda vence nos próximos ${DIAS_ALERTA_PRAZO} dias.`, 5));
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

// Usada quando o filtro é inválido: apaga os números, gráficos e tabelas,
// para a tela não mostrar resultados de um filtro anterior junto com o erro
function limparResultados() {
  const texto = 'Corrija o filtro para ver os dados.';
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
// tipo: 'info' (resultado normal), 'vazio' (nada encontrado) ou 'erro' (validação)
function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById('mensagem-filtro');
  mensagem.textContent = texto;
  mensagem.className = 'mensagem mensagem-' + tipo;
}

// Mostra o aviso de demandas ignoradas por terem dados fora do escopo
function mostrarAvisoDadosInvalidos(invalidas) {
  const aviso = document.getElementById('aviso-dados');
  if (invalidas.length === 0) {
    aviso.hidden = true;
    return;
  }
  const detalhes = invalidas.map(function (item) {
    return `"${item.demanda.titulo}" (${item.erros.join(', ')})`;
  });
  aviso.textContent = `Atenção: ${invalidas.length} ${invalidas.length === 1 ? 'demanda foi ignorada' : 'demandas foram ignoradas'} `
    + `por ter dados fora do escopo: ${detalhes.join('; ')}.`;
  aviso.hidden = false;
  // Também registra no console, para quem estiver depurando
  console.warn('Demandas ignoradas no dashboard:', invalidas);
}

// Relação entre o nome do campo no filtro e o id do elemento na tela
const CAMPOS_FILTRO = {
  projeto: 'filtro-projeto',
  dataInicio: 'filtro-data-inicio',
  dataFim: 'filtro-data-fim'
};

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

// Cria uma <option> no select de projetos para cada projeto cadastrado
function preencherProjetos() {
  const select = document.getElementById(CAMPOS_FILTRO.projeto);
  PROJETOS.forEach(function (projeto) {
    const opcao = document.createElement('option');
    opcao.value = projeto;
    opcao.textContent = projeto;
    select.appendChild(opcao);
  });
}


/* ===================================================================
   5. EVENTOS E INICIALIZAÇÃO
   =================================================================== */

// Demandas que passaram na validação (preenchida em iniciarDashboard)
let demandasValidas = [];

// Recalcula e redesenha o dashboard inteiro com os filtros atuais.
// É chamada ao abrir a tela e sempre que um filtro muda.
function atualizarDashboard() {
  const filtros = lerFiltros();

  // 1) Valida os filtros. Se houver erro, avisa, limpa os resultados e
  //    não recalcula.
  const erro = validarFiltros(filtros);
  if (erro) {
    marcarCamposInvalidos(erro.campos);
    mostrarMensagem(erro.mensagem, 'erro');
    limparResultados();
    return;
  }
  marcarCamposInvalidos([]);

  // 2) Calcula (funções puras) ...
  const hoje = new Date();
  const filtradas = filtrarDemandas(demandasValidas, filtros);
  const resumo = calcularDashboard(filtradas, hoje);

  // 3) ... e mostra na tela (funções de DOM)
  renderizarContadores(resumo);
  renderizarGrafico(document.getElementById('grafico-prioridade'), resumo.porPrioridade, CLASSE_PRIORIDADE);
  renderizarGrafico(document.getElementById('grafico-tipo'), resumo.porTipo, {});
  renderizarCriticas(resumo.criticasEmAberto, hoje);
  renderizarProximasDoPrazo(resumo.proximasDoPrazo);

  // 4) Mensagem do resultado: vazio ou quantidade encontrada
  if (resumo.total === 0) {
    mostrarMensagem('Nenhuma demanda encontrada para este filtro. Escolha outro projeto ou período.', 'vazio');
  } else {
    const plural = demandasValidas.length === 1 ? 'demanda' : 'demandas';
    mostrarMensagem(`Mostrando ${resumo.total} de ${demandasValidas.length} ${plural}.`, 'info');
  }
}

// Volta todos os filtros ao valor inicial e recalcula
function limparFiltros() {
  document.getElementById('form-filtros').reset();
  atualizarDashboard();
}

// Prepara a tela: valida os dados, liga os eventos e desenha o dashboard
function iniciarDashboard() {
  // Data de hoje no subtítulo
  document.getElementById('data-hoje').textContent = formatarDataBR(paraTextoISO(new Date()));

  // Valida as demandas uma única vez e guarda só as válidas
  const separadas = separarDemandasValidas(DEMANDAS_TESTE);
  demandasValidas = separadas.validas;
  mostrarAvisoDadosInvalidos(separadas.invalidas);

  preencherProjetos();

  // Qualquer mudança nos filtros recalcula o dashboard na hora
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
