// Arquivo: server/routes/highlightsRoutes.js
// Rotas para gerenciamento de versículos grifados

const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/user/highlights
 * Retorna todos os grifos do usuário autenticado
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const result = await pool.query(
            `SELECT 
                id_grifo,
                livro_abreviacao,
                capitulo,
                versiculo_numero,
                cor_grifo,
                versao_biblia,
                texto_grifado,
                data_grifado
             FROM bible_study_app.grifado
             WHERE id_usuario = $1
             ORDER BY data_grifado DESC`,
            [userId]
        );

        // Converter para o formato esperado pelo frontend
        const highlights = {};
        result.rows.forEach(row => {
            const key = `${row.livro_abreviacao}${row.capitulo}:${row.versiculo_numero}`;
            highlights[key] = {
                id: `v${row.id_grifo}`,
                reference: key,
                version: row.versao_biblia,
                text: row.texto_grifado,
                color: row.cor_grifo,
                date: new Date(row.data_grifado).toLocaleDateString('pt-BR')
            };
        });

        res.json({ highlights });
    } catch (error) {
        console.error('Erro ao buscar grifos:', error);
        res.status(500).json({ error: 'Erro ao buscar grifos' });
    }
});

/**
 * POST /api/user/highlights
 * Salva ou atualiza um grifo
 * Body: { reference, version, text, color }
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const { reference, version, text, color } = req.body;

        if (!reference || !version || !text || !color) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // Aceita abreviações com números e acentos (ex.: 1sm, jó)
        const match = reference.match(/^([0-9A-Za-zÀ-ÿ°]+)(\d+):(\d+)$/i);

        if (!match) {
            return res.status(400).json({ error: 'Formato de referência inválido' });
        }

        const [, livroRaw, capitulo, versiculo] = match;
        const livro = String(livroRaw).toLowerCase();

        const result = await pool.query(
            `INSERT INTO bible_study_app.grifado 
                (id_usuario, livro_abreviacao, capitulo, versiculo_numero, cor_grifo, versao_biblia, texto_grifado)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id_usuario, livro_abreviacao, capitulo, versiculo_numero, versao_biblia, cor_grifo)
             DO UPDATE SET 
                texto_grifado = EXCLUDED.texto_grifado,
                data_grifado = CURRENT_TIMESTAMP
             RETURNING id_grifo, data_grifado`,
            [userId, livro, parseInt(capitulo, 10), parseInt(versiculo, 10), color, version, text]
        );

        res.json({
            success: true,
            highlight: {
                id: `v${result.rows[0].id_grifo}`,
                reference,
                version,
                text,
                color,
                date: new Date(result.rows[0].data_grifado).toLocaleDateString('pt-BR')
            }
        });
    } catch (error) {
        console.error('Erro ao salvar grifo:', error);
        res.status(500).json({ error: 'Erro ao salvar grifo' });
    }
});

/**
 * DELETE /api/user/highlights/:reference
 * Remove um grifo específico
 */
router.delete('/:reference', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const { reference } = req.params;

        const match = reference.match(/^([0-9A-Za-zÀ-ÿ]+)(\d+):(\d+)$/i);
        if (!match) {
            return res.status(400).json({ error: 'Formato de referência inválido' });
        }

        const [, livroRaw, capitulo, versiculo] = match;
        const livro = String(livroRaw).toLowerCase();

        await pool.query(
            `DELETE FROM bible_study_app.grifado
             WHERE id_usuario = $1 
             AND livro_abreviacao = $2 
             AND capitulo = $3 
             AND versiculo_numero = $4`,
            [userId, livro, parseInt(capitulo, 10), parseInt(versiculo, 10)]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao remover grifo:', error);
        res.status(500).json({ error: 'Erro ao remover grifo' });
    }
});

/**
 * DELETE /api/user/highlights
 * Remove todos os grifos do usuário
 */
router.delete('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        await pool.query(
            'DELETE FROM bible_study_app.grifado WHERE id_usuario = $1',
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao limpar grifos:', error);
        res.status(500).json({ error: 'Erro ao limpar grifos' });
    }
});

module.exports = router;

