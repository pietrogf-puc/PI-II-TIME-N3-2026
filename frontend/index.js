
// Requisitos da senha + verificar eles

const req_maiuscula = document.getElementById("maiuscula")
const req_minuscula = document.getElementById("minuscula")
const req_numero = document.getElementById("numero")
const req_especial = document.getElementById("c_especial")

const senha = document.getElementById("senha")


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