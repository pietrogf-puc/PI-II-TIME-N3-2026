-- =========================================
-- ESTRUTURA DO BANCO DE DADOS (login e perfis)
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