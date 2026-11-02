-- =========================================
-- ESTRUTURA DO BANCO DE DADOS
-- Projeto PI-II-TIME-N3-2026
-- Pietro Giati de Favari
-- Ra:26028869
-- =========================================

USE pi_ii_database;

-- =========================================
-- TABELA: PERFIL
-- =========================================

CREATE TABLE perfil (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- =========================================
-- TABELA: USUARIO
-- =========================================

CREATE TABLE usuario (
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