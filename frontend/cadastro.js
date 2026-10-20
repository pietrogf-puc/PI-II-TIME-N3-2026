
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
});
tipo.addEventListener("change", function () {
    verificarSelect(tipo, erro_tipo, "Selecione um tipo");
});
prioridade.addEventListener("change", function () {
    verificarSelect(prioridade, erro_prioridade, "Selecione uma prioridade");
});
responsavel.addEventListener("change", function () {
    verificarSelect(responsavel, erro_responsavel, "Selecione um responsável");
});



formulario.addEventListener("submit", function (cancelarEnvio) {
    cancelarEnvio.preventDefault(); 

    
    const tituloValido = verificarTitulo();
    const descricaoValida = verificarDescricao();
    const projetoValido = verificarSelect(projeto, erro_projeto, "Selecione um projeto");
    const tipoValido = verificarSelect(tipo, erro_tipo, "Selecione um tipo");
    const prioridadeValida = verificarSelect(prioridade, erro_prioridade, "Selecione uma prioridade");
    const responsavelValido = verificarSelect(responsavel, erro_responsavel, "Selecione um responsável");
    const prazoValido = verificarPrazo();

    if (tituloValido && descricaoValida && projetoValido && tipoValido &&
        prioridadeValida && responsavelValido && prazoValido) {

        
        formulario.reset();

       
        mensagem_formulario.innerHTML = "Demanda cadastrada com sucesso!";
        mensagem_formulario.className = "mensagem_sucesso";
        mensagem_formulario.style.display = "block";
    }
    else {
        mensagem_formulario.innerHTML = "Não foi possível cadastrar a demanda. <br> Corrija os campos marcados em vermelho.";
        mensagem_formulario.className = "mensagem_erro";
        mensagem_formulario.style.display = "block";
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
    mensagem_formulario.style.display = "none";
});
