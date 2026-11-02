-- =========================================
-- ESTRUTURA DO BANCO DE DADOS (MER completo)
-- Projeto PI-II-TIME-N3-2026
-- Tabelas de login/perfis feitas por Pietro Giati de Favari (Ra: 26028869)
-- Executar ANTES do seed.sql
-- =========================================
 
CREATE DATABASE IF NOT EXISTS pi_ii_database
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
 
USE pi_ii_database;
 
-- =========================================
-- TABELA: PERFIL
-- (Administrador, Líder de Projeto, Membro da Equipe)
-- Especialização do MER: cada perfil é uma linha desta tabela
-- =========================================
 
CREATE TABLE IF NOT EXISTS perfil (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);
 
-- =========================================
-- TABELA: PERMISSAO
-- Cada permissão do MER (visualizar_projetos, criar_demanda, ...)
-- é uma linha identificada por um código único
-- =========================================
 
CREATE TABLE IF NOT EXISTS permissao (
    id_permissao INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL UNIQUE,
    descricao VARCHAR(150) NOT NULL
);
 
-- =========================================
-- TABELA: PERFIL_PERMISSAO  (relacionamento "Concede", N:N)
-- Perfil (0,n) <-> (0,n) Permissão
-- =========================================
 
CREATE TABLE IF NOT EXISTS perfil_permissao (
    id_perfil INT NOT NULL,
    id_permissao INT NOT NULL,
 
    PRIMARY KEY (id_perfil, id_permissao),
 
    CONSTRAINT fk_perfil_permissao_perfil
        FOREIGN KEY (id_perfil)
        REFERENCES perfil(id)
        ON DELETE CASCADE,
 
    CONSTRAINT fk_perfil_permissao_permissao
        FOREIGN KEY (id_permissao)
        REFERENCES permissao(id_permissao)
        ON DELETE CASCADE
);
 
-- =========================================
-- TABELA: USUARIO
-- Relacionamento "Possui": cada usuário possui um único perfil (id_perfil)
-- =========================================
 
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    id_perfil INT NOT NULL,
 
    CONSTRAINT fk_usuario_perfil
        FOREIGN KEY (id_perfil)
        REFERENCES perfil(id)
);
 
-- =========================================
-- TABELA: PROJETO
-- =========================================
 
CREATE TABLE IF NOT EXISTS projeto (
    id_projeto INT AUTO_INCREMENT PRIMARY KEY,
    nome_projeto VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo_projeto BOOLEAN NOT NULL DEFAULT TRUE
);
 
-- =========================================
-- TABELA: PROJETO_USUARIO  (relacionamento "Participa", N:N)
-- Usuário (0,n) <-> (0,n) Projeto
-- =========================================
 
CREATE TABLE IF NOT EXISTS projeto_usuario (
    id_projeto INT NOT NULL,
    id_usuario INT NOT NULL,
 
    PRIMARY KEY (id_projeto, id_usuario),
 
    CONSTRAINT fk_projeto_usuario_projeto
        FOREIGN KEY (id_projeto)
        REFERENCES projeto(id_projeto)
        ON DELETE CASCADE,
 
    CONSTRAINT fk_projeto_usuario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);
 
-- =========================================
-- TABELAS DE DOMÍNIO DA DEMANDA
-- (Tipo_Demanda, Prioridade, Status_Demanda)
-- =========================================
 
CREATE TABLE IF NOT EXISTS tipo_demanda (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);
 
CREATE TABLE IF NOT EXISTS prioridade (
    id_prioridade INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    ordem INT NOT NULL UNIQUE   -- 1 = mais urgente
);
 
CREATE TABLE IF NOT EXISTS status_demanda (
    id_status INT AUTO_INCREMENT PRIMARY KEY,
    nome_status VARCHAR(50) NOT NULL UNIQUE
);
 
-- =========================================
-- TABELA: DEMANDA
-- Relacionamentos 1:N (lado "N" guarda a chave estrangeira):
--   Contém    -> id_projeto
--   Classifica -> id_tipo
--   Define    -> id_prioridade
--   Situa     -> id_status
-- =========================================
 
CREATE TABLE IF NOT EXISTS demanda (
    id_demanda INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    prazo_finalizacao DATE NOT NULL,
    id_projeto INT NOT NULL,
    id_tipo INT NOT NULL,
    id_prioridade INT NOT NULL,
    id_status INT NOT NULL,
 
    CONSTRAINT fk_demanda_projeto
        FOREIGN KEY (id_projeto)
        REFERENCES projeto(id_projeto),
 
    CONSTRAINT fk_demanda_tipo
        FOREIGN KEY (id_tipo)
        REFERENCES tipo_demanda(id_tipo),
 
    CONSTRAINT fk_demanda_prioridade
        FOREIGN KEY (id_prioridade)
        REFERENCES prioridade(id_prioridade),
 
    CONSTRAINT fk_demanda_status
        FOREIGN KEY (id_status)
        REFERENCES status_demanda(id_status)
);
 
CREATE INDEX idx_demanda_projeto ON demanda(id_projeto);
CREATE INDEX idx_demanda_status ON demanda(id_status);
CREATE INDEX idx_demanda_prioridade ON demanda(id_prioridade);
CREATE INDEX idx_demanda_prazo ON demanda(prazo_finalizacao);
 
-- =========================================
-- TABELA: DEMANDA_RESPONSAVEL  (relacionamento "Responsável", N:N)
-- Usuário (0,n) <-> (0,n) Demanda
-- =========================================
 
CREATE TABLE IF NOT EXISTS demanda_responsavel (
    id_demanda INT NOT NULL,
    id_usuario INT NOT NULL,
 
    PRIMARY KEY (id_demanda, id_usuario),
 
    CONSTRAINT fk_demanda_responsavel_demanda
        FOREIGN KEY (id_demanda)
        REFERENCES demanda(id_demanda)
        ON DELETE CASCADE,
 
    CONSTRAINT fk_demanda_responsavel_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);
 
-- =========================================
-- TABELA: COMENTARIO
-- "Escreve": cada comentário é escrito por 1 usuário
-- "Recebe": cada comentário pertence a 1 demanda
-- =========================================
 
CREATE TABLE IF NOT EXISTS comentario (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    id_demanda INT NOT NULL,
 
    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),
 
    CONSTRAINT fk_comentario_demanda
        FOREIGN KEY (id_demanda)
        REFERENCES demanda(id_demanda)
        ON DELETE CASCADE
);
 
CREATE INDEX idx_comentario_demanda ON comentario(id_demanda);
 
-- =========================================
-- TABELA: HISTORICO
-- "Registra": cada registro pertence a 1 demanda
-- "Visualiza": cada registro está ligado a 1 usuário (quem fez a alteração)
-- =========================================
 
CREATE TABLE IF NOT EXISTS historico (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_alteracao VARCHAR(50) NOT NULL,
    valor_anterior VARCHAR(255),
    valor_novo VARCHAR(255),
    id_usuario INT NOT NULL,
    id_demanda INT NOT NULL,
 
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),
 
    CONSTRAINT fk_historico_demanda
        FOREIGN KEY (id_demanda)
        REFERENCES demanda(id_demanda)
        ON DELETE CASCADE
);
 
CREATE INDEX idx_historico_demanda ON historico(id_demanda);