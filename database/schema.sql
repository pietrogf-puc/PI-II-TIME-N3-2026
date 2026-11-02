-- =========================================
-- ESTRUTURA DO BANCO DE DADOS (login, perfis e demandas)
-- Projeto PI-II-TIME-N3-2026
-- Feito por Pietro Giati de Favari
-- Ra: 26028869
-- Executar ANTES do seed.sql
-- =========================================
 
CREATE DATABASE IF NOT EXISTS pi_ii_database
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
 
USE pi_ii_database;
 
-- =========================================
-- TABELA: PERFIL
-- (Administrador, Líder de Projeto, Membro da Equipe)
-- =========================================
 
CREATE TABLE IF NOT EXISTS perfil (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);
 
-- =========================================
-- TABELA: USUARIO
-- Cada usuário possui um único perfil (id_perfil)
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
-- TABELA: PERMISSAO
-- (cada linha é uma permissão do sistema, ex.: criar_demanda)
-- =========================================
 
CREATE TABLE IF NOT EXISTS permissao (
    id_permissao INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(150) NOT NULL
);
 
-- =========================================
-- TABELA: PERFIL_PERMISSAO
-- Quais permissões cada perfil possui (Concede)
-- =========================================
 
CREATE TABLE IF NOT EXISTS perfil_permissao (
    id_perfil INT NOT NULL,
    id_permissao INT NOT NULL,
 
    PRIMARY KEY (id_perfil, id_permissao),
 
    CONSTRAINT fk_perfilpermissao_perfil
        FOREIGN KEY (id_perfil)
        REFERENCES perfil(id)
        ON DELETE CASCADE,
 
    CONSTRAINT fk_perfilpermissao_permissao
        FOREIGN KEY (id_permissao)
        REFERENCES permissao(id_permissao)
        ON DELETE CASCADE
);
 
-- =========================================
-- TABELA: PROJETO
-- =========================================
 
CREATE TABLE IF NOT EXISTS projeto (
    id_projeto INT AUTO_INCREMENT PRIMARY KEY,
    nome_projeto VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT NULL,
    ativo_projeto BOOLEAN NOT NULL DEFAULT TRUE
);
 
-- =========================================
-- TABELA: PROJETO_MEMBRO
-- Quais usuários participam de cada projeto (Participa)
-- =========================================
 
CREATE TABLE IF NOT EXISTS projeto_membro (
    id_projeto INT NOT NULL,
    id_usuario INT NOT NULL,
 
    PRIMARY KEY (id_projeto, id_usuario),
 
    CONSTRAINT fk_projetomembro_projeto
        FOREIGN KEY (id_projeto)
        REFERENCES projeto(id_projeto)
        ON DELETE CASCADE,
 
    CONSTRAINT fk_projetomembro_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);
 
-- =========================================
-- TABELA: TIPO_DEMANDA
-- (Tarefa, Defeito, Melhoria, Documentação)
-- =========================================
 
CREATE TABLE IF NOT EXISTS tipo_demanda (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);
 
-- =========================================
-- TABELA: PRIORIDADE
-- (Crítica, Alta, Média, Baixa - ordem 1 é a mais urgente)
-- =========================================
 
CREATE TABLE IF NOT EXISTS prioridade (
    id_prioridade INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    ordem INT NOT NULL UNIQUE
);
 
-- =========================================
-- TABELA: STATUS_DEMANDA
-- (Aberta, Em andamento, Em revisão, Concluída, Cancelada)
-- =========================================
 
CREATE TABLE IF NOT EXISTS status_demanda (
    id_status INT AUTO_INCREMENT PRIMARY KEY,
    nome_status VARCHAR(50) NOT NULL UNIQUE
);
 
-- =========================================
-- TABELA: DEMANDA
-- Cada demanda pertence a um projeto e possui um tipo, uma prioridade
-- e um status. O responsável (id_responsavel) é opcional
-- =========================================
 
CREATE TABLE IF NOT EXISTS demanda (
    id_demanda INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    prazo_finalizacao DATE NOT NULL,
    id_projeto INT NOT NULL,
    id_tipo INT NOT NULL,
    id_prioridade INT NOT NULL,
    id_status INT NOT NULL,
    id_responsavel INT NULL,
 
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
        REFERENCES status_demanda(id_status),
 
    CONSTRAINT fk_demanda_responsavel
        FOREIGN KEY (id_responsavel)
        REFERENCES usuario(id_usuario),
 
    INDEX idx_demanda_prazo (prazo_finalizacao)
);
 
-- =========================================
-- TABELA: COMENTARIO
-- Comentário escrito por um usuário em uma demanda (máximo 300 caracteres)
-- =========================================
 
CREATE TABLE IF NOT EXISTS comentario (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    texto VARCHAR(300) NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    id_demanda INT NOT NULL,
 
    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),
 
    CONSTRAINT fk_comentario_demanda
        FOREIGN KEY (id_demanda)
        REFERENCES demanda(id_demanda),
 
    INDEX idx_comentario_demanda (id_demanda, data_hora)
);
 
-- =========================================
-- TABELA: HISTORICO
-- Alterações feitas em uma demanda e o usuário que as fez
-- (tipo_alteracao ex.: CRIACAO, STATUS, PRIORIDADE, RESPONSAVEL, EDICAO)
-- =========================================
 
CREATE TABLE IF NOT EXISTS historico (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_alteracao VARCHAR(50) NOT NULL,
    valor_anterior VARCHAR(255) NULL,
    valor_novo VARCHAR(255) NULL,
    id_usuario INT NOT NULL,
    id_demanda INT NOT NULL,
 
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),
 
    CONSTRAINT fk_historico_demanda
        FOREIGN KEY (id_demanda)
        REFERENCES demanda(id_demanda),
 
    INDEX idx_historico_demanda (id_demanda, data_hora)
);