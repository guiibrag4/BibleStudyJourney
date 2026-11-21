/**
 * Constância do devocional (streak) e conquistas.
 *
 * Técnica de "ilhas": dias consecutivos têm o mesmo valor de (dia - posição na ordem).
 * A sequência atual é a ilha mais recente, desde que termine hoje ou ontem.
 */
const pool = require('../../db.js');

const READS = 'bible_study_app.devocional_leitura';
const BADGES = 'bible_study_app.devocional_conquistas';

const MILESTONES = [
  { streak: 1, type: 'streak_1', emoji: '🌱', title: 'Primeiro Passo' },
  { streak: 3, type: 'streak_3', emoji: '🌿', title: 'Constante' },
  { streak: 7, type: 'streak_7', emoji: '🔥', title: 'Uma Semana!' },
  { streak: 14, type: 'streak_14', emoji: '⭐', title: 'Duas Semanas!' },
  { streak: 30, type: 'streak_30', emoji: '💎', title: 'Um Mês!' },
  { streak: 100, type: 'streak_100', emoji: '👑', title: 'Centurião da Fé!' },
];

/** { currentStreak, maxStreak } do usuário, considerando `dayKey` como "hoje". */
async function getStreaks(userId, dayKey) {
  const { rows } = await pool.query(
    `WITH ilhas AS (
       SELECT day_key, day_key - (ROW_NUMBER() OVER (ORDER BY day_key))::int AS grupo
       FROM ${READS} WHERE id_usuario = $1
     ), sequencias AS (
       SELECT MAX(day_key) AS fim, COUNT(*)::int AS tamanho FROM ilhas GROUP BY grupo
     )
     SELECT
       COALESCE((SELECT tamanho FROM sequencias WHERE fim >= $2::date - 1 ORDER BY fim DESC LIMIT 1), 0) AS atual,
       COALESCE((SELECT MAX(tamanho) FROM sequencias), 0) AS maior`,
    [userId, dayKey]
  );
  return { currentStreak: rows[0].atual, maxStreak: rows[0].maior };
}

/** Registra as conquistas alcançadas e devolve só as novas. */
async function unlockBadges(userId, currentStreak) {
  const newBadges = [];
  for (const milestone of MILESTONES.filter((m) => currentStreak >= m.streak)) {
    const inserted = await pool.query(
      `INSERT INTO ${BADGES} (id_usuario, tipo_conquista) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING 1`,
      [userId, milestone.type]
    );
    if (inserted.rows.length > 0) newBadges.push(milestone);
  }
  return newBadges;
}

function nextMilestone(currentStreak) {
  const next = MILESTONES.find((m) => m.streak > currentStreak);
  return next ? { streak: next.streak, title: next.title, daysRemaining: next.streak - currentStreak } : null;
}

async function markRead(userId, dayKey) {
  await pool.query(
    `INSERT INTO ${READS} (id_usuario, day_key) VALUES ($1, $2) ON CONFLICT (id_usuario, day_key) DO NOTHING`,
    [userId, dayKey]
  );
  const { currentStreak, maxStreak } = await getStreaks(userId, dayKey);
  const newBadges = await unlockBadges(userId, currentStreak);
  return { success: true, currentStreak, maxStreak, newBadges, nextMilestone: nextMilestone(currentStreak) };
}

async function getStats(userId, dayKey) {
  const { currentStreak, maxStreak } = await getStreaks(userId, dayKey);
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE date_trunc('month', day_key) = date_trunc('month', $2::date))::int AS mes,
       BOOL_OR(day_key = $2::date) AS leu_hoje
     FROM ${READS} WHERE id_usuario = $1`,
    [userId, dayKey]
  );
  const badges = await pool.query(
    `SELECT tipo_conquista, desbloqueado_em FROM ${BADGES} WHERE id_usuario = $1 ORDER BY desbloqueado_em DESC`,
    [userId]
  );
  return {
    currentStreak,
    maxStreak,
    totalRead: rows[0].total,
    monthlyProgress: rows[0].mes,
    readToday: Boolean(rows[0].leu_hoje),
    badges: badges.rows,
  };
}

module.exports = { markRead, getStats, getStreaks };
