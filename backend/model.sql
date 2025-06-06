CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR (75) NOT NULL,
    email VARCHAR (150) NOT NULL UNIQUE,
    senha_hash TEXT,
    data_nasc DATE NOT NULL,
    google_id VARCHAR (50) UNIQUE,
    data_criacao TIMESTRAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE
)

CREATE TABLE app_biblia.paginasalva (
    id_pagina_salva SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES app_biblia.Usuario(id_usuario) NOT NULL,
    livro_abreviacao VARCHAR(5) NOT NULL,
    capitulo INTEGER NOT NULL,
    versao_biblia VARCHAR(10) NOT NULL,
    data_salvo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_usuario, livro_abreviacao, capitulo, versao_biblia)
);

CREATE TABLE app_biblia.grifado (
    id_grifo SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES app_biblia.Usuario(id_usuario) NOT NULL,
    livro_abreviacao VARCHAR(5) NOT NULL,
    capitulo INTEGER NOT NULL,
    versiculo_numero INTEGER NOT NULL,
    cor_grifo VARCHAR(20) NOT NULL,
    versao_biblia VARCHAR(10) NOT NULL,
    texto_grifado TEXT,
    data_grifado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_usuario, livro_abreviacao, capitulo, versiculo_numero, versao_biblia, cor_grifo) -- Considera a cor para permitir grifos diferentes no mesmo versículo
);

CREATE TABLE app_biblia.anotacoes (
    id_anotacao SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES app_biblia.Usuario(id_usuario) NOT NULL,
    livro_abreviacao VARCHAR(5) NOT NULL,
    capitulo INTEGER NOT NULL,
    versiculo_numero INTEGER NOT NULL,
    texto_anotacao TEXT NOT NULL,
    versao_biblia VARCHAR(10) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_modificacao TIMESTAMP,
    UNIQUE (id_usuario, livro_abreviacao, capitulo, versiculo_numero, versao_biblia) -- Um usuário só pode ter uma anotação por versículo/versão
);
