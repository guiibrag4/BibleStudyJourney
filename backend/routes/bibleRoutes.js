/**
 * Rotas /api/bible: texto bíblico (local, sem API externa) e devocional diário.
 * As respostas mantêm o formato da antiga A Bíblia Digital, desativada em 01/08/2026.
 */
const express = require('express');
const bible = require('../services/bible/localBible');
const devotional = require('../services/devotional/devotional');
const streak = require('../services/devotional/streak');
const { VERSIONS } = require('../services/bible/versions');

const router = express.Router();

/** Envolve um handler: erros conhecidos viram 4xx; o resto vira 500 com log. */
const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (error) {
    if (error instanceof bible.BibleError) return res.status(error.status).json({ error: error.message });
    console.error(`[bibleRoutes] ${req.method} ${req.originalUrl}:`, error.message, error.details || '');
    res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
  }
};

const requireUser = (req, res, next) => {
  if (!req.usuario?.id_usuario) return res.status(401).json({ error: 'Usuário não autenticado' });
  next();
};

// ---------------------------------------------------------------------------
// Devocional diário
// ---------------------------------------------------------------------------

router.get('/devotional/daily', async (req, res) => {
  try {
    res.json(await devotional.getDevotional());
  } catch (error) {
    console.error('[Devocional] Erro ao obter devocional:', error.message, error.details || '');
    res.status(502).json({ error: 'Não foi possível gerar o devocional de hoje. Tente novamente mais tarde.' });
  }
});

router.post('/devotional/mark-read', requireUser, handle((req) =>
  streak.markRead(req.usuario.id_usuario, devotional.getDayKey())
));

router.get('/devotional/stats', requireUser, handle((req) =>
  streak.getStats(req.usuario.id_usuario, devotional.getDayKey())
));

// ---------------------------------------------------------------------------
// Texto bíblico
// ---------------------------------------------------------------------------

router.get('/versions', handle(() =>
  VERSIONS.map(({ id, name, language, license, copyright }) => ({ id, name, language, license, copyright }))
));

router.post('/verses/search', (req, res, next) => {
  const { search } = req.body || {};
  if (!search || search.trim().length < 3) {
    return res.status(400).json({ error: 'Termo de busca deve ter no mínimo 3 caracteres' });
  }
  next();
}, handle((req) => bible.search(req.body.version, req.body.search)));

router.get('/verses/:version/random', handle((req) => bible.getRandomVerse(req.params.version)));

router.get('/verses/:version/:book/:chapter', handle((req) =>
  bible.getChapter(req.params.version, req.params.book, req.params.chapter)
));

router.get('/books/:book', handle((req) => bible.getBook(req.params.book)));

module.exports = router;
