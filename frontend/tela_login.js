// Arquivo TelaDeLogin.js feito por Pietro Giati de Favari
// Ra: 26028869

const formularioLogin = document.getElementById("formulario");
const forms_invalido = document.getElementById("forms_invalido");


//Requerimento senha
const req_maiuscula = document.getElementById("maiuscula");
const req_minuscula = document.getElementById("minuscula");
const req_numero = document.getElementById("numero");
const req_especial = document.getElementById("c_especial");
const req_espacos = document.getElementById("req_espacos");
const requerimentos = document.getElementById("requerimentos");
const senha = document.getElementById("senha");


//Email
const email = document.getElementById("email");
const erro_email = document.getElementById("mensagem_erro_email");


//Mensagem de erro email
email.addEventListener("input", function () {
    const emailValido =
        email.value.endsWith("@gmail.com") ||
        email.value.endsWith("@puccampinas.edu.br") ||
        email.value.endsWith("@puc-campinas.edu.br");


    if (!emailValido) {
        erro_email.style.display = "block"
        erro_email.innerHTML = "E-mail inválido! <br> Use uma das seguintes opções: <br> @gmail.com <br> @puccampinas.edu.br <br> @puc-campinas.edu.br";
        erro_email.style.color = "red"
    }
    else {
        erro_email.style.display = "none";
    }
    //erro de email vazio esta na funcao de enviar formulario
})

//Deixar os requisitos da senha visiveis ao clicar no input da senha e some ao sair dela
senha.addEventListener("focus", function () {
    requerimentos.style.display = "block";
    verificarSenha();
})


//Tirar os erros da senha
senha.addEventListener("blur", function () {
    requerimentos.style.display = "none";
})


//Verificar Requisitos da senha
function verificarSenha() {

    //Erro de senha vazia esta ao enviar o forms

    //Verificar Espaços
    if (senha.value !== "" && !/\s/.test(senha.value)) {
        req_espacos.style.color = "rgb(21, 255, 0)";
    } //O \s representa qualquer espaço em branco,
    //a senha não está vazia e não tem nenhum espaço
    else {
        req_espacos.style.color = "red"
    }

    //Verificar Maiuscula

    if (/[A-Z]/.test(senha.value)) {
        req_maiuscula.style.color = "rgb(21, 255, 0)";
    }
    else {
        req_maiuscula.style.color = "red"
    }

    // Verificar Minuscula

    if (/[a-z]/.test(senha.value)) {
        req_minuscula.style.color = "rgb(21, 255, 0)";
    }
    else {
        req_minuscula.style.color = "red";
    }

    //Verificar Numero

    if (/[0-9]/.test(senha.value)) {
        req_numero.style.color = "rgb(21, 255, 0)";
    }
    else {
        req_numero.style.color = "red";
    }

    //Verificar Caractere Especial

    if (/[!@#_*-]/.test(senha.value)) {
        req_especial.style.color = "rgb(21, 255, 0)";
    }
    else {
        req_especial.style.color = "red";
    }
}


//Verificar os requisitos enquanto digita
senha.addEventListener("input", verificarSenha);


//Enviar ou Não o formulário
formularioLogin.addEventListener("submit", function (cancelarEnvio) {
    const emailVazio = email.value.trim() === ""; // o trim remove os espaços
    const senhaVazia = senha.value.trim() === "";
    const senhaComEspaco = /\s/.test(senha.value);

    const emailValido =
        email.value.endsWith("@gmail.com") ||
        email.value.endsWith("@puccampinas.edu.br") ||
        email.value.endsWith("@puc-campinas.edu.br");

    const senhaValida =
        /[A-Z]/.test(senha.value) &&
        /[a-z]/.test(senha.value) &&
        /[0-9]/.test(senha.value) &&
        /[!@#_*-]/.test(senha.value) &&
        !senhaComEspaco;

    if (emailVazio) {
        erro_email.style.display = "block";
        erro_email.innerHTML = "Seu email não pode estar vazio";
        erro_email.style.color = "red"
    }

    if (senhaVazia || senhaComEspaco) {
        requerimentos.style.display = "block";
        verificarSenha();
    }



    if (emailVazio || senhaVazia || !emailValido || !senhaValida || senhaComEspaco) {
        cancelarEnvio.preventDefault(); // impede o envio, por padrao o navegador envia
        forms_invalido.innerHTML = "Email ou senha invalidos <br> Não foi possível enviar seu formulário";
        forms_invalido.style.color = "red";
        forms_invalido.style.display = "block"
    }

})