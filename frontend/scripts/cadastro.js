//AUTOR DO ARQUIVO: LUIGGI FRAGA ; RA: 26026323//

const formulario = document.getElementById("formulario");
const mensagem_formulario = document.getElementById("mensagem_formulario");



const titulo = document.getElementById("titulo");
const descricao = document.getElementById("descricao");
const projeto = document.getElementById("projeto");
const tipo = document.getElementById("tipo");
const prioridade = document.getElementById("prioridade");
const responsavel = document.getElementById("responsavel");
const prazo = document.getElementById("prazo");



const erro_titulo = document.getElementById("erro_titulo");
const erro_descricao = document.getElementById("erro_descricao");
const erro_projeto = document.getElementById("erro_projeto");
const erro_tipo = document.getElementById("erro_tipo");
const erro_prioridade = document.getElementById("erro_prioridade");
const erro_responsavel = document.getElementById("erro_responsavel");
const erro_prazo = document.getElementById("erro_prazo");
const URL_API = "http://localhost:3000";
let participantes = []; // [{ id_projeto, id, nome }]

// Monta o select de responsável só com quem participa do projeto escolhido
function preencherResponsaveis() {
    responsavel.length = 1; // mantém só a opção "Sem responsável"
    const doProjeto = participantes.filter(function (p) {
        return p.id_projeto === Number(projeto.value);
    });
    preencherSelect(responsavel, doProjeto);
}


// Pega as iniciais do nome: "Administrador Teste" -> "AT"
function pegarIniciais(nome) {
    const partes = nome.trim().split(" ");
    const primeira = partes[0][0];
    let ultima = "";
    if (partes.length > 1) {
        ultima = partes[partes.length - 1][0];
    }
    return (primeira + ultima).toUpperCase();
}

// Escreve no cabeçalho o nome, o perfil e as iniciais de quem fez login
function mostrarUsuario() {
    // O sessionStorage só guarda texto, então o JSON.parse transforma de volta em objeto
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));

    // Sem usuário guardado = ninguém fez login
    if (!usuario) {
        window.location.href = "tela_login.html";
        return;
    }

    document.getElementById("nome_usuario").textContent = usuario.nome;
    document.getElementById("perfil_usuario").textContent = usuario.perfil;
    document.getElementById("avatar").textContent = pegarIniciais(usuario.nome);
}

mostrarUsuario();

function mostrarMensagem(texto, classe) {
    mensagem_formulario.innerHTML = texto;
    mensagem_formulario.className = classe;
    mensagem_formulario.style.display = "block";
}


// Coloca cada item da lista como uma <option> do select (value = id do banco)
function preencherSelect(select, lista) {
    for (const item of lista) {
        const opcao = document.createElement("option");
        opcao.value = item.id;
        opcao.textContent = item.nome;
        select.appendChild(opcao);
    }
}


// Busca no backend os projetos, tipos, prioridades e usuários
async function carregarOpcoes() {
    const token = sessionStorage.getItem("token");

    const resposta = await fetch(URL_API + "/demandas/opcoes", {
        headers: { "Authorization": "Bearer " + token }
    });

    // Sem token ou token vencido: volta para a tela de login
    if (!resposta.ok) {
        window.location.href = "tela_login.html";
        return;
    }

    const opcoes = await resposta.json();
    preencherSelect(projeto, opcoes.projetos);
    preencherSelect(tipo, opcoes.tipos);
    preencherSelect(prioridade, opcoes.prioridades);
    participantes = opcoes.participantes;
}

carregarOpcoes();



function mostrarErro(campo, erro, texto) {
    campo.classList.add("campo_invalido"); 
    erro.innerHTML = texto;
    erro.style.display = "block";
}


function limparErro(campo, erro) {
    campo.classList.remove("campo_invalido");
    erro.innerHTML = "";
    erro.style.display = "none";
}



function dataDeHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0"); 
    const dia = String(hoje.getDate()).padStart(2, "0");      
    return ano + "-" + mes + "-" + dia;
}



prazo.min = dataDeHoje();



function verificarTitulo() {
    const texto = titulo.value.trim(); 

    if (texto === "") {
        mostrarErro(titulo, erro_titulo, "O título não pode estar vazio");
        return false;
    }
    if (texto.length < 5) {
        mostrarErro(titulo, erro_titulo, "O título precisa ter pelo menos 5 caracteres");
        return false;
    }
    if (texto.length > 100) {
        mostrarErro(titulo, erro_titulo, "O título pode ter no máximo 100 caracteres");
        return false;
    }

    limparErro(titulo, erro_titulo);
    return true;
}



function verificarDescricao() {
    const texto = descricao.value.trim();

    if (texto === "") {
        mostrarErro(descricao, erro_descricao, "A descrição não pode estar vazia");
        return false;
    }
    if (texto.length < 10) {
        mostrarErro(descricao, erro_descricao, "A descrição precisa ter pelo menos 10 caracteres");
        return false;
    }

    limparErro(descricao, erro_descricao);
    return true;
}




function verificarSelect(select, erro, texto) {
    if (select.value === "") {
        mostrarErro(select, erro, texto);
        return false;
    }

    limparErro(select, erro);
    return true;
}



function verificarPrazo() {
    if (prazo.value === "") {
        mostrarErro(prazo, erro_prazo, "Escolha um prazo");
        return false;
    }
    
    if (prazo.value < dataDeHoje()) {
        mostrarErro(prazo, erro_prazo, "O prazo não pode ser uma data que já passou");
        return false;
    }

    limparErro(prazo, erro_prazo);
    return true;
}



titulo.addEventListener("input", verificarTitulo);
descricao.addEventListener("input", verificarDescricao);
prazo.addEventListener("change", verificarPrazo);

projeto.addEventListener("change", function () {
    verificarSelect(projeto, erro_projeto, "Selecione um projeto");
    preencherResponsaveis(); // troca a lista de responsáveis pelos participantes deste projeto
});
tipo.addEventListener("change", function () {
    verificarSelect(tipo, erro_tipo, "Selecione um tipo");
});
prioridade.addEventListener("change", function () {
    verificarSelect(prioridade, erro_prioridade, "Selecione uma prioridade");
});




formulario.addEventListener("submit", async function (cancelarEnvio) {
    cancelarEnvio.preventDefault();


    const tituloValido = verificarTitulo();
    const descricaoValida = verificarDescricao();
    const projetoValido = verificarSelect(projeto, erro_projeto, "Selecione um projeto");
    const tipoValido = verificarSelect(tipo, erro_tipo, "Selecione um tipo");
    const prioridadeValida = verificarSelect(prioridade, erro_prioridade, "Selecione uma prioridade");
    const prazoValido = verificarPrazo();

    if (tituloValido && descricaoValida && projetoValido && tipoValido &&
        prioridadeValida && prazoValido) {

        // Junta os dados do formulário (os nomes são os que o backend espera)
        const dados = {
            titulo: titulo.value.trim(),
            descricao: descricao.value.trim(),
            id_projeto: Number(projeto.value),
            id_tipo: Number(tipo.value),
            id_prioridade: Number(prioridade.value),
            id_responsavel: responsavel.value === "" ? null : Number(responsavel.value),
            prazo: prazo.value
        };

        const token = sessionStorage.getItem("token");

        // Manda para o backend gravar no banco
        const resposta = await fetch(URL_API + "/demandas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            formulario.reset();
            mostrarMensagem("Demanda cadastrada com sucesso!", "mensagem_sucesso");
        }
        else {
            // Mostra o erro que veio do backend (ex.: sem permissão)
            mostrarMensagem(resultado.mensagem, "mensagem_erro");
        }
    }
    else {
        mostrarMensagem("Não foi possível cadastrar a demanda. <br> Corrija os campos marcados em vermelho.", "mensagem_erro");
    }
});




formulario.addEventListener("reset", function () {
    limparErro(titulo, erro_titulo);
    limparErro(descricao, erro_descricao);
    limparErro(projeto, erro_projeto);
    limparErro(tipo, erro_tipo);
    limparErro(prioridade, erro_prioridade);
    limparErro(responsavel, erro_responsavel);
    limparErro(prazo, erro_prazo);
    responsavel.length = 1; // sem projeto escolhido, a lista de responsáveis volta a ter só "Sem responsável"
    mensagem_formulario.style.display = "none";
});
