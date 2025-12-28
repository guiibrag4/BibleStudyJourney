// Arquivo: routes/statsRoutes.js (CORRIGIDO)

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Rota principal para buscar todas as estatísticas do usuário
router.get('/', async (req, res) => {
    // --- CORREÇÃO APLICADA AQUI ---
    const id_usuario = req.id_usuario ?? req.usuario?.id_usuario;
    if (!id_usuario) {
        return res.status(401).json({ error: 'Usuário não autenticado para buscar estatísticas.' });
    }

    try {
        // 1. Calcular horas de vídeo assistidas
        const videoStatsQuery = `
            SELECT COALESCE(SUM((video_data->>'currentTime')::numeric), 0) as total_seconds
            FROM bible_study_app.progressovideos
            WHERE id_usuario = $1;
        `;
        const videoResult = await pool.query(videoStatsQuery, [id_usuario]);
        const totalSeconds = parseFloat(videoResult.rows[0].total_seconds) || 0;
        const totalHours = totalSeconds / 3600;

        // 2. Contar itens salvos
        const savesQueries = [
            pool.query('SELECT COUNT(*) FROM bible_study_app.paginasalva WHERE id_usuario = $1', [id_usuario]),
            pool.query('SELECT COUNT(*) FROM bible_study_app.grifado WHERE id_usuario = $1', [id_usuario]),
            pool.query('SELECT COUNT(*) FROM bible_study_app.anotacoes WHERE id_usuario = $1', [id_usuario])
        ];
        const [capitulos, versiculos, notas] = await Promise.all(savesQueries);
        const totalSaves = parseInt(capitulos.rows[0].count) + parseInt(versiculos.rows[0].count) + parseInt(notas.rows[0].count);

        // 3. Buscar livros lidos
        const readBooksQuery = 'SELECT livro_abreviacao FROM bible_study_app.livros_lidos WHERE id_usuario = $1';
        const readBooksResult = await pool.query(readBooksQuery, [id_usuario]);
        const readBooks = readBooksResult.rows.map(row => row.livro_abreviacao);

        // Montar o objeto de resposta
        const stats = {
            studyHours: totalHours.toFixed(1),
            totalSaves: totalSaves,
            readBooksCount: readBooks.length,
            readBooksList: readBooks
        };

        res.json(stats);

    } catch (err) {
        console.error("Erro ao buscar estatísticas:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor ao processar estatísticas.' });
    }
});

// Rota para marcar um livro como lido
router.post('/read-book/:bookAbbr', async (req, res) => {
    // --- CORREÇÃO APLICADA AQUI ---
    const id_usuario = req.id_usuario ?? req.usuario?.id_usuario;
    if (!id_usuario) {
        return res.status(401).json({ error: 'Usuário não autenticado para marcar livro.' });
    }
    
    const { bookAbbr } = req.params;

    try {
        const query = `
            INSERT INTO bible_study_app.livros_lidos (id_usuario, livro_abreviacao)
            VALUES ($1, $2)
            ON CONFLICT (id_usuario, livro_abreviacao) DO NOTHING;
        `;
        await pool.query(query, [id_usuario, bookAbbr]);
        res.status(201).json({ message: 'Livro marcado como lido.' });
    } catch (err) {
        console.error("Erro ao marcar livro como lido:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor ao salvar livro lido.' });
    }
});

module.exports = router;
