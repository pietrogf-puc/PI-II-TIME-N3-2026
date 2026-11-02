-- Relacionamento entre usuários e perfis
-- Pietro Giati de Favari
-- Ra:26028869
CREATE TABLE usuario_perfil (
    id_usuario INT NOT NULL,
    id_perfil INT NOT NULL,

    PRIMARY KEY (id_usuario, id_perfil),

    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    FOREIGN KEY (id_perfil)
        REFERENCES perfil(id)
);