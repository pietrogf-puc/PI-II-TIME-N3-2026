-- Feito por Gustavo Manera Marialva - RA 26029581
-- Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas
--
-- 02_dados_iniciais.sql: dados de demonstração do dashboard.
-- Rode depois do 01_criar_tabelas.sql, na pasta do projeto:
--   mysql -u root -p --default-character-set=utf8mb4 -e "source database/02_dados_iniciais.sql"
-- Ou abra este arquivo no MySQL Workbench e execute.
--
-- Os prazos são calculados a partir do dia em que o script roda (CURDATE()).
-- Rode de novo perto da apresentação para os prazos ficarem atualizados.
-- Estes dados entram direto no banco, então não passam pela futura validação
-- de feriado nacional, que vai valer no cadastro e na edição pela API.

-- Garante que os acentos dos dados abaixo cheguem certos ao banco
SET NAMES utf8mb4;

USE sistema_demandas;

-- Recria os dados do zero para o script poder ser rodado mais de uma vez.
-- DELETE é usado só aqui, em dados de teste: o sistema nunca apaga demandas.
-- O MySQL Workbench bloqueia DELETE sem WHERE, então a trava é desligada aqui.
SET SQL_SAFE_UPDATES = 0;
DELETE FROM demandas;
DELETE FROM usuarios;
DELETE FROM projetos;

-- O "Site do Evento" fica sem demandas para demonstrar o filtro sem resultado.
INSERT INTO projetos (id, nome) VALUES
  (1, 'Sistema de Demandas'),
  (2, 'Portal do Aluno'),
  (3, 'App Biblioteca'),
  (4, 'Site do Evento');

-- Os e-mails usam o domínio reservado example.com, que não existe de verdade.
INSERT INTO usuarios (id, nome, email, perfil) VALUES
  (1, 'Gustavo Manera', 'gustavo.manera@example.com', 'Líder de Projeto'),
  (2, 'Pietro Giati', 'pietro.giati@example.com', 'Administrador'),
  (3, 'Rafael Soares', 'rafael.soares@example.com', 'Membro da Equipe'),
  (4, 'Gustavo Pietro', 'gustavo.pietro@example.com', 'Membro da Equipe'),
  (5, 'Luiggi Fraga', 'luiggi.fraga@example.com', 'Membro da Equipe');

-- As duas últimas demandas cobrem os campos opcionais: uma não tem responsável
-- e a outra ainda não tem prazo.
INSERT INTO demandas (id, titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, data_criacao, prazo) VALUES
  (1,  'Erro ao salvar demanda sem prazo',      'A tela trava ao salvar sem preencher o prazo.',        'Defeito',      'Crítica', 'Em andamento', 1, 3, CURDATE() - INTERVAL 20 DAY, CURDATE() - INTERVAL 2 DAY),
  (2,  'Login não valida senha em branco',      'O login aceita o envio com a senha vazia.',            'Defeito',      'Crítica', 'Aberta',       1, 2, CURDATE() - INTERVAL 10 DAY, CURDATE() + INTERVAL 1 DAY),
  (3,  'Filtro de status retorna lista vazia',  'O filtro não encontra as demandas Em revisão.',        'Defeito',      'Crítica', 'Em revisão',   1, 4, CURDATE() - INTERVAL 8 DAY,  CURDATE() + INTERVAL 5 DAY),
  (4,  'Corrigir cálculo de multa por atraso',  'A multa é calculada com um dia a mais.',               'Defeito',      'Crítica', 'Concluída',    3, 5, CURDATE() - INTERVAL 40 DAY, CURDATE() - INTERVAL 5 DAY),
  (5,  'Criar tela de cadastro de demandas',    'Formulário com as validações do escopo.',              'Tarefa',       'Alta',    'Em andamento', 1, 5, CURDATE() - INTERVAL 25 DAY, CURDATE() + INTERVAL 3 DAY),
  (6,  'Documentar rotas do backend',           'Descrever os métodos e as respostas de cada rota.',    'Documentação', 'Média',   'Aberta',       1, 2, CURDATE() - INTERVAL 6 DAY,  CURDATE()),
  (7,  'Ajustar layout da listagem no celular', 'A tabela passa da largura da tela.',                   'Melhoria',     'Alta',    'Aberta',       1, 4, CURDATE() - INTERVAL 5 DAY,  CURDATE() + INTERVAL 6 DAY),
  (8,  'Criar rota GET /dashboard',             'Devolver os indicadores calculados pelo servidor.',    'Tarefa',       'Alta',    'Aberta',       1, 1, CURDATE() - INTERVAL 3 DAY,  CURDATE() + INTERVAL 10 DAY),
  (9,  'Exportar relatório de demandas em PDF', 'Gerar um PDF com as demandas filtradas.',              'Melhoria',     'Baixa',   'Cancelada',    1, 1, CURDATE() - INTERVAL 30 DAY, CURDATE() + INTERVAL 2 DAY),
  (10, 'Notas não aparecem no boletim',         'O boletim fica vazio para alguns alunos.',             'Defeito',      'Alta',    'Em andamento', 2, 3, CURDATE() - INTERVAL 12 DAY, CURDATE() + INTERVAL 4 DAY),
  (11, 'Tela de matrícula online',              'Permitir a matrícula sem ir à secretaria.',            'Tarefa',       'Média',   'Em revisão',   2, 4, CURDATE() - INTERVAL 35 DAY, CURDATE() + INTERVAL 12 DAY),
  (12, 'Manual do usuário do portal',           'Guia com as principais funções do portal.',            'Documentação', 'Baixa',   'Aberta',       2, 5, CURDATE() - INTERVAL 15 DAY, CURDATE() + INTERVAL 25 DAY),
  (13, 'Melhorar busca do acervo',              'Buscar também pelo nome do autor.',                    'Melhoria',     'Média',   'Em andamento', 3, 2, CURDATE() - INTERVAL 18 DAY, CURDATE() + INTERVAL 7 DAY),
  (14, 'Cadastro de empréstimos',               'Registrar a retirada e a devolução dos livros.',       'Tarefa',       'Alta',    'Concluída',    3, 1, CURDATE() - INTERVAL 60 DAY, CURDATE() - INTERVAL 20 DAY),
  (15, 'Leitor de código de barras',            'Ler o código do livro pela câmera.',                   'Tarefa',       'Média',   'Em andamento', 3, 3, CURDATE() - INTERVAL 9 DAY,  CURDATE() - INTERVAL 1 DAY),
  (16, 'Diagrama do banco de dados',            'Desenhar as tabelas e os relacionamentos.',            'Documentação', 'Média',   'Concluída',    3, 5, CURDATE() - INTERVAL 50 DAY, CURDATE() - INTERVAL 30 DAY),
  (17, 'Notificar prazo por e-mail',            'Avisar o responsável antes do prazo.',                 'Melhoria',     'Baixa',   'Em revisão',   2, 2, CURDATE() - INTERVAL 4 DAY,  CURDATE() + INTERVAL 20 DAY),
  (18, 'Migrar servidor de testes',             'Trocar o servidor usado nos testes.',                  'Tarefa',       'Baixa',   'Cancelada',    2, 4, CURDATE() - INTERVAL 45 DAY, CURDATE() - INTERVAL 10 DAY),
  (19, 'Revisar textos da tela de login',       'Padronizar as mensagens da tela de login.',            'Tarefa',       'Crítica', 'Aberta',       1, NULL, CURDATE() - INTERVAL 2 DAY, CURDATE() + INTERVAL 2 DAY),
  (20, 'Definir regras de senha',               'Combinar o tamanho mínimo e os caracteres aceitos.',   'Tarefa',       'Crítica', 'Aberta',       2, 1, CURDATE() - INTERVAL 1 DAY, NULL);
