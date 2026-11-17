<!-- Feito por Gustavo Manera Marialva - RA 26029581 -->

# Roteiro do Dashboard - Reunião 6

Gustavo Manera Marialva - RA 26029581. Leia antes da reunião: são cerca de 3 minutos de demonstração.

## Antes de começar (5 minutos antes)
1. MySQL ligado (o serviço `MySQL80` liga junto com o Windows).
2. Na pasta `backend`: `npm start`. Para confirmar, abra `http://localhost:3000/teste-banco` e veja "Conexão com MySQL funcionando!".
3. Live Server aberto na pasta **que contém** o repositório, como manda o README. Abra `frontend/pages/tela_login.html`.
4. Se algum programa estiver usando a porta 3000 (por exemplo, outro projeto), feche-o antes.

## Demonstração

1. **Login.** Entre como `admin@puccampinas.edu.br` / `Admin@123` e clique em "Entrar" (ou aperte Enter). O sistema abre o dashboard.
2. **Cabeçalho.** Mostre que aparece "Administrador Teste / Administrador": o nome vem do login, não está fixo no HTML.
3. **Indicadores.** Mostre os cards (total e cada status), os gráficos por prioridade e por tipo, as críticas em aberto e as próximas do prazo. Linhas atrasadas ficam em vermelho e a que vence hoje fica em laranja.
4. **Filtro por projeto.** Escolha "App Biblioteca": a mensagem muda para "Mostrando 5 de 18 demandas" e tudo é recalculado pelo servidor.
5. **Filtro por período.** Escolha um intervalo de datas de criação, por exemplo a última semana, e mostre que os números mudam.
6. **Card leva à listagem.** Clique no card "Abertas": ele abre `ListagemDemandas.html?status=Aberta`. Diga que o filtro chega pela URL, e que a listagem ainda precisa ler esse parâmetro (pendência B9 do Gustavo Pietro).
7. **Permissão por perfil.** Saia e entre como `membro@puccampinas.edu.br` / `Membro@123`. O menu "Adicionar demanda" some, porque o perfil Membro não tem a permissão `criar_demanda`.

## Casos para mostrar

| Caso | Como fazer | Resultado esperado |
|---|---|---|
| **Válido** | Logado, escolha o projeto "App Biblioteca" | Mensagem azul "Mostrando 5 de 18 demandas." e números recalculados |
| **Inválido: período invertido** | Coloque "Criadas a partir de" **depois** de "Criadas até" | Na tela: mensagem vermelha "Período inválido: a data inicial não pode ser depois da data final.", os dois campos ficam em vermelho e os números somem. A tela nem chama o servidor. |
| **Inválido: período invertido direto no servidor** | No F12 → Console, cole o comando abaixo | No console: `400 {erro: "Período inválido: ...", campos: [...]}`. Prova que o servidor valida sozinho, mesmo sem passar pela tela. |
| **Inválido: acesso sem token** | Clique em "Sair" e depois digite `dashboard.html` na barra de endereço | Volta direto para a tela de login. Se o token vencer (dura 2 horas), aparece "Sua sessão expirou" e também volta para o login. |

Comando do console (com o dashboard aberto e logado):
```js
fetch('http://localhost:3000/dashboard?dataInicio=2026-11-20&dataFim=2026-11-01', { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('token') } }).then(r => r.json().then(j => console.log(r.status, j)))
```
Sem o token, a mesma chamada responde `401`:
```js
fetch('http://localhost:3000/dashboard').then(r => console.log(r.status))
```

Se perguntarem sobre testes automatizados: na pasta `backend`, `npm test` roda 17 testes dos cálculos e todos passam.

## O que cada arquivo meu faz

| Arquivo | Em uma frase | O que explicar se perguntarem |
|---|---|---|
| `backend/src/routes/dashboardRotas.ts` | A **porta de entrada**: a rota `GET /dashboard`. | Exige login (middleware `autenticar`), lê os filtros da URL, valida, e responde 400 (filtro errado), 401 (sem login), 500 (banco falhou) ou 200 com os números em JSON. |
| `backend/src/repositories/dashboardRepositorio.ts` | Onde fica **todo o SQL** do dashboard. | Usa as tabelas do Pietro com JOINs (tipo, prioridade e status ficam em tabelas próprias). Administrador vê tudo; os outros perfis só os projetos em que participam (`projeto_usuario`). Os valores entram pelos `?`, o que impede SQL Injection. |
| `backend/src/services/dashboardCalculos.ts` | As **regras e as contas**, em funções puras. | Conta por status, prioridade e tipo, monta "críticas em aberto" (Crítica e não concluída/cancelada) e "próximas do prazo" (até 7 dias ou atrasadas). Não acessa o banco, por isso dá para testar sozinho. Valor desconhecido (ex.: acento quebrado) é ignorado e avisado no terminal. |
| `backend/test/dashboardCalculos.test.js` | Os **testes automáticos** dos cálculos. | Usa o `node:test`, que vem com o Node. 17 testes: data 31/02, período invertido, atrasada, vence hoje, concluída fora de "em aberto"... |
| `frontend/scripts/dashboard.js` | O **JavaScript da tela**. | Confere o login, valida o período, chama a API com `fetch` e o token, monta cards, barras e tabelas pelo DOM (`createElement` e `textContent`) e mostra as mensagens de erro. Chama `GET /perfil` para esconder "Adicionar demanda" de quem não pode. |
| `frontend/pages/dashboard.html` | A **estrutura** da tela. | Tem os espaços vazios (`id` e `data-contador`) que o JS preenche. Os caminhos são relativos (`../styles`, `../scripts`). |
| `frontend/styles/dashboard.css` | O **visual**. | Cores por status e prioridade, cards, barras e a versão para celular (`@media`): em 390px nada passa da borda. |

**O caminho de um clique no filtro:** tela (`dashboard.js`) → `GET /dashboard?projeto=2` → rota valida → repositório busca no MySQL → cálculos contam → rota devolve JSON → tela desenha.

## O que mudou desde a Reunião 5
- **Ligado no sistema do grupo:** o PR #63 (dashboard ligado ao banco e ao login) entrou na `feature` em 16/11.
- **Cards levam o filtro:** cada card de status abre a listagem com `?status=` na URL. O card Total abre sem filtro.
- **Menu por perfil:** "Adicionar demanda" só aparece para quem tem a permissão `criar_demanda` (Administrador e Líder).
- **Contagem mais segura:** valores fora da lista do escopo não quebram mais o JSON. São ignorados e avisados no terminal do servidor.
- **Testes automáticos:** 17 testes com `npm test`, sem instalar nenhuma biblioteca.
- **Conferido em 390px** com os 3 perfis: nenhum erro no console e nada passando da borda.
- **Relatório para o grupo** (`PENDENCIAS_R6.md`) com 13 itens testados em outras telas: feriados, erros 500, responsável na edição, caminhos, README e tag final.
