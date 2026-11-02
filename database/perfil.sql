-- Criação da tabela de perfis
-- Pietro Giati de Favari
-- Ra:26028869

CREATE TABLE perfil (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);