const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const BIBLE_API_URL = "https://www.abibliadigital.com.br/api";
const API_TOKEN = process.env.API_BIBLIA;

// Middleware para adicionar o token de autenticação em todas as requisições
router.use((req, res, next) => {
    if (!API_TOKEN) {
        console.ERROR ("ERRO: A variável de ambiente API_BIBLIA não está configurada no servidor.");
        return res.status(500).json({ error: "Configuração do servidor incorreta." });
    }
    next();
});

// Rota para buscar os versículos de um capítulo
router.get('/verses/:version/:book/:chapter', async (req, res) => {
    const { version, book, chapter } = req.params;
    const url = `${BIBLE_API_URL}/verses/${version}/${book}/${chapter}`;

    try {
        const apiResponse = await fetch (url, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        })
        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar versículos:", error);
        res.status(500).json({ error: "Erro ao buscar versículos." });
    }
});

// Rota para buscar informações de um livro (número de capítulos)
// Ex: GET /api/bible/books/gn
router.get('/books/:book', async (req, res) => {
    const { book } = req.params;
    const url = `${BIBLE_API_URL}/books/${book}`;

    try {
        const apiResponse = await fetch(url, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Erro ao fazer proxy para a API da Bíblia (livros):', error);
        res.status(500).json({ error: 'Erro interno ao contatar o serviço da Bíblia.' });
    }
});

module.exports = router;