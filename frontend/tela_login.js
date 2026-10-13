const formularioLogin = document.getElementById("formulario");

//Requerimento senha
const req_maiuscula = document.getElementById("maiuscula");
const req_minuscula = document.getElementById("minuscula");
const req_numero = document.getElementById("numero");
const req_especial = document.getElementById("c_especial");
const requerimentos = document.getElementById("requerimentos");
const senha = document.getElementById("senha");

//Email
const email = document.getElementById("email");
const erro_email = document.getElementById("mensagem_erro_email");


//Mensagem de erro email
email.addEventListener("input", function () {
    if (!email.value.endsWith("@gmail.com" || "@puccampinas.edu.br" || "puc-campinas.com.br")) {
        erro_email.style.display = "block"
        erro_email.innerHTML = "E-mail inválido! <br> Use uma das seguintes opções: <br> @gmail.com <br> @puccampinas.edu.br <br> @puc-campinas.edu.br";
        erro_email.style.color = "red"
    }
})

//Deixar os requisitos visiveis ao clicar no input da senha
senha.addEventListener("focus", function () {
    requerimentos.style.display = "block";
})


//Verificar Requisitos da senha
senha.addEventListener("input", function () {


    //o .value mostra o texto que esta dentro,
    // sem ele mostra a linha toda <li>...</li>

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

    if (/[! @ # _ - *]/.test(senha.value)) {
        req_especial.style.color = "rgb(21, 255, 0)";
    }
    else {
        req_especial.style.color = "red";
    }

})

