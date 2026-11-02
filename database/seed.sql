-- =========================================
-- DADOS INICIAIS DO SISTEMA
-- (perfis, usuários de teste, permissões, status, prioridades, tipos e projetos)
-- Feito por Pietro Giati de Favari
-- Ra: 26028869
-- Executar DEPOIS do schema.sql
-- Usa INSERT IGNORE: pode rodar de novo sem duplicar nem dar erro.
-- =========================================
 
USE pi_ii_database;
 
-- Perfis disponíveis
INSERT IGNORE INTO perfil (nome) VALUES
('Administrador'),
('Líder de Projeto'),
('Membro da Equipe');
 
-- Usuários de teste (senhas guardadas com hash bcrypt)
--   admin@puccampinas.edu.br   -> senha: Admin@123
--   lider@puccampinas.edu.br   -> senha: Lider@123
--   membro@puccampinas.edu.br  -> senha: Membro@123
INSERT IGNORE INTO usuario (nome, email, senha_hash, ativo, id_perfil) VALUES
('Administrador Teste', 'admin@puccampinas.edu.br', '$2b$10$EdR3h3fcUAei2xyDb453iOG5D0ALvJs9iqjMC0W9H9jgQXsRUNzRC', TRUE,
    (SELECT id FROM perfil WHERE nome = 'Administrador')),
('Líder Teste', 'lider@puccampinas.edu.br', '$2b$10$PrN3iz2l.YoT/YZsjiUDW.wQAtMsFlH48nlH2JVYEMgLJJLtfL.zC', TRUE,
    (SELECT id FROM perfil WHERE nome = 'Líder de Projeto')),
('Membro Teste', 'membro@puccampinas.edu.br', '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE,
    (SELECT id FROM perfil WHERE nome = 'Membro da Equipe'));
 
-- =========================================
-- PERMISSÕES (as 11 do MER)
-- =========================================
 
INSERT IGNORE INTO permissao (codigo, descricao) VALUES
('visualizar_projetos',      'Visualizar projetos'),
('visualizar_comentarios',   'Visualizar comentários das demandas'),
('visualizar_historico',     'Visualizar histórico de alterações das demandas'),
('alterar_status',           'Alterar o status de uma demanda'),
('alterar_prioridade',       'Alterar a prioridade de uma demanda'),
('atribuir_alterar_responsavel', 'Atribuir ou alterar o responsável de uma demanda'),
('editar_demanda',           'Editar os dados de uma demanda'),
('criar_demanda',            'Criar demandas'),
('visualizar_usuarios',      'Visualizar a lista de usuários'),
('visualizar_demandas',      'Visualizar demandas'),
('registrar_comentarios',    'Registrar comentários nas demandas');
 
-- =========================================
-- PERMISSÕES POR PERFIL (relacionamento "Concede")
-- Ajuste conforme o documento de escopo, se necessário.
-- As regras de transição de status (quem pode ir de qual status
-- para qual) continuam em backend/src/regras/status.ts.
-- =========================================
 
-- Administrador e Líder de Projeto: todas as permissões
INSERT IGNORE INTO perfil_permissao (id_perfil, id_permissao)
SELECT p.id, pm.id_permissao
FROM perfil p
CROSS JOIN permissao pm
WHERE p.nome IN ('Administrador', 'Líder de Projeto');
 
-- Membro da Equipe: consulta, comenta, cria demanda e avança o status
INSERT IGNORE INTO perfil_permissao (id_perfil, id_permissao)
SELECT p.id, pm.id_permissao
FROM perfil p
JOIN permissao pm ON pm.codigo IN (
    'visualizar_projetos',
    'visualizar_comentarios',
    'visualizar_historico',
    'visualizar_demandas',
    'registrar_comentarios',
    'criar_demanda',
    'alterar_status'
)
WHERE p.nome = 'Membro da Equipe';
 
-- =========================================
-- STATUS, PRIORIDADES E TIPOS
-- =========================================
 
-- A ordem dos status segue o fluxo da demanda
INSERT IGNORE INTO status_demanda (nome_status) VALUES
('Aberta'),
('Em andamento'),
('Em revisão'),
('Concluída'),
('Cancelada');
 
-- ordem 1 = mais urgente (use ORDER BY ordem para listar da mais urgente)
INSERT IGNORE INTO prioridade (nome, ordem) VALUES
('Crítica', 1),
('Alta',    2),
('Média',   3),
('Baixa',   4);
 
INSERT IGNORE INTO tipo_demanda (nome) VALUES
('Tarefa'),
('Defeito'),
('Melhoria'),
('Documentação');
 
-- =========================================
-- PROJETOS DE TESTE (os mesmos usados nos exemplos do frontend)
-- =========================================
 
INSERT IGNORE INTO projeto (nome_projeto, descricao, ativo_projeto) VALUES
('Sistema de Demandas', 'Sistema de acompanhamento de demandas do PI II', TRUE),
('App Biblioteca',      'Aplicativo de gestão de acervo e empréstimos',   TRUE),
('Portal do Aluno',     'Portal com notas, matrícula e documentos',       TRUE);
 
-- Líder e Membro de teste participam de todos os projetos
INSERT IGNORE INTO projeto_membro (id_projeto, id_usuario)
SELECT pr.id_projeto, u.id_usuario
FROM projeto pr
CROSS JOIN usuario u
WHERE u.email IN ('lider@puccampinas.edu.br', 'membro@puccampinas.edu.br');