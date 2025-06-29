-- Cria o esquema se ele ainda não existir, evitando erros.
CREATE SCHEMA IF NOT EXISTS app_biblia;

-- Adicionado: Prefixo do esquema "app_biblia" para consistência.
CREATE TABLE app_biblia.usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(75) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash TEXT,
    data_nasc DATE NOT NULL,
    google_id VARCHAR(50) UNIQUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE app_biblia.paginasalva (
    id_pagina_salva SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES app_biblia.usuario(id_usuario) ON DELETE CASCADE NOT NULL,
    livro_abreviacao VARCHAR(5) NOT NULL,
    capitulo INTEGER NOT NULL,
    versao_biblia VARCHAR(10) NOT NULL,
    data_salvo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_usuario, livro_abreviacao, capitulo, versao_biblia)
);

CREATE TABLE app_biblia.grifado (
    id_grifo SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES app_biblia.usuario(id_usuario) ON DELETE CASCADE NOT NULL,
    livro_abreviacao VARCHAR(5) NOT NULL,
    capitulo INTEGER NOT NULL,
    versiculo_numero INTEGER NOT NULL,
    cor_grifo VARCHAR(20) NOT NULL,
    versao_biblia VARCHAR(10) NOT NULL,
    texto_grifado TEXT,
    data_grifado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- A constraint UNIQUE permite que o mesmo usuário grife o mesmo versículo com cores diferentes.
    UNIQUE (id_usuario, livro_abreviacao, capitulo, versiculo_numero, versao_biblia, cor_grifo)
);

CREATE TABLE app_biblia.anotacoes (
    id_anotacao SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES app_biblia.usuario(id_usuario) ON DELETE CASCADE NOT NULL,
    livro_abreviacao VARCHAR(5) NOT NULL,
    capitulo INTEGER NOT NULL,
    versiculo_numero INTEGER NOT NULL,
    texto_anotacao TEXT NOT NULL,
    versao_biblia VARCHAR(10) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_modificacao TIMESTAMP WITH TIME ZONE,
    -- A constraint UNIQUE garante que um usuário tenha apenas uma anotação por versículo/versão.
    UNIQUE (id_usuario, livro_abreviacao, capitulo, versiculo_numero, versao_biblia)
);