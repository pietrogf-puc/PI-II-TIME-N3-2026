-- =========================================
-- DADOS INICIAIS DO SISTEMA (perfis e usuários de teste)
-- Feito por Pietro Giati de Favari
-- Ra: 26028869
-- Executar DEPOIS do schema.sql (rodar uma única vez)
-- =========================================

USE pi_ii_database;

-- Perfis disponíveis
INSERT INTO perfil (nome) VALUES
('Administrador'),
('Líder de Projeto'),
('Membro da Equipe');

-- Usuários de teste (senhas guardadas com hash bcrypt)
--   admin@puccampinas.edu.br   -> senha: Admin@123
--   lider@puccampinas.edu.br   -> senha: Lider@123
--   membro@puccampinas.edu.br  -> senha: Membro@123
INSERT INTO usuario (nome, email, senha_hash, ativo, id_perfil) VALUES
('Administrador Teste', 'admin@puccampinas.edu.br', '$2b$10$EdR3h3fcUAei2xyDb453iOG5D0ALvJs9iqjMC0W9H9jgQXsRUNzRC', TRUE,
    (SELECT id FROM perfil WHERE nome = 'Administrador')),
('Líder Teste', 'lider@puccampinas.edu.br', '$2b$10$PrN3iz2l.YoT/YZsjiUDW.wQAtMsFlH48nlH2JVYEMgLJJLtfL.zC', TRUE,
    (SELECT id FROM perfil WHERE nome = 'Líder de Projeto')),
('Membro Teste', 'membro@puccampinas.edu.br', '$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa', TRUE,
    (SELECT id FROM perfil WHERE nome = 'Membro da Equipe'));