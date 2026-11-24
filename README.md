# ENG.S-PI-II-TIME-N3

**Professor Orientador**: FERNANDO LUIZ DE ALMEIDA SILVEIRA

---

**Grupo N3**

---

Projeto desenvolvido para a disciplina **Projeto Integrador II– Engenharia de Software**  da PUC Campinas

---

## 👥 Integrantes

| Nome | RA |
|------|----|
| (Pietro Giati de Favari) | (26028869) |
| (Rafael Carvalho Soares) | (26029352) |
| (Gustavo Manera Marialva) | (26029581) |
| (Gustavo Pietro de Assis Silva) | (26029128) |
| (Luiggi Fraga Ferreira) | (26026323) |
---

## 📄 Documentação

- [📥 Escopo e Requisitos do Projeto]:
[Documento Escopo_PI_II_revisado.pdf](https://github.com/user-attachments/files/31669478/Documento.Escopo_PI_II_revisado.pdf)


---

## ⚙️ Como executar o projeto

### Pré-requisitos
- Node.js (versão LTS vigente) e npm
- Docker Desktop (o banco MySQL roda num container; não é preciso instalar o MySQL no computador)
- VS Code com a extensão Live Server

### 1. Instalar o Docker (só na primeira vez)
1. Baixe e instale o **Docker Desktop** em https://www.docker.com/products/docker-desktop/
2. No Windows, aceite a opção **Use WSL 2** durante a instalação. Se o instalador pedir, reinicie o computador.
3. Abra o Docker Desktop e espere aparecer **Engine running** no canto inferior esquerdo.
4. Confira no terminal:
   ```bash
   docker --version
   docker compose version
   ```

> O Docker Desktop precisa estar **aberto** sempre que você for rodar o projeto.

### 1.2 Caso queira usar mysql
1. Baixe MySql workbench na web
2. crie sua senha e entre no localinstance usando ela.
3. copie o schema.sql e cole no mysql e execute
4. copie o seed.sql e cole no mysql e execute
5. No arquivo .env em DB_PASSWORD coloque sua senha do mysql
6. Caso esteja dando erro de porta mude o DB_PORT para 3306
> O mysql precisa estar aberto sempre que for rodar o projeto

### 2. Banco de dados (Docker)
```bash
cd pi-db
docker compose up -d
```
Esse comando sobe um MySQL 8.0 (container `pi_ii_mysql`) com:

| Configuração | Valor |
|--------------|-------|
| Host | `localhost` |
| Porta | **`3307`** (e não 3306, para não conflitar com um MySQL já instalado no PC) |
| Usuário / senha | `root` / `root` |
| Banco | `pi_ii_database` |

Na **primeira** subida, o arquivo `pi-db/db/init/01_dump.sql` é executado automaticamente e cria todas as tabelas com os dados de exemplo e os usuários de teste. Não é preciso rodar os scripts da pasta `database/` no Workbench.

Comandos úteis (rodar dentro de `pi-db/`):

| Comando | O que faz |
|---------|-----------|
| `docker compose up -d` | Liga o banco |
| `docker compose stop` | Desliga o banco (os dados continuam salvos) |
| `docker compose ps` | Mostra se o container está rodando |
| `docker compose logs db` | Mostra o log do MySQL (útil se algo der errado) |
| `docker compose down -v` | **Apaga o banco inteiro.** Na próxima vez que você rodar `up -d`, o dump é importado de novo |

> ⚠️ O dump só é importado quando o banco ainda está vazio. Se alguém atualizar o `01_dump.sql`, cada integrante precisa rodar `docker compose down -v` e depois `docker compose up -d` para receber as mudanças. Isso apaga os dados que você tiver criado localmente.

Para abrir o banco no MySQL Workbench, crie uma conexão com host `127.0.0.1`, porta `3307`, usuário `root` e senha `root`.

### 3. Backend
```bash
cd backend
npm install
```
Copie o arquivo `.env.example` para `.env` (na pasta `backend`). Ele já vem configurado para o banco do Docker:
```
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=pi_ii_database
JWT_SECRET=troque_por_uma_frase_longa_e_secreta
```
Troque apenas o `JWT_SECRET` por uma frase longa qualquer.

> **Já tinha um `.env` de antes do Docker?** Ele ainda aponta para o MySQL instalado no seu PC (`DB_PORT=3306` e a sua senha). Altere `DB_PORT` para `3307` e `DB_PASSWORD` para `root`. Se você não fizer isso e o MySQL local estiver ligado, o backend vai funcionar normalmente, mas usando o banco **antigo**, e não o do Docker.

O `.env` não vai para o GitHub (está no `.gitignore`), então cada integrante precisa fazer essa alteração no próprio computador.

Com o banco ligado (passo 2), rode:
```bash
npm start
```
O servidor sobe em `http://localhost:3000`. Para testar:
- `GET http://localhost:3000/` → "Backend funcionando!"
- `GET http://localhost:3000/teste-banco` → confirma a conexão com o MySQL

### 4. Frontend
Abra no VS Code a pasta **que contém** o repositório (os caminhos dos arquivos começam com `/PI-II-TIME-N3-2026/`). Clique com o botão direito em `frontend/pages/tela_login.html` e escolha **Open with Live Server**.

### Compartilhando dados do banco com o time (dump)
Cada integrante roda o **próprio** banco no Docker. Uma demanda criada no seu computador **não aparece** para os colegas automaticamente. Para compartilhar dados, usamos o **dump**: o arquivo `pi-db/db/init/01_dump.sql`, que é uma cópia completa do banco (estrutura e dados) em formato SQL.

> ⚠️ O dump **substitui** o banco inteiro, ele não soma alterações. Quem importa um dump novo fica com o banco idêntico ao de quem o gerou e **perde** o que tinha criado localmente e não estava no dump.

#### Regras do grupo
1. **Um dump de cada vez.** Se duas pessoas gerarem o dump ao mesmo tempo, dá conflito no git e os dados de uma delas se perdem.
2. **Antes de criar dados para compartilhar**, dê `git pull` e importe o dump mais recente (veja abaixo).
3. **Gerou um dump novo?** Faça o commit logo e avise o grupo.
4. **Mudou a estrutura** (tabela ou coluna nova)? Atualize também o `database/schema.sql`, que é a documentação oficial do MER.
5. Dados que são só para testes seus não precisam entrar no dump.

#### Exportar (gerar um dump novo a partir do seu banco)
Com o container ligado, dentro de `pi-db/`:
```bash
docker exec pi_ii_mysql sh -c "mysqldump -uroot -proot pi_ii_database > /tmp/dump.sql"
docker cp pi_ii_mysql:/tmp/dump.sql db/init/01_dump.sql
```
Depois faça o commit do `pi-db/db/init/01_dump.sql` e avise o grupo.

> Use exatamente esses dois comandos. Não use `mysqldump ... > arquivo.sql` direto no PowerShell: ele grava o arquivo em UTF-16, e o MySQL não consegue importar nesse formato.

#### Importar (receber o dump que um colega atualizou)
Dentro de `pi-db/`:
```bash
git pull
docker compose down -v
docker compose up -d
```
Espere uns 30 segundos para o MySQL terminar a importação e reinicie o backend (`npm start`).

### Problemas comuns
- **`error during connect` / `Cannot connect to the Docker daemon`**: o Docker Desktop não está aberto. Abra o programa e espere aparecer *Engine running*.
- **`port is already allocated` na porta 3307**: outro programa está usando essa porta. Altere `"3307:3306"` no `docker-compose.yml` para outra porta (ex.: `"3308:3306"`) e use o mesmo número no `DB_PORT` do `.env`.
- **`/teste-banco` falha ou `ECONNREFUSED`**: confira se o container está rodando (`docker compose ps`) e se o `.env` está com `DB_PORT=3307`.
- **Login com usuário de teste não funciona**: provavelmente o backend está ligado no banco antigo. Revise o `.env` e reinicie o `npm start`.

### Usuários de teste

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@puccampinas.edu.br | Admin@123 |
| Líder de Projeto | lider@puccampinas.edu.br | Lider@123 |
| Membro da Equipe | membro@puccampinas.edu.br | Membro@123 |

### Login e perfis (resumo)
- `POST /login` valida e-mail e senha no servidor, confere o hash com bcrypt e devolve um token JWT (válido por 2 horas) com o id e o perfil do usuário.
- As rotas protegidas usam o middleware `autenticar` (confere o token) e `autorizarPerfil` (libera só os perfis informados).
- Após 10 tentativas de login falhas em 15 minutos, o acesso é bloqueado temporariamente.
## 📋 Sobre o projeto

O sistema tem como finalidade simular uma plataforma de gerenciamento utilizada por equipes de tecnologia para organizar e monitorar solicitações de desenvolvimento, como tarefas, correções de erros (bugs), aprimoramentos e atividades relacionadas à documentação, durante o ciclo de vida de um ou mais projetos de software.
Cada solicitação registrada no sistema contém informações como título, descrição, categoria, nível de prioridade, situação atual, projeto relacionado, responsável, datas de cadastro e última atualização, além do prazo previsto para conclusão. Essas solicitações podem ser registradas, consultadas, filtradas, modificadas e canceladas, seguindo um fluxo de trabalho (workflow) que abrange desde a criação até a finalização ou o cancelamento.

---

Requisitos para rodar o sistema:
Rodar npm install na pasta backend 
