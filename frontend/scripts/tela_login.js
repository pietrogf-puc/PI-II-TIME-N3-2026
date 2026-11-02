// Arquivo tela_login.js feito por Pietro Giati de Favari
// Ra: 26028869
// Script da tela de login: validações no navegador + autenticação pela API.

const API_URL = "http://localhost:3000";

// Domínios de e-mail aceitos (o backend valida a mesma lista)
const DOMINIOS_PERMITIDOS = ["gmail.com", "puccampinas.edu.br", "puc-campinas.edu.br"];

const COR_OK = "rgb(21, 255, 0)";
const COR_ERRO = "red";

// ---------- Elementos da página ----------
const formularioLogin = document.getElementById("formulario");
const forms_invalido = document.getElementById("forms_invalido");
const botaoLogin = document.getElementById("loginBtn");

const email = document.getElementById("email");
const erro_email = document.getElementById("mensagem_erro_email");

const senha = document.getElementById("senha");
const requerimentos = document.getElementById("requerimentos");
const req_espacos = document.getElementById("req_espacos");
const req_maiuscula = document.getElementById("maiuscula");
const req_minuscula = document.getElementById("minuscula");
const req_numero = document.getElementById("numero");
const req_especial = document.getElementById("c_especial");

// ---------- Funções auxiliares ----------

// Confere se o e-mail termina com um dos domínios permitidos
function emailTemDominioPermitido(valor) {
    const emailLimpo = valor.trim().toLowerCase();
    return DOMINIOS_PERMITIDOS.some(function (dominio) {
        return emailLimpo.endsWith("@" + dominio);
    });
}

// Mostra uma mensagem de erro geral do formulário
function mostrarErroFormulario(mensagem) {
    forms_invalido.innerHTML = mensagem;
    forms_invalido.style.color = COR_ERRO;
    forms_invalido.style.display = "block";
}

// Pinta o requisito de verde (cumprido) ou vermelho (não cumprido)
function pintar(elemento, cumprido) {
    elemento.style.color = cumprido ? COR_OK : COR_ERRO;
}

// Verifica cada requisito da senha e atualiza as cores da lista
function verificarSenha() {
    const valor = senha.value;

    pintar(req_espacos, valor !== "" && !/\s/.test(valor)); // \s = qualquer espaço em branco
    pintar(req_maiuscula, /[A-Z]/.test(valor));
    pintar(req_minuscula, /[a-z]/.test(valor));
    pintar(req_numero, /[0-9]/.test(valor));
    pintar(req_especial, /[!@#_*-]/.test(valor));
}

// A senha só é válida se cumprir todos os requisitos
function senhaEhValida(valor) {
    return (
        valor !== "" &&
        !/\s/.test(valor) &&
        /[A-Z]/.test(valor) &&
        /[a-z]/.test(valor) &&
        /[0-9]/.test(valor) &&
        /[!@#_*-]/.test(valor)
    );
}

// ---------- Eventos de validação enquanto o usuário digita ----------

// Mensagem de erro do e-mail (o erro de e-mail vazio é tratado no envio)
email.addEventListener("input", function () {
    if (email.value.trim() === "" || emailTemDominioPermitido(email.value)) {
        erro_email.style.display = "none";
        return;
    }

    erro_email.style.display = "block";
    erro_email.innerHTML =
        "E-mail inválido! <br> Use uma das seguintes opções: <br> @gmail.com <br> @puccampinas.edu.br <br> @puc-campinas.edu.br";
    erro_email.style.color = COR_ERRO;
});

// Mostra os requisitos da senha ao clicar no campo e esconde ao sair
senha.addEventListener("focus", function () {
    requerimentos.style.display = "block";
    verificarSenha();
});

senha.addEventListener("blur", function () {
    requerimentos.style.display = "none";
});

// Atualiza os requisitos enquanto digita
senha.addEventListener("input", verificarSenha);

// ---------- Envio do formulário ----------
formularioLogin.addEventListener("submit", async function (evento) {
    evento.preventDefault(); // impede o envio padrão do navegador

    const emailVazio = email.value.trim() === "";
    const senhaVazia = senha.value.trim() === "";

    // Validações do navegador (o servidor valida tudo de novo)
    if (emailVazio) {
        erro_email.style.display = "block";
        erro_email.innerHTML = "Seu email não pode estar vazio";
        erro_email.style.color = COR_ERRO;
    }

    if (senhaVazia || !senhaEhValida(senha.value)) {
        requerimentos.style.display = "block";
        verificarSenha();
    }

    if (emailVazio || senhaVazia || !emailTemDominioPermitido(email.value) || !senhaEhValida(senha.value)) {
        mostrarErroFormulario("Email ou senha inválidos. <br> Não foi possível enviar seu formulário.");
        return;
    }

    forms_invalido.style.display = "none";
    botaoLogin.disabled = true; // evita cliques repetidos durante a requisição

    // Envia os dados para a API
    try {
        const resposta = await fetch(API_URL + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email.value.trim(),
                senha: senha.value
            })
        });

        // Se o servidor não devolver JSON, usa um objeto vazio
        const resultado = await resposta.json().catch(function () {
            return {};
        });

        if (!resposta.ok) {
            mostrarErroFormulario(resultado.mensagem || "Não foi possível realizar o login.");
            return;
        }

        if (!resultado.token || !resultado.usuario) {
            mostrarErroFormulario("Resposta inesperada do servidor.");
            return;
        }

        // Guarda a sessão para as outras telas usarem
        sessionStorage.setItem("token", resultado.token);
        sessionStorage.setItem("usuario", JSON.stringify(resultado.usuario));

        window.location.href = "dashboard.html";
    } catch (erro) {
        console.error("Erro ao comunicar com o backend:", erro);
        mostrarErroFormulario("Não foi possível conectar ao servidor.");
    } finally {
        botaoLogin.disabled = false;
    }
});
