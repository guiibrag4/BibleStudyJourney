// Arquivo: server/routes/chaptersRoutes.js
// Rotas para gerenciamento de capítulos salvos

const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assumindo que você tem um arquivo db.js com a configuração do pool

/**
 * GET /api/user/chapters
 * Retorna todos os capítulos salvos do usuário autenticado
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const result = await pool.query(
            `SELECT 
                id_pagina_salva,
                livro_abreviacao,
                capitulo,
                versao_biblia,
                data_salvo
             FROM app_biblia.paginasalva
             WHERE id_usuario = $1
             ORDER BY data_salvo DESC`,
            [userId]
        );

        // Converter para o formato esperado pelo frontend
        const chapters = {};
        result.rows.forEach(row => {
            const key = `${row.livro_abreviacao}${row.capitulo}`;
            chapters[key] = {
                id: `c${row.id_pagina_salva}`,
                title: key, // Ex: "Gn1", "Sl23"
                subtitle: `Versão ${row.versao_biblia}`,
                verseCount: 0, // Será preenchido pelo frontend se necessário
                date: new Date(row.data_salvo).toLocaleDateString('pt-BR'),
                livro: row.livro_abreviacao,
                capitulo: row.capitulo,
                versao: row.versao_biblia
            };
        });

        res.json({ chapters });
    } catch (error) {
        console.error('Erro ao buscar capítulos salvos:', error);
        res.status(500).json({ error: 'Erro ao buscar capítulos salvos' });
    }
});

/**
 * POST /api/user/chapters
 * Salva um capítulo
 * Body: { title, subtitle, verseCount, livro, capitulo, versao }
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const { title, livro, capitulo, versao } = req.body;
        if (!livro || !capitulo || !versao) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        const result = await pool.query(
            `INSERT INTO app_biblia.paginasalva 
                (id_usuario, livro_abreviacao, capitulo, versao_biblia)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id_usuario, livro_abreviacao, capitulo, versao_biblia)
             DO UPDATE SET data_salvo = CURRENT_TIMESTAMP
             RETURNING id_pagina_salva, data_salvo`,
            [userId, String(livro).toLowerCase(), parseInt(capitulo, 10), versao]
        );

        res.json({
            success: true,
            chapter: {
                id: `c${result.rows[0].id_pagina_salva}`,
                title: title || `${livro}${capitulo}`,
                subtitle: `Versão ${versao}`,
                date: new Date(result.rows[0].data_salvo).toLocaleDateString('pt-BR'),
                livro,
                capitulo: parseInt(capitulo),
                versao
            }
        });
    } catch (error) {
        console.error('Erro ao salvar capítulo:', error);
        res.status(500).json({ error: 'Erro ao salvar capítulo' });
    }
});

/**
 * DELETE /api/user/chapters/:id
 * Remove um capítulo salvo específico
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const { id } = req.params;

        // Extrair o ID numérico (remove o 'c' do início)
        const numericId = id.replace(/^c/, '');

        await pool.query(
            `DELETE FROM app_biblia.paginasalva
             WHERE id_usuario = $1 AND id_pagina_salva = $2`,
            [userId, parseInt(numericId)]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao remover capítulo salvo:', error);
        res.status(500).json({ error: 'Erro ao remover capítulo salvo' });
    }
});

/**
 * DELETE /api/user/chapters
 * Remove todos os capítulos salvos do usuário
 */
router.delete('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });
        
        await pool.query(
            'DELETE FROM app_biblia.paginasalva WHERE id_usuario = $1',
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao limpar capítulos salvos:', error);
        res.status(500).json({ error: 'Erro ao limpar capítulos salvos' });
    }
});

module.exports = router;

