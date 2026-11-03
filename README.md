# ENG.S-PI2-TIME-N3

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
- MySQL instalado e rodando
- VS Code com a extensão Live Server

### 1. Banco de dados
No MySQL Workbench, execute nesta ordem os scripts da pasta `database/`:

1. `schema.sql` – cria o banco `pi_ii_database` e as tabelas de perfil e usuário
2. `seed.sql` – insere os 3 perfis e 3 usuários de teste (executar uma única vez)

### 2. Backend
```bash
cd backend
npm install
```
Copie o arquivo `.env.example` para `.env` (na pasta `backend`) e preencha com a senha do seu MySQL e um `JWT_SECRET`. Depois:
```bash
npm start
```
O servidor sobe em `http://localhost:3000`. Para testar:
- `GET http://localhost:3000/` → "Backend funcionando!"
- `GET http://localhost:3000/teste-banco` → confirma a conexão com o MySQL

### 3. Frontend
Abra no VS Code a pasta **que contém** o repositório (os caminhos dos arquivos começam com `/PI-II-TIME-N3-2026/`). Clique com o botão direito em `frontend/pages/tela_login.html` e escolha **Open with Live Server**.

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