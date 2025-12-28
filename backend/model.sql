-- Cria o esquema se ele ainda não existir, evitando erros.
CREATE SCHEMA IF NOT EXISTS bible_study_app;

-- Adicionado: Prefixo do esquema "bible_study_app" para consistência.
CREATE TABLE bible_study_app.usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(75) NOT NULL,
    sobrenome VARCHAR (75) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash TEXT,
    google_id VARCHAR(50) UNIQUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE bible_study_app.ProgressoVideos (
    id_progresso SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES bible_study_app.usuario(id_usuario) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL, -- ID do vídeo do YouTube, ex: "dQw4w9WgXcQ"
    video_data JSONB NOT NULL, -- Usamos JSONB por ser mais eficiente para buscas
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint que garante que cada usuário tenha apenas uma entrada por vídeo.
    -- ESSENCIAL para a lógica de UPSERT (ON CONFLICT) funcionar.
    UNIQUE (id_usuario, video_id)
);

-- Opcional: Melhora a performance de buscas filtrando apenas pelo usuário.
CREATE INDEX idx_progressovideos_id_usuario ON bible_study_app.ProgressoVideos(id_usuario);



CREATE TABLE bible_study_app.paginasalva (
    id_pagina_salva SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES bible_study_app.usuario(id_usuario) ON DELETE CASCADE NOT NULL,
    livro_abreviacao VARCHAR(5) NOT NULL,
    capitulo INTEGER NOT NULL,
    versao_biblia VARCHAR(10) NOT NULL,
    data_salvo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_usuario, livro_abreviacao, capitulo, versao_biblia)
);


CREATE TABLE bible_study_app.grifado (
    id_grifo SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES bible_study_app.usuario(id_usuario) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE bible_study_app.anotacoes (
    id_anotacao SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES bible_study_app.usuario(id_usuario) ON DELETE CASCADE NOT NULL,
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

-- Tabela para rastrear os livros que o usuário marcou como lidos
CREATE TABLE bible_study_app.livros_lidos (
    id_livro_lido SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES bible_study_app.usuario(id_usuario) ON DELETE CASCADE,
    livro_abreviacao VARCHAR(5) NOT NULL,
    data_conclusao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Garante que um usuário só possa marcar um livro como lido uma vez
    UNIQUE (id_usuario, livro_abreviacao)
);

-- Índice para acelerar a busca de livros lidos por usuário
CREATE INDEX idx_livros_lidos_id_usuario ON bible_study_app.livros_lidos(id_usuario);

-- ============================================================================
-- TABELAS PARA GAMIFICAÇÃO DO DEVOCIONAL DIÁRIO
-- ============================================================================

-- Tabela para rastrear leituras diárias do devocional por usuário
CREATE TABLE bible_study_app.devocional_leitura (
    id_leitura SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES bible_study_app.usuario(id_usuario) ON DELETE CASCADE,
    day_key DATE NOT NULL,
    lido_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    tempo_leitura_segundos INTEGER DEFAULT 0,
    UNIQUE(id_usuario, day_key)
);

-- Índice para acelerar consultas de streak
CREATE INDEX idx_devocional_leitura_usuario_data ON bible_study_app.devocional_leitura(id_usuario, day_key DESC);

-- Tabela para conquistas/badges desbloqueadas
CREATE TABLE bible_study_app.devocional_conquistas (
    id_conquista SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES bible_study_app.usuario(id_usuario) ON DELETE CASCADE,
    tipo_conquista VARCHAR(50) NOT NULL, -- 'streak_3', 'streak_7', 'streak_30', etc.
    desbloqueado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, tipo_conquista)
);

-- Índice para buscar conquistas por usuário
CREATE INDEX idx_devocional_conquistas_usuario ON bible_study_app.devocional_conquistas(id_usuario);