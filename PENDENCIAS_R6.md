<!-- Feito por Gustavo Manera Marialva - RA 26029581 -->

# Pendências para a Reunião 6

Relatório de testes feito em 16/11/2026 na branch `GustavoManera`, que já tem tudo da `feature` (até o PR #68).
O banco foi recriado do zero com `database/schema.sql` e `database/seed.sql`, o backend rodou com `npm start` e as telas foram abertas no Chrome, servidas como o Live Server faz.

Nenhum arquivo dos colegas foi alterado. Cada item diz o que acontece, como reproduzir, onde está no código, quem é o dono provável e uma sugestão de correção.

**Lembrete:** a Reunião 6 é para testes e ajustes, não para começar funcionalidade nova. O B1 é a única exceção, porque é um requisito obrigatório do escopo que ainda não existe.

## Resumo

| Item | Problema | Dono provável | Gravidade |
|---|---|---|---|
| B1 | API de feriados não existe (cadastro e edição) | Luiggi e Gustavo Pietro | **Alta**: requisito obrigatório |
| B2 | Clique em "Entrar" logo depois de digitar a senha se perde | Pietro | Média |
| B3 | POST /demandas devolve 500 em vez de 400 | Luiggi | Média |
| B4 | PUT aceita prazo no passado e não altera o responsável | Gustavo Pietro | **Alta**: requisito obrigatório |
| B5 | Nome fixo no cabeçalho da listagem e do cadastro | Gustavo Pietro e Luiggi | Média |
| B6 | Cadastro sem versão para celular | Luiggi | Média |
| B7 | Acentos quebram ao rodar os scripts SQL pelo terminal | Pietro | Média |
| B8 | Caminhos absolutos quebram CSS e JS se a pasta mudar de nome | Pietro, Luiggi e Gustavo Pietro | Média |
| B9 | Listagem não lê `?status=` da URL | Gustavo Pietro | Baixa |
| B10 | README desatualizado e sem seção de testes | Quem pegar o card #56 | Média |
| B11 | `main` atrás da `feature` e sem a tag `1.0.0-final` | Pietro | **Alta** na entrega |
| B12 | Membro vê botões que não pode usar | Gustavo Pietro e Luiggi | Baixa |
| B13 | Link "Ver" da listagem não leva o id da demanda | Gustavo Pietro | Média |

---

## B1. API de feriados não existe

**O que acontece:** o escopo exige consultar uma API externa e impedir prazo em feriado nacional, no cadastro **e** na edição. Hoje nenhum arquivo faz isso: uma busca por "feriado" no `backend` e no `frontend` não encontra nada.

**Como reproduzir:** logado como Administrador, envie:
- `POST /demandas` com `"prazo": "2026-12-25"` (Natal): responde **201**, "Demanda cadastrada com sucesso!".
- `POST /demandas` com `"prazo": "2027-01-01"`: responde **201**.
- `PUT /demandas/19` com `"prazo": "2026-12-25"`: responde **200**.

**Onde:**
- `backend/src/routes/cadastro.ts`, rota `router.post("/")` na linha 92. A conferência deve entrar perto da linha 102, onde já é conferido o prazo no passado.
- `backend/src/routes/demandas.ts`, rota `router.put("/:id")` na linha 126. A conferência deve entrar depois da linha 159, onde o formato do prazo é validado.

**Dono:** Luiggi (cadastro) e Gustavo Pietro (edição).

**Sugestão:** criar uma função comum, por exemplo `backend/src/regras/feriados.ts`, que chama `https://brasilapi.com.br/api/feriados/v1/{ano}` e devolve se a data está na lista. As duas rotas respondem **400** com uma mensagem clara, como "O prazo não pode cair em feriado nacional (Natal).". Decidam o que fazer se a BrasilAPI estiver fora do ar: o mais seguro é responder 503 com uma mensagem, em vez de deixar passar.

```ts
// Exemplo simples (Node 18+ já tem fetch)
export async function feriadoNaData(data: string): Promise<string | null> {
  const ano = data.slice(0, 4);
  const resposta = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
  if (!resposta.ok) throw new Error("API de feriados indisponível");
  const feriados: { date: string; name: string }[] = await resposta.json();
  const achado = feriados.find((f) => f.date === data);
  return achado ? achado.name : null; // nome do feriado, ou null se for dia normal
}
```

---

## B2. Clique em "Entrar" logo depois de digitar a senha se perde

**O que acontece:** a lista de requisitos da senha tem 131px de altura e aparece abaixo do campo enquanto ele está selecionado. Quando a pessoa clica em "Entrar", o campo perde o foco e o `blur` esconde a lista. O botão sobe 76px, da posição 633 para 557, antes de o mouse ser solto, e o clique cai fora dele. Nada acontece. O segundo clique funciona, e com Enter também funciona.

**Como reproduzir:** abra `tela_login.html`, digite e-mail e senha e, sem sair do campo de senha, clique uma vez em "Entrar". A tela continua no login. Clique de novo: entra.

**Onde:**
- `frontend/scripts/tela_login.js`, linhas 90 a 97: `focus` mostra e `blur` esconde `#requerimentos`.
- `frontend/styles/tela_login.css`, linha 94: `#requerimentos` com `display: none`, que tira a lista do espaço da página.

**Dono:** Pietro.

**Sugestão (qualquer uma resolve):**
- Esconder a lista só depois do clique: `setTimeout(() => requerimentos.style.display = "none", 200)` no `blur`.
- Ou não mexer no tamanho da página: trocar `display: none` por `visibility: hidden`, que mantém o espaço e o botão não se mexe.
- Ou mostrar a lista só enquanto a senha ainda não cumpre os requisitos.

---

## B3. POST /demandas devolve 500 em vez de 400 para dados inválidos

**O que acontece:** quando o dado está errado, o banco recusa o `INSERT`, e a rota cai no `catch`, que responde 500 ("Erro ao cadastrar a demanda."). Para o usuário parece que o servidor quebrou, quando na verdade foi um dado inválido.

**Como reproduzir** (logado como Administrador, com os outros campos válidos):

| Dado enviado | Resposta atual | Esperado | Erro que aparece no terminal do backend |
|---|---|---|---|
| `id_tipo: 999` | 500 | 400 | `ER_NO_REFERENCED_ROW_2` (fk_demanda_tipo) |
| `id_prioridade: 999` | 500 | 400 | `ER_NO_REFERENCED_ROW_2` (fk_demanda_prioridade) |
| `id_responsavel: 999` | 500 | 400 | `ER_NO_REFERENCED_ROW_2` (fk_demanda_responsavel_usuario) |
| `prazo: "abc"` | 500 | 400 | `ER_TRUNCATED_WRONG_VALUE` (Incorrect date value) |
| `titulo: 12345` (número) | 500 | 400 | `dados.titulo.trim is not a function` |
| `prazo: "2026-02-31"` | 400, mas com a mensagem errada ("O prazo não pode ser uma data que já passou.") | 400 com "Prazo inválido" | (nenhum) |

Para comparar: `id_projeto: 999` já responde 400 certo ("Projeto não encontrado ou inativo."), porque o projeto é conferido antes.

**Atenção:** no caso do `id_responsavel: 999`, a demanda **é gravada** antes do erro, porque o INSERT do responsável vem depois. O usuário recebe 500, mas a demanda fica no banco sem responsável e sem histórico.

**Onde:** `backend/src/routes/cadastro.ts`
- `validarCampos`, linhas 28 a 51: confere só se os campos estão preenchidos, e não o tipo do dado nem se existem no banco.
- `catch`, linhas 145 a 147: transforma tudo em 500.

**Dono:** Luiggi.

**Sugestão:**
1. Em `validarCampos`, conferir `typeof dados.titulo === "string"` antes do `.trim()`.
2. Conferir o prazo no formato `AAAA-MM-DD` e com data real. A função `dataValida` do `demandas.ts`, linhas 117 a 124, já faz isso e pode ser reaproveitada.
3. Antes do INSERT, conferir se `id_tipo`, `id_prioridade` e `id_responsavel` existem, como já é feito para o projeto, e responder 400 se não existirem.
4. Gravar a demanda, o responsável e o histórico numa transação, como o PUT do `demandas.ts` faz nas linhas 253 a 286, para não sobrar demanda pela metade.

---

## B4. PUT /demandas/:id aceita prazo no passado e não altera o responsável

**O que acontece:**
1. `PUT /demandas/19` com `"prazo": "2020-01-01"` responde **200** e grava o prazo no passado. O histórico registra "Alterou Prazo de 25/12/2026 para 01/01/2020". O cadastro (POST) bloqueia prazo no passado, mas a edição não.
2. `PUT /demandas/19` com `"id_responsavel": 5` responde **200**, mas o responsável **não muda** (continua `null`) e não entra nada no histórico. O escopo exige "atribuir ou alterar responsável" e registrar essa alteração no histórico.

**Onde:** `backend/src/routes/demandas.ts`
- Linha 159: só confere o formato do prazo, não se já passou.
- Linhas 240 a 249: a lista `mudancas`, que vai para o histórico, tem status, prioridade e prazo, mas não o responsável.
- Linhas 259 a 269: o `UPDATE` não mexe na tabela `demanda_responsavel`.

**Dono:** Gustavo Pietro.

**Sugestão:**
1. Depois da linha 159, recusar o prazo menor que hoje, como o `cadastro.ts` faz na linha 102.
2. Ler `dados.id_responsavel`. Se for diferente do atual, apagar e inserir em `demanda_responsavel` dentro da mesma transação e acrescentar `["Responsável", nomeAntigo, nomeNovo]` em `mudancas`.
3. Só Administrador e Líder podem trocar o responsável: usar a permissão `atribuir_alterar_responsavel`, que já existe no banco.

---

## B5. Nome fixo no cabeçalho

**O que acontece:** qualquer pessoa que entre vê o nome de um colega no cabeçalho.

| Tela | O que aparece hoje para todos | Onde |
|---|---|---|
| Listagem | "Gustavo Pietro Integrante" | `frontend/pages/ListagemDemandas.html`, linha 94 |
| Cadastro | "Luiggi Fraga Integrante" | `frontend/pages/cadastro.html`, linhas 21 e 22 |

O dashboard e os detalhes já mostram quem fez login.

**Dono:** Gustavo Pietro (listagem) e Luiggi (cadastro).

**Sugestão:** ler o usuário que a tela de login guarda e escrever no cabeçalho:

```js
const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
if (usuario) {
  document.getElementById("nome").innerHTML = "";
  document.getElementById("nome").append(usuario.nome, " ");
  const perfil = document.createElement("small");
  perfil.textContent = usuario.perfil;
  document.getElementById("nome").append(perfil);
}
```

---

## B6. Cadastro sem versão para celular

**O que acontece:** em 390px, a largura do celular, a página de cadastro fica com **562px** e precisa rolar para o lado. As outras telas ficam em 390px.

**Como reproduzir:** no Chrome, F12, modo celular (Ctrl+Shift+M), largura 390, abrir `cadastro.html`.

**Onde:** `frontend/styles/cadastro2.css` (351 linhas, nenhum `@media`). As outras folhas têm `@media`: dashboard (6), detalhes (3), login (3), listagem (1).

**Dono:** Luiggi.

**Sugestão:** acrescentar no fim do arquivo um bloco `@media (max-width: 600px)` que empilha o menu e o formulário, tira larguras fixas (`width: 100%`, `max-width: 100%`) e diminui os espaçamentos. Para achar o elemento que estoura, use F12 e passe o mouse pelos elementos até ver o que passa da borda.

---

## B7. Acentos quebram ao rodar os scripts SQL pelo terminal

**O que acontece:** neste PC, o cliente `mysql` do terminal usa a codificação `cp850` por padrão. Rodando os scripts sem avisar a codificação, os acentos são gravados errados no banco.

**Como reproduzir** (testei numa cópia com outro nome de banco e apaguei depois):
```
mysql -u root -p -e "source database/schema.sql"
mysql -u root -p -e "source database/seed.sql"
```
O perfil "Líder de Projeto" fica gravado como **"L├¡der de Projeto"** e o tipo "Documentação" como **"Documenta├º├úo"**. Com isso, o login e os filtros por perfil e tipo deixam de bater com os nomes que o backend espera.

**Testei a correção:** colocando `SET NAMES utf8mb4;` na primeira linha dos dois arquivos e rodando do mesmo jeito, o nome fica certo, "Líder de Projeto" (hex `4CC3AD...`).

Pelo MySQL Workbench o problema não aparece, porque ele já usa UTF-8.

**Onde:** `database/schema.sql`, linha 1, e `database/seed.sql`, linha 1.

**Dono:** Pietro.

**Sugestão:** acrescentar no topo dos dois arquivos:
```sql
-- Garante que os acentos cheguem certos ao banco, mesmo rodando pelo terminal
SET NAMES utf8mb4;
```

---

## B8. Caminhos absolutos quebram CSS e JS se a pasta tiver outro nome

**O que acontece:** três telas usam caminhos que começam com `/PI-II-TIME-N3-2026/`. Eles só funcionam se o Live Server for aberto na pasta acima do projeto **e** se a pasta tiver exatamente esse nome. Se a banca clonar com outro nome, ou abrir o Live Server na pasta do projeto, essas telas abrem sem CSS e sem JS. O login, por exemplo, deixa de funcionar.

**Como reproduzir:** servi a mesma pasta com outro nome na URL (`/meu-projeto/`):

| Tela | CSS carregado | Arquivos que falharam (404) |
|---|---|---|
| `tela_login.html` | nenhum | 2 |
| `cadastro.html` | nenhum | 2 |
| `ListagemDemandas.html` | nenhum | 2 |
| `dashboard.html` (logado) | sim | 0 |
| `detalhes.html` (logado) | sim | 0 |

**Onde:**
- `frontend/pages/tela_login.html`, linhas 14 e 62.
- `frontend/pages/cadastro.html`, linhas 10, 33, 34, 36, 37 e 116.
- `frontend/pages/ListagemDemandas.html`, linhas 8, 9 e 104 a 107.

**Dono:** Pietro (login), Luiggi (cadastro) e Gustavo Pietro (listagem).

**Sugestão:** trocar pelos caminhos relativos, como o dashboard e os detalhes já fazem:
- `/PI-II-TIME-N3-2026/frontend/styles/X.css` vira `../styles/X.css`
- `/PI-II-TIME-N3-2026/frontend/scripts/X.js` vira `../scripts/X.js`
- `/PI-II-TIME-N3-2026/frontend/pages/X.html` vira `X.html`

Depois disso, o README pode mandar abrir o Live Server direto na pasta do projeto (ver B10).

---

## B9. Listagem não lê `?status=` da URL

**O que acontece:** os cards do dashboard agora levam o status na URL, por exemplo `ListagemDemandas.html?status=Aberta`. A listagem ignora esse parâmetro: abre com 22 linhas e o filtro de status em "todos", igual a sem parâmetro.

**Onde:** `frontend/scripts/ListagemDemandas.js`. O filtro de status é lido na linha 72 e as demandas são carregadas pela função da linha 39, chamada na linha 56. Nenhum trecho lê `location.search`.

**Dono:** Gustavo Pietro.

**Sugestão:** logo depois de carregar as demandas, ler o parâmetro e aplicar o filtro que já existe:

```js
// Abre a listagem já filtrada quando vem do dashboard (ex.: ?status=Aberta)
const statusDaUrl = new URLSearchParams(location.search).get("status");
if (statusDaUrl) {
  filtroStatus.value = statusDaUrl;
  aplicarFiltros();
}
```

---

## B10. README desatualizado e sem seção de testes

**O que acontece:**
- Linha 44: diz que o `schema.sql` cria "as tabelas de perfil e usuário", mas hoje ele cria todas: projetos, demandas, comentários, histórico e permissões.
- Linha 45: diz que o `seed.sql` insere "3 perfis e 3 usuários", mas hoje são 8 usuários, 3 projetos e 18 demandas.
- Não explica como rodar de novo (DROP DATABASE) nem a codificação (B7).
- Não tem seção de testes: o backend agora tem `npm test`.

**Dono:** quem pegar o card #56 ("Atualizar o README.md").

**Trecho pronto para colar** no lugar da seção "### 1. Banco de dados":

````markdown
### 1. Banco de dados
No MySQL Workbench (ou no terminal), execute nesta ordem os scripts da pasta `database/`:

1. `schema.sql` – cria o banco `pi_ii_database` com todas as tabelas: perfis e permissões, usuários, projetos, demandas, responsáveis, comentários e histórico.
2. `seed.sql` – insere os dados de teste: 3 perfis, 8 usuários, 3 projetos e 18 demandas com prazos calculados a partir do dia em que o script roda.

Pelo terminal, informe a codificação para os acentos não quebrarem:
```bash
mysql -u root -p --default-character-set=utf8mb4 -e "source database/schema.sql"
mysql -u root -p --default-character-set=utf8mb4 -e "source database/seed.sql"
```

Para recriar o banco do zero (por exemplo, para atualizar as datas antes de uma apresentação):
```sql
DROP DATABASE pi_ii_database;
```
e rode os dois scripts de novo.
````

**Trecho pronto para colar** depois da seção "### 3. Frontend":

````markdown
### 4. Testes automatizados
Os cálculos do dashboard têm testes com o `node:test`, que já vem no Node:
```bash
cd backend
npm test
```
O comando compila o TypeScript e roda `backend/test/dashboardCalculos.test.js` (17 testes, com casos válidos e inválidos).
````

Se o B8 for corrigido, a seção "### 3. Frontend" pode passar a dizer: "Abra a pasta do repositório no VS Code, clique com o botão direito em `frontend/pages/tela_login.html` e escolha **Open with Live Server**."

---

## B11. Entrega: `main` atrás da `feature` e sem tag

**O que acontece:**
- A `main` está **42 commits atrás** da `feature`. A `main` também tem 3 commits que a `feature` não tem: são ajustes no README.
- Não existe nenhuma tag no repositório, nem local nem no GitHub.

**Dono:** Pietro (card #14, "Criar Tag release").

**Sugestão:**
1. Depois dos ajustes da Reunião 6, abrir um PR da `feature` para a `main` e resolver os conflitos do README.
2. **Só depois dos ajustes finais**, na versão que vai para a banca, criar a tag:
   ```bash
   git checkout main
   git pull
   git tag -a 1.0.0-final -m "Versão final entregue à banca"
   git push origin 1.0.0-final
   ```
   O escopo pede exatamente o nome `1.0.0-final`. Sem a tag, todos perdem 1 ponto.

---

## B12. Membro vê botões que não pode usar

**O que encontrei**, logado como "Membro Teste":

| Tela | Botão | Aparece para o Membro? | O servidor bloqueia? |
|---|---|---|---|
| Listagem | "+ Nova demanda" | **Sim** | Sim: POST responde 403 "Seu perfil não tem permissão..." |
| Listagem | "Editar" (em todas as 22 linhas) | **Sim**, nas 22 | Sim: PUT responde 403 "O Membro da Equipe só altera demandas atribuídas a ele." |
| Cadastro | Formulário inteiro e botão de enviar | **Sim** | Sim: 403 ao enviar |
| Dashboard | "Adicionar demanda" no menu | Não, já escondido | Sim |
| Detalhes | Editar e cancelar | Não, já escondido | Sim |

A segurança está certa, porque o servidor recusa. O problema é de uso: o Membro preenche tudo e só descobre que não pode no final.

**Onde:**
- `frontend/scripts/ListagemDemandas.js`: o botão "Editar" é criado na linha 31, e o "+ Nova demanda" é tratado nas linhas 113 a 115.
- `frontend/scripts/cadastro.js`: não consulta as permissões ao abrir.

**Dono:** Gustavo Pietro (listagem) e Luiggi (cadastro).

**Sugestão:** fazer como o `detalhes.js` e o `dashboard.js`: chamar `GET /perfil`, que devolve `permissoes`, e esconder:
- "+ Nova demanda" sem `criar_demanda`;
- "Editar" sem `editar_demanda`. O Membro pode mudar só o status das demandas dele, então para ele o botão pode abrir só o campo de status;
- no cadastro, sem `criar_demanda`, mostrar a mensagem "Seu perfil não pode cadastrar demandas." e voltar para a listagem.

---

## B13. Link "Ver" da listagem não leva o id da demanda (achado extra)

**O que acontece:** o link "Ver" de cada linha da listagem aponta para `detalhes.html`, sem `?id=`. A tela de detalhes não sabe qual demanda mostrar.

**Onde:** `frontend/scripts/ListagemDemandas.js`, linha 31: `<a href="detalhes.html">Ver</a>`.

**Dono:** Gustavo Pietro.

**Sugestão:** usar o id que a linha já tem, como o botão "Editar" faz com `data-id`:
```js
<a href="detalhes.html?id=${d.id}">Ver</a>
```
