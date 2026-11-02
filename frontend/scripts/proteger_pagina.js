
const token = sessionStorage.getItem("token");

if (!token) {
    alert("Você precisa fazer login para acessar esta página.");
    window.location.href = "tela_login.html";
} else {
    fetch("http://localhost:3000/perfil", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(async (resposta) => {
        if (!resposta.ok) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("usuario");

            alert("Sua sessão expirou. Faça login novamente.");
            window.location.href = "tela_login.html";
            return;
        }

        const resultado = await resposta.json();
        console.log("Usuário autenticado:", resultado.usuario);
    })
    .catch((erro) => {
        console.error("Erro ao verificar autenticação:", erro);
    });
}
