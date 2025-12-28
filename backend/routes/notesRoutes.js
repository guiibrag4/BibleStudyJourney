// Arquivo: server/routes/notesRoutes.js
// Rotas para gerenciamento de anotações

const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assumindo que você tem um arquivo db.js com a configuração do pool

/**
 * GET /api/user/notes
 * Retorna todas as notas do usuário autenticado
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const result = await pool.query(
            `SELECT 
                id_anotacao,
                livro_abreviacao,
                capitulo,
                versiculo_numero,
                texto_anotacao,
                versao_biblia,
                data_criacao,
                data_modificacao
             FROM bible_study_app.anotacoes
             WHERE id_usuario = $1
             ORDER BY data_modificacao DESC NULLS LAST, data_criacao DESC`,
            [userId]
        );

        const notes = {};
        result.rows.forEach(row => {
            const key = `${row.livro_abreviacao}${row.capitulo}:${row.versiculo_numero}`;
            notes[key] = {
                id: `n${row.id_anotacao}`,
                reference: key,
                version: row.versao_biblia,
                text: row.texto_anotacao,
                date: new Date(row.data_criacao).toLocaleDateString('pt-BR'),
                modified: row.data_modificacao ? new Date(row.data_modificacao).toLocaleDateString('pt-BR') : null
            };
        });

        res.json({ notes });
    } catch (error) {
        console.error('Erro ao buscar notas:', error);
        res.status(500).json({ error: 'Erro ao buscar notas' });
    }
});

router.post('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        const { reference, version, text } = req.body;
        if (!reference || !version || typeof text !== 'string') {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        const match = reference.match(/^([0-9A-Za-zÀ-ÿ]+)(\d+):(\d+)$/i);
        if (!match) {
            return res.status(400).json({ error: 'Formato de referência inválido' });
        }

        const [, livroRaw, capitulo, versiculo] = match;
        const livro = String(livroRaw).toLowerCase();

        const result = await pool.query(
            `INSERT INTO bible_study_app.anotacoes 
                (id_usuario, livro_abreviacao, capitulo, versiculo_numero, texto_anotacao, versao_biblia)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id_usuario, livro_abreviacao, capitulo, versiculo_numero, versao_biblia)
             DO UPDATE SET 
                texto_anotacao = EXCLUDED.texto_anotacao,
                data_modificacao = CURRENT_TIMESTAMP
             RETURNING id_anotacao, data_criacao, data_modificacao`,
            [userId, livro, parseInt(capitulo, 10), parseInt(versiculo, 10), text, version]
        );

        res.json({
            success: true,
            note: {
                id: `n${result.rows[0].id_anotacao}`,
                reference,
                version,
                text,
                date: new Date(result.rows[0].data_criacao).toLocaleDateString('pt-BR'),
                modified: result.rows[0].data_modificacao ? new Date(result.rows[0].data_modificacao).toLocaleDateString('pt-BR') : null
            }
        });
    } catch (error) {
        console.error('Erro ao salvar nota:', error);
        res.status(500).json({ error: 'Erro ao salvar nota' });
    }
});

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
            `DELETE FROM bible_study_app.anotacoes
             WHERE id_usuario = $1 
               AND livro_abreviacao = $2 
               AND capitulo = $3 
               AND versiculo_numero = $4`,
            [userId, livro, parseInt(capitulo, 10), parseInt(versiculo, 10)]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao remover nota:', error);
        res.status(500).json({ error: 'Erro ao remover nota' });
    }
});

router.delete('/', async (req, res) => {
    try {
        const userId = req.id_usuario ?? req.usuario?.id_usuario;
        if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

        await pool.query('DELETE FROM bible_study_app.anotacoes WHERE id_usuario = $1', [userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao limpar notas:', error);
        res.status(500).json({ error: 'Erro ao limpar notas' });
    }
});

module.exports = router;

