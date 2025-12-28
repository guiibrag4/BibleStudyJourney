const express = require('express');
const pool = require('../db.js'); // Importa a conexão com o banco de dados
const router = express.Router();

// Este arquivo define as rotas que começam com /api/user/progress

// Rota para BUSCAR todo o progresso de um usuário
// GET /api/user/progress
router.get('/', async (req, res) => {
    // ALTERADO: Usando req.usuario, conforme definido no seu authMiddleware
    const userId = req.usuario.id_usuario;

    try {
        const { rows } = await pool.query(
            'SELECT video_data FROM bible_study_app.ProgressoVideos WHERE id_usuario = $1',
            [userId]
        );

        const progressObject = rows.reduce((acc, row) => {
            const videoData = row.video_data;
            if (videoData && videoData.id) {
                acc[videoData.id] = videoData;
            }
            return acc;
        }, {});

        res.json({ progress: progressObject });
    } catch (err) {
        console.error('Erro ao buscar progresso:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para SALVAR/ATUALIZAR o progresso de um vídeo específico
// POST /api/user/progress/:videoId
router.post('/:videoId', async (req, res) => {
    // ALTERADO: Usando req.usuario
    const userId = req.usuario.id_usuario;
    const { videoId } = req.params;
    const videoData = req.body;

    if (videoId !== videoData.id) {
        return res.status(400).json({ error: 'ID do vídeo na URL e no corpo não correspondem.' });
    }

    try {
        // Lógica de UPSERT (inserir ou atualizar)
        // Requer uma constraint UNIQUE em (id_usuario, video_id) na sua tabela.
        const query = `
            INSERT INTO bible_study_app.ProgressoVideos (id_usuario, video_id, video_data)
            VALUES ($1, $2, $3)
            ON CONFLICT (id_usuario, video_id) 
            DO UPDATE SET video_data = EXCLUDED.video_data, ultima_atualizacao = NOW()
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [userId, videoId, videoData]);
        
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Erro ao salvar progresso:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para DELETAR o progresso de um vídeo específico
// DELETE /api/user/progress/:videoId
router.delete('/:videoId', async (req, res) => {
    // ALTERADO: Usando req.usuario
    const userId = req.usuario.id_usuario;
    const { videoId } = req.params;

    try {
        await pool.query(
            'DELETE FROM bible_study_app.ProgressoVideos WHERE id_usuario = $1 AND video_id = $2',
            [userId, videoId]
        );
        res.sendStatus(204); // No Content
    } catch (err) {
        console.error('Erro ao deletar progresso:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
