-- =========================================
-- DADOS INICIAIS DO SISTEMA
-- (perfis, permissões, usuários de teste, projetos, demandas, etc.)
-- Perfis e usuários de teste feitos por Pietro Giati de Favari (Ra: 26028869)
-- Executar DEPOIS do schema.sql (rodar uma única vez)
-- Para rodar de novo: DROP DATABASE pi_ii_database; e execute schema.sql + seed.sql
-- =========================================
 
USE pi_ii_database;
 
-- =========================================
-- PERFIS
-- =========================================
INSERT INTO perfil (id, nome) VALUES
(1, 'Administrador'),
(2, 'Líder de Projeto'),
(3, 'Membro da Equipe');
 
-- =========================================
-- PERMISSÕES (uma linha para cada permissão do MER)
-- =========================================
INSERT INTO permissao (id_permissao, codigo, descricao) VALUES
(1,  'visualizar_projetos',       'Visualizar projetos'),
(2,  'visualizar_comentarios',    'Visualizar comentários das demandas'),
(3,  'visualizar_historico',      'Visualizar histórico de alterações'),
(4,  'alterar_status',            'Alterar o status de uma demanda'),
(5,  'alterar_prioridade',        'Alterar a prioridade de uma demanda'),
(6,  'atribuir_alterar_responsavel', 'Atribuir ou alterar o responsável de uma demanda'),
(7,  'editar_demanda',            'Editar os dados de uma demanda'),
(8,  'criar_demanda',             'Criar uma nova demanda'),
(9,  'visualizar_usuarios',       'Visualizar usuários'),
(10, 'visualizar_demandas',       'Visualizar demandas'),
(11, 'registrar_comentarios',     'Registrar comentários nas demandas');
 
-- =========================================
-- PERFIL x PERMISSÃO (relacionamento "Concede")
-- Administrador: todas as permissões
-- Líder de Projeto: todas, menos visualizar_usuarios
-- Membro da Equipe: consulta, comentários e alterar status
--   (as transições permitidas ao membro são validadas em backend/src/regras/status.ts)
-- =========================================
INSERT INTO perfil_permissao (id_perfil, id_permissao)
SELECT 1, id_permissao FROM permissao;
 
INSERT INTO perfil_permissao (id_perfil, id_permissao)
SELECT 2, id_permissao FROM permissao WHERE codigo <> 'visualizar_usuarios';
 
INSERT INTO perfil_permissao (id_perfil, id_permissao)
SELECT 3, id_permissao FROM permissao
WHERE codigo IN (
    'visualizar_projetos',
    'visualizar_demandas',
    'visualizar_comentarios',
    'visualizar_historico',
    'registrar_comentarios',
    'alterar_status'
);
 
-- =========================================
-- USUÁRIOS DE TESTE (senhas guardadas com hash bcrypt)
--   admin@puccampinas.edu.br   -> senha: Admin@123
--   lider@puccampinas.edu.br   -> senha: Lider@123
--   membro@puccampinas.edu.br  -> senha: Membro@123
-- Os demais usuários (integrantes do grupo) usam a senha Membro@123
-- =========================================
INSERT INTO usuario (id_usuario, nome, email, senha_hash, ativo, id_perfil) VALUES
(1, 'Administrador Teste', 'admin@puccampinas.edu.br',  '$2b$10$EdR3h3fcUAei2xyDb453iOG5D0ALvJs9iqjMC0W9H9jgQXsRUNzRC', TRUE, 1),
(2, 'Líder Teste',         'lider@puccampinas.edu.br',  '$2b$10$PrN3iz2l.YoT/YZsjiUDW.wQAtMsFlH48nlH2JVYEMgLJJLtfL.zC', TRUE, 2),
(3, 'Membro Teste',        'membro@puccampinas.edu.br', '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE, 3),
(4, 'Pietro Giati',        'pietro.giati@puccampinas.edu.br',   '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE, 3),
(5, 'Rafael Soares',       'rafael.soares@puccampinas.edu.br',  '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE, 3),
(6, 'Gustavo Manera',      'gustavo.manera@puccampinas.edu.br', '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE, 3),
(7, 'Gustavo Pietro',      'gustavo.pietro@puccampinas.edu.br', '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE, 3),
(8, 'Luiggi Fraga',        'luiggi.fraga@puccampinas.edu.br',   '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE, 3);
 
-- =========================================
-- PROJETOS
-- =========================================
INSERT INTO projeto (id_projeto, nome_projeto, descricao, ativo_projeto) VALUES
(1, 'Sistema de Demandas', 'Sistema de acompanhamento de demandas do Projeto Integrador II.', TRUE),
(2, 'App Biblioteca',      'Aplicativo para controle de acervo e empréstimos da biblioteca.', TRUE),
(3, 'Portal do Aluno',     'Portal web com notas, matrícula e documentos do aluno.', TRUE);
 
-- =========================================
-- PARTICIPAÇÃO EM PROJETOS (relacionamento "Participa")
-- Todos os usuários de teste participam dos 3 projetos
-- =========================================
INSERT INTO projeto_usuario (id_projeto, id_usuario)
SELECT p.id_projeto, u.id_usuario
FROM projeto p
CROSS JOIN usuario u;
 
-- =========================================
-- TIPOS, PRIORIDADES E STATUS
-- (os nomes têm que ser iguais aos usados no backend e no frontend)
-- =========================================
INSERT INTO tipo_demanda (id_tipo, nome) VALUES
(1, 'Tarefa'),
(2, 'Defeito'),
(3, 'Melhoria'),
(4, 'Documentação');
 
INSERT INTO prioridade (id_prioridade, nome, ordem) VALUES
(1, 'Crítica', 1),
(2, 'Alta',    2),
(3, 'Média',   3),
(4, 'Baixa',   4);
 
INSERT INTO status_demanda (id_status, nome_status) VALUES
(1, 'Aberta'),
(2, 'Em andamento'),
(3, 'Em revisão'),
(4, 'Concluída'),
(5, 'Cancelada');
 
-- =========================================
-- DEMANDAS DE EXEMPLO
-- Datas relativas a hoje (CURDATE / NOW)
-- ids: tipo (1 Tarefa, 2 Defeito, 3 Melhoria, 4 Documentação)
--      prioridade (1 Crítica, 2 Alta, 3 Média, 4 Baixa)
--      status (1 Aberta, 2 Em andamento, 3 Em revisão, 4 Concluída, 5 Cancelada)
--      projeto (1 Sistema de Demandas, 2 App Biblioteca, 3 Portal do Aluno)
-- =========================================
INSERT INTO demanda
    (id_demanda, titulo, descricao, data_criacao, data_atualizacao, prazo_finalizacao,
     id_projeto, id_tipo, id_prioridade, id_status)
VALUES
(1,  'Erro ao salvar demanda sem prazo',
     'Ao salvar uma demanda sem preencher o prazo o sistema retorna erro em vez de avisar o usuário.',
     DATE_ADD(NOW(), INTERVAL -20 DAY), DATE_ADD(NOW(), INTERVAL -3 DAY), DATE_ADD(CURDATE(), INTERVAL -2 DAY),
     1, 2, 1, 2),
(2,  'Login não valida senha em branco',
     'A tela de login deve bloquear o envio quando a senha estiver em branco.',
     DATE_ADD(NOW(), INTERVAL -10 DAY), DATE_ADD(NOW(), INTERVAL -10 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY),
     1, 2, 1, 1),
(3,  'Filtro de status retorna lista vazia',
     'Ao filtrar a listagem por status a lista volta vazia mesmo existindo demandas com aquele status.',
     DATE_ADD(NOW(), INTERVAL -8 DAY), DATE_ADD(NOW(), INTERVAL -1 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY),
     1, 2, 1, 3),
(4,  'Corrigir cálculo de multa por atraso',
     'O valor da multa por atraso na devolução está sendo calculado com o número de dias errado.',
     DATE_ADD(NOW(), INTERVAL -40 DAY), DATE_ADD(NOW(), INTERVAL -6 DAY), DATE_ADD(CURDATE(), INTERVAL -5 DAY),
     2, 2, 1, 4),
(5,  'Criar tela de cadastro de demandas',
     'Criar a tela de cadastro de demandas conforme o wireframe, com validação dos campos.',
     DATE_ADD(NOW(), INTERVAL -25 DAY), DATE_ADD(NOW(), INTERVAL -2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY),
     1, 1, 2, 2),
(6,  'Documentar rotas do backend',
     'Documentar todas as rotas da API (método, parâmetros e exemplos de resposta).',
     DATE_ADD(NOW(), INTERVAL -6 DAY), DATE_ADD(NOW(), INTERVAL -6 DAY), CURDATE(),
     1, 4, 3, 1),
(7,  'Ajustar layout da listagem no celular',
     'A tabela da listagem de demandas estoura a largura em telas pequenas.',
     DATE_ADD(NOW(), INTERVAL -5 DAY), DATE_ADD(NOW(), INTERVAL -5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY),
     1, 3, 2, 1),
(8,  'Criar rota GET /dashboard',
     'Criar a rota que devolve os números do dashboard (totais por status, prioridade e atrasadas).',
     DATE_ADD(NOW(), INTERVAL -3 DAY), DATE_ADD(NOW(), INTERVAL -3 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY),
     1, 1, 2, 1),
(9,  'Exportar relatório de demandas em PDF',
     'Permitir exportar a listagem de demandas em PDF. Cancelada por estar fora do escopo.',
     DATE_ADD(NOW(), INTERVAL -30 DAY), DATE_ADD(NOW(), INTERVAL -12 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY),
     1, 3, 4, 5),
(10, 'Notas não aparecem no boletim',
     'Algumas notas lançadas pelo professor não aparecem no boletim do aluno.',
     DATE_ADD(NOW(), INTERVAL -12 DAY), DATE_ADD(NOW(), INTERVAL -4 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY),
     3, 2, 2, 2),
(11, 'Tela de matrícula online',
     'Criar a tela de matrícula online com escolha de disciplinas.',
     DATE_ADD(NOW(), INTERVAL -35 DAY), DATE_ADD(NOW(), INTERVAL -2 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY),
     3, 1, 3, 3),
(12, 'Manual do usuário do portal',
     'Escrever o manual do usuário do Portal do Aluno.',
     DATE_ADD(NOW(), INTERVAL -15 DAY), DATE_ADD(NOW(), INTERVAL -15 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY),
     3, 4, 4, 1),
(13, 'Melhorar busca do acervo',
     'Melhorar a busca de livros do acervo (título, autor e ISBN).',
     DATE_ADD(NOW(), INTERVAL -18 DAY), DATE_ADD(NOW(), INTERVAL -5 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY),
     2, 3, 3, 2),
(14, 'Cadastro de empréstimos',
     'Cadastro de empréstimos de livros com data de devolução.',
     DATE_ADD(NOW(), INTERVAL -60 DAY), DATE_ADD(NOW(), INTERVAL -21 DAY), DATE_ADD(CURDATE(), INTERVAL -20 DAY),
     2, 1, 2, 4),
(15, 'Leitor de código de barras',
     'Integrar leitor de código de barras para dar baixa nos livros.',
     DATE_ADD(NOW(), INTERVAL -9 DAY), DATE_ADD(NOW(), INTERVAL -2 DAY), DATE_ADD(CURDATE(), INTERVAL -1 DAY),
     2, 1, 3, 2),
(16, 'Diagrama do banco de dados',
     'Montar o diagrama do banco de dados do App Biblioteca.',
     DATE_ADD(NOW(), INTERVAL -50 DAY), DATE_ADD(NOW(), INTERVAL -31 DAY), DATE_ADD(CURDATE(), INTERVAL -30 DAY),
     2, 4, 3, 4),
(17, 'Notificar prazo por e-mail',
     'Enviar e-mail ao responsável quando o prazo da demanda estiver próximo.',
     DATE_ADD(NOW(), INTERVAL -4 DAY), DATE_ADD(NOW(), INTERVAL -1 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY),
     3, 3, 4, 3),
(18, 'Migrar servidor de testes',
     'Migrar o servidor de testes para a nova máquina. Cancelada após mudança de planos.',
     DATE_ADD(NOW(), INTERVAL -45 DAY), DATE_ADD(NOW(), INTERVAL -20 DAY), DATE_ADD(CURDATE(), INTERVAL -10 DAY),
     3, 1, 4, 5);
 
-- =========================================
-- RESPONSÁVEIS (relacionamento "Responsável")
-- usuários: 4 Pietro, 5 Rafael, 6 Gustavo Manera, 7 Gustavo Pietro, 8 Luiggi
-- =========================================
INSERT INTO demanda_responsavel (id_demanda, id_usuario) VALUES
(1, 5),
(2, 4),
(3, 7),
(4, 8),
(5, 8),
(6, 4),
(7, 7),
(8, 6),
(9, 6),
(10, 5),
(11, 7),
(12, 8),
(13, 4),
(14, 6),
(15, 5),
(16, 8),
(17, 4),
(18, 7);
 
-- =========================================
-- COMENTÁRIOS DE EXEMPLO
-- =========================================
INSERT INTO comentario (texto, data_hora, id_usuario, id_demanda) VALUES
('Consegui reproduzir o erro: acontece só quando o campo prazo fica vazio.',
    DATE_ADD(NOW(), INTERVAL -18 DAY), 5, 1),
('Já estou ajustando a validação no backend, falta só testar.',
    DATE_ADD(NOW(), INTERVAL -3 DAY), 5, 1),
('Layout da tela está seguindo o wireframe. Falta ligar com a API.',
    DATE_ADD(NOW(), INTERVAL -5 DAY), 8, 5),
('Prazo estourado, vamos priorizar essa demanda na próxima reunião.',
    DATE_ADD(NOW(), INTERVAL -1 DAY), 2, 1),
('Multa corrigida e testada com 3 casos de atraso diferentes.',
    DATE_ADD(NOW(), INTERVAL -7 DAY), 8, 4),
('Fora do escopo do semestre, vou cancelar.',
    DATE_ADD(NOW(), INTERVAL -12 DAY), 2, 9);
 
-- =========================================
-- HISTÓRICO DE EXEMPLO
-- =========================================
INSERT INTO historico (data_hora, tipo_alteracao, valor_anterior, valor_novo, id_usuario, id_demanda) VALUES
(DATE_ADD(NOW(), INTERVAL -20 DAY), 'Criação',    NULL,           'Aberta',       2, 1),
(DATE_ADD(NOW(), INTERVAL -18 DAY), 'Status',     'Aberta',       'Em andamento', 5, 1),
(DATE_ADD(NOW(), INTERVAL -25 DAY), 'Criação',    NULL,           'Aberta',       2, 5),
(DATE_ADD(NOW(), INTERVAL -22 DAY), 'Status',     'Aberta',       'Em andamento', 8, 5),
(DATE_ADD(NOW(), INTERVAL -40 DAY), 'Criação',    NULL,           'Aberta',       2, 4),
(DATE_ADD(NOW(), INTERVAL -30 DAY), 'Status',     'Aberta',       'Em andamento', 8, 4),
(DATE_ADD(NOW(), INTERVAL -9 DAY),  'Status',     'Em andamento', 'Em revisão',   8, 4),
(DATE_ADD(NOW(), INTERVAL -6 DAY),  'Status',     'Em revisão',   'Concluída',    2, 4),
(DATE_ADD(NOW(), INTERVAL -30 DAY), 'Criação',    NULL,           'Aberta',       2, 9),
(DATE_ADD(NOW(), INTERVAL -12 DAY), 'Status',     'Aberta',       'Cancelada',    2, 9),
(DATE_ADD(NOW(), INTERVAL -8 DAY),  'Prioridade', 'Alta',         'Crítica',      2, 3);