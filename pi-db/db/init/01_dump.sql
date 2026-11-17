-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: pi_ii_database
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comentario`
--

DROP TABLE IF EXISTS `comentario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentario` (
  `id_comentario` int NOT NULL AUTO_INCREMENT,
  `texto` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int NOT NULL,
  `id_demanda` int NOT NULL,
  PRIMARY KEY (`id_comentario`),
  KEY `fk_comentario_usuario` (`id_usuario`),
  KEY `idx_comentario_demanda` (`id_demanda`),
  CONSTRAINT `fk_comentario_demanda` FOREIGN KEY (`id_demanda`) REFERENCES `demanda` (`id_demanda`) ON DELETE CASCADE,
  CONSTRAINT `fk_comentario_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentario`
--

LOCK TABLES `comentario` WRITE;
/*!40000 ALTER TABLE `comentario` DISABLE KEYS */;
INSERT INTO `comentario` VALUES (1,'Consegui reproduzir o erro: acontece só quando o campo prazo fica vazio.','2026-10-16 09:04:59',5,1),(2,'Já estou ajustando a validação no backend, falta só testar.','2026-10-31 09:04:59',5,1),(3,'Layout da tela está seguindo o wireframe. Falta ligar com a API.','2026-10-29 09:04:59',8,5),(4,'Prazo estourado, vamos priorizar essa demanda na próxima reunião.','2026-11-02 09:04:59',2,1),(5,'Multa corrigida e testada com 3 casos de atraso diferentes.','2026-10-27 09:04:59',8,4),(6,'Fora do escopo do semestre, vou cancelar.','2026-10-22 09:04:59',2,9);
/*!40000 ALTER TABLE `comentario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demanda`
--

DROP TABLE IF EXISTS `demanda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demanda` (
  `id_demanda` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `prazo_finalizacao` date NOT NULL,
  `id_projeto` int NOT NULL,
  `id_tipo` int NOT NULL,
  `id_prioridade` int NOT NULL,
  `id_status` int NOT NULL,
  PRIMARY KEY (`id_demanda`),
  KEY `fk_demanda_tipo` (`id_tipo`),
  KEY `idx_demanda_projeto` (`id_projeto`),
  KEY `idx_demanda_status` (`id_status`),
  KEY `idx_demanda_prioridade` (`id_prioridade`),
  KEY `idx_demanda_prazo` (`prazo_finalizacao`),
  CONSTRAINT `fk_demanda_prioridade` FOREIGN KEY (`id_prioridade`) REFERENCES `prioridade` (`id_prioridade`),
  CONSTRAINT `fk_demanda_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projeto` (`id_projeto`),
  CONSTRAINT `fk_demanda_status` FOREIGN KEY (`id_status`) REFERENCES `status_demanda` (`id_status`),
  CONSTRAINT `fk_demanda_tipo` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_demanda` (`id_tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demanda`
--

LOCK TABLES `demanda` WRITE;
/*!40000 ALTER TABLE `demanda` DISABLE KEYS */;
INSERT INTO `demanda` VALUES (1,'Erro ao salvar demanda sem prazo','Ao salvar uma demanda sem preencher o prazo o sistema retorna erro em vez de avisar o usuário.','2026-10-14 09:04:59','2026-10-31 09:04:59','2026-11-01',1,2,1,2),(2,'Login não valida senha em branco','A tela de login deve bloquear o envio quando a senha estiver em branco.','2026-10-24 09:04:59','2026-10-24 09:04:59','2026-11-04',1,2,1,1),(3,'Filtro de status retorna lista vazia','Ao filtrar a listagem por status a lista volta vazia mesmo existindo demandas com aquele status.','2026-10-26 09:04:59','2026-11-02 09:04:59','2026-11-08',1,2,1,3),(4,'Corrigir cálculo de multa por atraso','O valor da multa por atraso na devolução está sendo calculado com o número de dias errado.','2026-09-24 09:04:59','2026-10-28 09:04:59','2026-10-29',2,2,1,4),(5,'Criar tela de cadastro de demandas','Criar a tela de cadastro de demandas conforme o wireframe, com validação dos campos.','2026-10-09 09:04:59','2026-11-01 09:04:59','2026-11-06',1,1,2,2),(6,'Documentar rotas do backend','Documentar todas as rotas da API (método, parâmetros e exemplos de resposta).','2026-10-28 09:04:59','2026-10-28 09:04:59','2026-11-03',1,4,3,1),(7,'Ajustar layout da listagem no celular','A tabela da listagem de demandas estoura a largura em telas pequenas.','2026-10-29 09:04:59','2026-10-29 09:04:59','2026-11-09',1,3,2,1),(8,'Criar rota GET /dashboard','Criar a rota que devolve os números do dashboard (totais por status, prioridade e atrasadas).','2026-10-31 09:04:59','2026-10-31 09:04:59','2026-11-13',1,1,2,1),(9,'Exportar relatório de demandas em PDF','Permitir exportar a listagem de demandas em PDF. Cancelada por estar fora do escopo.','2026-10-04 09:04:59','2026-10-22 09:04:59','2026-11-05',1,3,4,5),(10,'Notas não aparecem no boletim','Algumas notas lançadas pelo professor não aparecem no boletim do aluno.','2026-10-22 09:04:59','2026-10-30 09:04:59','2026-11-07',3,2,2,2),(11,'Tela de matrícula online','Criar a tela de matrícula online com escolha de disciplinas.','2026-09-29 09:04:59','2026-11-01 09:04:59','2026-11-15',3,1,3,3),(12,'Manual do usuário do portal','Escrever o manual do usuário do Portal do Aluno.','2026-10-19 09:04:59','2026-10-19 09:04:59','2026-11-28',3,4,4,1),(13,'Melhorar busca do acervo','Melhorar a busca de livros do acervo (título, autor e ISBN).','2026-10-16 09:04:59','2026-10-29 09:04:59','2026-11-10',2,3,3,2),(14,'Cadastro de empréstimos','Cadastro de empréstimos de livros com data de devolução.','2026-09-04 09:04:59','2026-10-13 09:04:59','2026-10-14',2,1,2,4),(15,'Leitor de código de barras','Integrar leitor de código de barras para dar baixa nos livros.','2026-10-25 09:04:59','2026-11-01 09:04:59','2026-11-02',2,1,3,2),(16,'Diagrama do banco de dados','Montar o diagrama do banco de dados do App Biblioteca.','2026-09-14 09:04:59','2026-10-03 09:04:59','2026-10-04',2,4,3,4),(17,'Notificar prazo por e-mail','Enviar e-mail ao responsável quando o prazo da demanda estiver próximo.','2026-10-30 09:04:59','2026-11-02 09:04:59','2026-11-23',3,3,4,3),(18,'Migrar servidor de testes','Migrar o servidor de testes para a nova máquina. Cancelada após mudança de planos.','2026-09-19 09:04:59','2026-10-14 09:04:59','2026-10-24',3,1,4,5),(19,'primeiro teste demanda mandar agora','enviando primeira documentacao teste de demanda','2026-11-03 09:45:01','2026-11-03 10:30:52','2026-11-03',1,4,4,1);
/*!40000 ALTER TABLE `demanda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demanda_responsavel`
--

DROP TABLE IF EXISTS `demanda_responsavel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demanda_responsavel` (
  `id_demanda` int NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_demanda`,`id_usuario`),
  KEY `fk_demanda_responsavel_usuario` (`id_usuario`),
  CONSTRAINT `fk_demanda_responsavel_demanda` FOREIGN KEY (`id_demanda`) REFERENCES `demanda` (`id_demanda`) ON DELETE CASCADE,
  CONSTRAINT `fk_demanda_responsavel_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demanda_responsavel`
--

LOCK TABLES `demanda_responsavel` WRITE;
/*!40000 ALTER TABLE `demanda_responsavel` DISABLE KEYS */;
INSERT INTO `demanda_responsavel` VALUES (2,4),(6,4),(13,4),(17,4),(1,5),(10,5),(15,5),(8,6),(9,6),(14,6),(3,7),(7,7),(11,7),(18,7),(4,8),(5,8),(12,8),(16,8),(19,8);
/*!40000 ALTER TABLE `demanda_responsavel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico`
--

DROP TABLE IF EXISTS `historico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico` (
  `id_historico` int NOT NULL AUTO_INCREMENT,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_alteracao` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_anterior` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_novo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_usuario` int NOT NULL,
  `id_demanda` int NOT NULL,
  PRIMARY KEY (`id_historico`),
  KEY `fk_historico_usuario` (`id_usuario`),
  KEY `idx_historico_demanda` (`id_demanda`),
  CONSTRAINT `fk_historico_demanda` FOREIGN KEY (`id_demanda`) REFERENCES `demanda` (`id_demanda`) ON DELETE CASCADE,
  CONSTRAINT `fk_historico_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico`
--

LOCK TABLES `historico` WRITE;
/*!40000 ALTER TABLE `historico` DISABLE KEYS */;
INSERT INTO `historico` VALUES (1,'2026-10-14 09:04:59','Criação',NULL,'Aberta',2,1),(2,'2026-10-16 09:04:59','Status','Aberta','Em andamento',5,1),(3,'2026-10-09 09:04:59','Criação',NULL,'Aberta',2,5),(4,'2026-10-12 09:04:59','Status','Aberta','Em andamento',8,5),(5,'2026-09-24 09:04:59','Criação',NULL,'Aberta',2,4),(6,'2026-10-04 09:04:59','Status','Aberta','Em andamento',8,4),(7,'2026-10-25 09:04:59','Status','Em andamento','Em revisão',8,4),(8,'2026-10-28 09:04:59','Status','Em revisão','Concluída',2,4),(9,'2026-10-04 09:04:59','Criação',NULL,'Aberta',2,9),(10,'2026-10-22 09:04:59','Status','Aberta','Cancelada',2,9),(11,'2026-10-26 09:04:59','Prioridade','Alta','Crítica',2,3),(12,'2026-11-03 09:45:01','Criação',NULL,'Aberta',1,19),(13,'2026-11-03 10:30:43','Prioridade','Baixa','Alta',1,19),(14,'2026-11-03 10:30:52','Prioridade','Alta','Baixa',1,19);
/*!40000 ALTER TABLE `historico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfil`
--

DROP TABLE IF EXISTS `perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfil`
--

LOCK TABLES `perfil` WRITE;
/*!40000 ALTER TABLE `perfil` DISABLE KEYS */;
INSERT INTO `perfil` VALUES (1,'Administrador'),(2,'Líder de Projeto'),(3,'Membro da Equipe');
/*!40000 ALTER TABLE `perfil` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfil_permissao`
--

DROP TABLE IF EXISTS `perfil_permissao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil_permissao` (
  `id_perfil` int NOT NULL,
  `id_permissao` int NOT NULL,
  PRIMARY KEY (`id_perfil`,`id_permissao`),
  KEY `fk_perfil_permissao_permissao` (`id_permissao`),
  CONSTRAINT `fk_perfil_permissao_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_perfil_permissao_permissao` FOREIGN KEY (`id_permissao`) REFERENCES `permissao` (`id_permissao`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfil_permissao`
--

LOCK TABLES `perfil_permissao` WRITE;
/*!40000 ALTER TABLE `perfil_permissao` DISABLE KEYS */;
INSERT INTO `perfil_permissao` VALUES (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(1,3),(2,3),(3,3),(1,4),(2,4),(3,4),(1,5),(2,5),(1,6),(2,6),(1,7),(2,7),(1,8),(2,8),(1,9),(1,10),(2,10),(3,10),(1,11),(2,11),(3,11);
/*!40000 ALTER TABLE `perfil_permissao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissao`
--

DROP TABLE IF EXISTS `permissao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissao` (
  `id_permissao` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_permissao`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissao`
--

LOCK TABLES `permissao` WRITE;
/*!40000 ALTER TABLE `permissao` DISABLE KEYS */;
INSERT INTO `permissao` VALUES (1,'visualizar_projetos','Visualizar projetos'),(2,'visualizar_comentarios','Visualizar comentários das demandas'),(3,'visualizar_historico','Visualizar histórico de alterações'),(4,'alterar_status','Alterar o status de uma demanda'),(5,'alterar_prioridade','Alterar a prioridade de uma demanda'),(6,'atribuir_alterar_responsavel','Atribuir ou alterar o responsável de uma demanda'),(7,'editar_demanda','Editar os dados de uma demanda'),(8,'criar_demanda','Criar uma nova demanda'),(9,'visualizar_usuarios','Visualizar usuários'),(10,'visualizar_demandas','Visualizar demandas'),(11,'registrar_comentarios','Registrar comentários nas demandas');
/*!40000 ALTER TABLE `permissao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prioridade`
--

DROP TABLE IF EXISTS `prioridade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prioridade` (
  `id_prioridade` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordem` int NOT NULL,
  PRIMARY KEY (`id_prioridade`),
  UNIQUE KEY `nome` (`nome`),
  UNIQUE KEY `ordem` (`ordem`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prioridade`
--

LOCK TABLES `prioridade` WRITE;
/*!40000 ALTER TABLE `prioridade` DISABLE KEYS */;
INSERT INTO `prioridade` VALUES (1,'Crítica',1),(2,'Alta',2),(3,'Média',3),(4,'Baixa',4);
/*!40000 ALTER TABLE `prioridade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projeto`
--

DROP TABLE IF EXISTS `projeto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projeto` (
  `id_projeto` int NOT NULL AUTO_INCREMENT,
  `nome_projeto` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `ativo_projeto` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_projeto`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projeto`
--

LOCK TABLES `projeto` WRITE;
/*!40000 ALTER TABLE `projeto` DISABLE KEYS */;
INSERT INTO `projeto` VALUES (1,'Sistema de Demandas','Sistema de acompanhamento de demandas do Projeto Integrador II.',1),(2,'App Biblioteca','Aplicativo para controle de acervo e empréstimos da biblioteca.',1),(3,'Portal do Aluno','Portal web com notas, matrícula e documentos do aluno.',1);
/*!40000 ALTER TABLE `projeto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projeto_usuario`
--

DROP TABLE IF EXISTS `projeto_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projeto_usuario` (
  `id_projeto` int NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_projeto`,`id_usuario`),
  KEY `fk_projeto_usuario_usuario` (`id_usuario`),
  CONSTRAINT `fk_projeto_usuario_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projeto` (`id_projeto`) ON DELETE CASCADE,
  CONSTRAINT `fk_projeto_usuario_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projeto_usuario`
--

LOCK TABLES `projeto_usuario` WRITE;
/*!40000 ALTER TABLE `projeto_usuario` DISABLE KEYS */;
INSERT INTO `projeto_usuario` VALUES (1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(1,3),(2,3),(3,3),(1,4),(2,4),(3,4),(1,5),(2,5),(3,5),(1,6),(2,6),(3,6),(1,7),(2,7),(3,7),(1,8),(2,8),(3,8);
/*!40000 ALTER TABLE `projeto_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_demanda`
--

DROP TABLE IF EXISTS `status_demanda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status_demanda` (
  `id_status` int NOT NULL AUTO_INCREMENT,
  `nome_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_status`),
  UNIQUE KEY `nome_status` (`nome_status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_demanda`
--

LOCK TABLES `status_demanda` WRITE;
/*!40000 ALTER TABLE `status_demanda` DISABLE KEYS */;
INSERT INTO `status_demanda` VALUES (1,'Aberta'),(5,'Cancelada'),(4,'Concluída'),(2,'Em andamento'),(3,'Em revisão');
/*!40000 ALTER TABLE `status_demanda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_demanda`
--

DROP TABLE IF EXISTS `tipo_demanda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_demanda` (
  `id_tipo` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_tipo`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_demanda`
--

LOCK TABLES `tipo_demanda` WRITE;
/*!40000 ALTER TABLE `tipo_demanda` DISABLE KEYS */;
INSERT INTO `tipo_demanda` VALUES (2,'Defeito'),(4,'Documentação'),(3,'Melhoria'),(1,'Tarefa');
/*!40000 ALTER TABLE `tipo_demanda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `id_perfil` int NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuario_perfil` (`id_perfil`),
  CONSTRAINT `fk_usuario_perfil` FOREIGN KEY (`id_perfil`) REFERENCES `perfil` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Administrador Teste','admin@puccampinas.edu.br','$2b$10$EdR3h3fcUAei2xyDb453iOG5D0ALvJs9iqjMC0W9H9jgQXsRUNzRC',1,1),(2,'Líder Teste','lider@puccampinas.edu.br','$2b$10$PrN3iz2l.YoT/YZsjiUDW.wQAtMsFlH48nlH2JVYEMgLJJLtfL.zC',1,2),(3,'Membro Teste','membro@puccampinas.edu.br','$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa',1,3),(4,'Pietro Giati','pietro.giati@puccampinas.edu.br','$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa',1,3),(5,'Rafael Soares','rafael.soares@puccampinas.edu.br','$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa',1,3),(6,'Gustavo Manera','gustavo.manera@puccampinas.edu.br','$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa',1,3),(7,'Gustavo Pietro','gustavo.pietro@puccampinas.edu.br','$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa',1,3),(8,'Luiggi Fraga','luiggi.fraga@puccampinas.edu.br','$2b$10$h6PAiR6Ann79zd6o0Fqz/eK/kVWAdiLoqidXi252BYphWzu5aSMfa',1,3);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-17  9:21:57
