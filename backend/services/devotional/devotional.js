/**
 * Devocional diário: uma passagem do plano editorial por dia, estudada pela IA
 * com o texto completo da passagem como contexto, e guardada para todos os usuários.
 */
const pool = require('../../db.js');
const PLAN = require('../../data/plano-devocional');
const { generateJson } = require('../ai/workersAi');
const { getPassage } = require('../bible/localBible');
const { DEFAULT_VERSION } = require('../bible/versions');

const TZ = process.env.DEVOTIONAL_TZ || 'America/Sao_Paulo';
const RESET_HOUR = Number.parseInt(process.env.DEVOTIONAL_RESET_HOUR || '5', 10);
const PLAN_START = Date.UTC(2026, 0, 1);
const TABLE = 'bible_study_app.devocional_diario_global';

const SYSTEM_PROMPT = `Você escreve o devocional diário de um app de estudo bíblico para cristãos brasileiros de várias denominações.
Princípios:
- Exegese antes de aplicação: explique o que o texto significava para os primeiros leitores (autor, destinatários, contexto histórico e literário) antes de aplicar.
- Fidelidade: baseie-se apenas na passagem fornecida. Não invente fatos, datas, nomes ou citações. Quando um detalhe histórico for incerto, diga isso.
- Autoria: só atribua um autor quando o próprio livro ou o título do texto o indicar. Se não houver indicação (como em vários salmos), diga que o autor não é identificado.
- Não cite versículos de fora da passagem e não use números de versículo que não estejam nela.
- Evite tomar partido em controvérsias entre denominações.
- Português do Brasil, linguagem clara e calorosa, sem clichês e sem exageros.`;

// Nomes de campo autoexplicativos: com "estudo", o modelo chegou a devolver só a referência.
const FIELDS = {
  numero_do_versiculo_chave: 'número (inteiro) do versículo da passagem que melhor resume a mensagem',
  contexto_e_significado: 'de 4 a 6 frases sobre o contexto histórico e literário da passagem e o que o autor quis comunicar aos primeiros leitores',
  reflexao_espiritual: 'de 3 a 5 frases sobre o que a passagem revela de Deus e de nós',
  aplicacao_para_hoje: 'de 3 a 4 frases com uma atitude concreta para praticar hoje, em texto corrido (sem listas numeradas)',
  pergunta_para_meditar: 'uma pergunta curta para o leitor meditar ao longo do dia',
};

const SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(
    Object.keys(FIELDS).map((key) => [key, { type: key.startsWith('numero') ? 'integer' : 'string' }])
  ),
  required: Object.keys(FIELDS),
  additionalProperties: false,
};

const FIELD_GUIDE = Object.entries(FIELDS).map(([key, text]) => `- "${key}": ${text}.`).join('\n');

const inFlight = new Map(); // dayKey → Promise, evita gerar o mesmo dia duas vezes ao mesmo tempo

/** Dia do devocional no fuso configurado; antes de RESET_HOUR ainda vale o dia anterior. */
function getDayKey(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const day = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  if (+parts.hour < RESET_HOUR) day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

function addDays(dayKey, days) {
  const day = new Date(`${dayKey}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

function planItemFor(dayKey) {
  const index = Math.floor((Date.parse(`${dayKey}T00:00:00Z`) - PLAN_START) / 86400000);
  const [book, chapter, from, to, theme] = PLAN[((index % PLAN.length) + PLAN.length) % PLAN.length];
  return { book, chapter, from, to, theme };
}

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id_devocional SERIAL PRIMARY KEY,
      day_key DATE NOT NULL UNIQUE,
      verse_text TEXT NOT NULL,
      verse_reference TEXT NOT NULL,
      estudo TEXT NOT NULL,
      reflexao TEXT NOT NULL,
      aplicacao TEXT NOT NULL,
      generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS passage_reference TEXT;
    ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS passage_text TEXT;
    ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS tema TEXT;
    ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS pergunta TEXT;
    ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS versao TEXT;
    ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS modelo_ia TEXT;
  `);
  tableReady = true;
}

/** Formato que o frontend usa (verse/estudo/reflexao/aplicacao) mais os campos novos. */
function toResponse(row, cached) {
  return {
    verse: { text: row.verse_text, reference: row.verse_reference },
    passage: row.passage_reference ? { reference: row.passage_reference, text: row.passage_text } : null,
    tema: row.tema || null,
    estudo: row.estudo,
    reflexao: row.reflexao,
    aplicacao: row.aplicacao,
    pergunta: row.pergunta || null,
    version: row.versao || null,
    cached,
  };
}

async function generate(dayKey) {
  const item = planItemFor(dayKey);
  const passage = getPassage(DEFAULT_VERSION, item.book, item.chapter, item.from, item.to);

  const { result, model } = await generateJson({
    system: SYSTEM_PROMPT,
    user: `Tema do dia: ${item.theme}\nPassagem: ${passage.reference} (Bíblia Livre)\n\n${passage.text}\n\nResponda com um JSON com estes campos:\n${FIELD_GUIDE}`,
    schema: SCHEMA,
    validate: (output) => {
      for (const field of ['contexto_e_significado', 'reflexao_espiritual', 'aplicacao_para_hoje']) {
        if (typeof output?.[field] !== 'string' || output[field].trim().length < 120) {
          throw new Error(`resposta com "${field}" vazio ou curto demais`);
        }
      }
    },
  });

  // O versículo-chave precisa existir na passagem; se não existir, usa o primeiro.
  const keyVerse = passage.verses.find((v) => v.number === result.numero_do_versiculo_chave) || passage.verses[0];
  const bookName = passage.reference.slice(0, passage.reference.lastIndexOf(' '));
  const row = {
    day_key: dayKey,
    verse_text: keyVerse.text,
    verse_reference: `${bookName} ${item.chapter}:${keyVerse.number}`,
    passage_reference: passage.reference,
    passage_text: passage.text,
    tema: item.theme,
    estudo: result.contexto_e_significado.trim(),
    reflexao: result.reflexao_espiritual.trim(),
    aplicacao: result.aplicacao_para_hoje.trim(),
    pergunta: (result.pergunta_para_meditar || '').trim(),
    versao: DEFAULT_VERSION,
    modelo_ia: model,
  };

  const columns = Object.keys(row);
  await pool.query(
    `INSERT INTO ${TABLE} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
     ON CONFLICT (day_key) DO NOTHING`,
    Object.values(row)
  );
  console.log(`[Devocional] ${dayKey}: ${passage.reference} gerado com ${model}`);
  return row;
}

/** Devolve o devocional do dia; gera (uma única vez) se ainda não existir. */
async function getDevotional(dayKey = getDayKey()) {
  await ensureTable();
  const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE day_key = $1`, [dayKey]);
  if (rows.length > 0) return toResponse(rows[0], true);

  if (!inFlight.has(dayKey)) {
    inFlight.set(dayKey, generate(dayKey).finally(() => inFlight.delete(dayKey)));
  }
  await inFlight.get(dayKey);
  const saved = await pool.query(`SELECT * FROM ${TABLE} WHERE day_key = $1`, [dayKey]);
  return toResponse(saved.rows[0], false);
}

/** Gera hoje e amanhã com antecedência, para ninguém esperar a IA ao abrir o app. */
async function pregenerate() {
  const today = getDayKey();
  for (const dayKey of [today, addDays(today, 1)]) {
    try {
      await getDevotional(dayKey);
    } catch (error) {
      console.error(`[Devocional] Falha ao gerar ${dayKey}:`, error.message);
    }
  }
}

function startScheduler() {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  pregenerate();
  setInterval(pregenerate, SIX_HOURS).unref();
}

module.exports = { getDevotional, getDayKey, startScheduler, planItemFor };
