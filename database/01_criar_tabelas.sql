-- Feito por Gustavo Manera Marialva - RA 26029581
-- Projeto Integrador II - Grupo N3 - Sistema de Acompanhamento de Demandas
--
-- 01_criar_tabelas.sql: cria o banco (MySQL 8) e as tabelas que o dashboard usa.
-- Como rodar, na pasta do projeto (funciona também no PowerShell):
--   mysql -u root -p --default-character-set=utf8mb4 -e "source database/01_criar_tabelas.sql"
-- Ou abra este arquivo no MySQL Workbench e execute.
--
-- As tabelas de comentários e de histórico de alterações ainda não estão aqui,
-- porque o dashboard não usa essas informações.

-- Garante que os acentos dos valores abaixo cheguem certos ao banco
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS sistema_demandas
  CHARACTER SET utf8mb4          -- aceita todos os acentos do português
  COLLATE utf8mb4_0900_ai_ci;

USE sistema_demandas;

-- Projetos: cada demanda pertence obrigatoriamente a um projeto.
CREATE TABLE IF NOT EXISTS projetos (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE
);

-- Usuários: os três perfis do escopo.
-- A coluna de senha fica para quem implementar o login.
CREATE TABLE IF NOT EXISTS usuarios (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nome   VARCHAR(100) NOT NULL,
  email  VARCHAR(150) NOT NULL UNIQUE,
  perfil ENUM('Administrador', 'Líder de Projeto', 'Membro da Equipe') NOT NULL
);

-- Demandas: a principal tabela do sistema.
-- Os ENUM garantem que só entram no banco os valores definidos no escopo.
CREATE TABLE IF NOT EXISTS demandas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  titulo           VARCHAR(150) NOT NULL,
  descricao        TEXT NOT NULL,
  tipo             ENUM('Tarefa', 'Defeito', 'Melhoria', 'Documentação') NOT NULL,
  prioridade       ENUM('Crítica', 'Alta', 'Média', 'Baixa') NOT NULL,
  -- Toda demanda nasce com o status Aberta
  status           ENUM('Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada') NOT NULL DEFAULT 'Aberta',
  projeto_id       INT NOT NULL,
  -- O responsável pode ficar em branco na criação da demanda
  responsavel_id   INT NULL,
  -- As duas datas abaixo são preenchidas automaticamente pelo banco
  data_criacao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- O prazo pode ser definido na criação ou depois
  prazo            DATE NULL,
  CONSTRAINT fk_demanda_projeto FOREIGN KEY (projeto_id) REFERENCES projetos (id),
  CONSTRAINT fk_demanda_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios (id)
);
