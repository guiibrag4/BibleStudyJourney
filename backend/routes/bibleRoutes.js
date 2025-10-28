const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const pool = require('../db.js');

const BIBLE_API_URL = "https://www.abibliadigital.com.br/api";
const API_TOKEN = process.env.API_BIBLIA;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;
const CF_AI_MODEL = process.env.CLOUDFLARE_AI_MODEL;
const CF_AI_FALLBACK_MODELS = (process.env.CLOUDFLARE_AI_FALLBACK_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);

const DEVOTIONAL_TZ = process.env.DEVOTIONAL_TZ || 'America/Sao_Paulo';
const DEVOTIONAL_RESET_HOUR = parseInt(process.env.DEVOTIONAL_RESET_HOUR || '5', 10);

let devotionalTableReady = false;
async function ensureDevotionalTable() {
    if (devotionalTableReady) return;
    const sql = `
    CREATE TABLE IF NOT EXISTS app_biblia.devocional_diario (
        id_devocional SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES app_biblia.usuario(id_usuario) ON DELETE CASCADE,
        day_key DATE NOT NULL,
        verse_text TEXT NOT NULL,
        verse_reference TEXT NOT NULL,
        estudo TEXT NOT NULL,
        reflexao TEXT NOT NULL,
        aplicacao TEXT NOT NULL,
        generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (id_usuario, day_key)
    );`;
    await pool.query(sql);
    devotionalTableReady = true;
}

function getDevotionalDayKey(tz, resetHour) {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
    let y = parseInt(parts.year, 10);
    let m = parseInt(parts.month, 10);
    let d = parseInt(parts.day, 10);
    const hour = parseInt(parts.hour, 10);

    if (hour < resetHour) {
        const dateLocal = new Date(Date.UTC(y, m - 1, d));
        dateLocal.setUTCDate(dateLocal.getUTCDate() - 1);
        y = dateLocal.getUTCFullYear();
        m = dateLocal.getUTCMonth() + 1;
        d = dateLocal.getUTCDate();
    }

    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
}

async function callWorkersAI(modelName, prompt) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${modelName}`;
    const aiResp = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CF_AI_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            prompt,
            max_tokens: 1024  // Aumenta limite de tokens para respostas completas
        })
    });
    let aiJson;
    try {
        aiJson = await aiResp.json();
    } catch (e) {
        aiJson = { parse_error: true, message: 'Não foi possível parsear JSON da Cloudflare.' };
    }

    if (!aiResp.ok || aiJson.success === false) {
        const err = new Error(`Cloudflare AI erro HTTP ${aiResp.status}`);
        err.status = aiResp.status;
        err.details = aiJson?.errors || aiJson;
        throw err;
    }

    const result = aiJson.result;
    if (typeof result === 'string') return result;
    if (typeof result?.response === 'string') return result.response;
    return String(result || '');
}

function parseDevotionalOutput(output) {
    console.log('[DEBUG] Output bruto da IA (tamanho total):', output.length, 'chars');
    console.log('[DEBUG] Primeiros 600 chars:', output.substring(0, 600));
    console.log('[DEBUG] Últimos 200 chars:', output.substring(Math.max(0, output.length - 200)));
    
    // Helper para extrair texto de objetos aninhados
    function extractText(value) {
        if (!value) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'object' && value !== null) {
            // Se for objeto, concatena todos os valores que são strings
            return Object.values(value)
                .filter(v => typeof v === 'string')
                .join(' ')
                .trim();
        }
        return String(value).trim();
    }
    
    // Tenta extrair JSON primeiro - busca o último bloco JSON mais completo
    try {
        // Remove cercas de código markdown se existirem
        let cleaned = output.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
        
        // Tenta reparar JSON incompleto adicionando fechamento se necessário
        if (cleaned.includes('{') && !cleaned.trim().endsWith('}')) {
            // Conta quantas chaves abertas precisam ser fechadas
            const openBraces = (cleaned.match(/\{/g) || []).length;
            const closeBraces = (cleaned.match(/\}/g) || []).length;
            const missingBraces = openBraces - closeBraces;
            
            // Fecha strings abertas se necessário
            const lastQuote = cleaned.lastIndexOf('"');
            const quoteCount = (cleaned.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0 && lastQuote > -1) {
                cleaned += '"';
            }
            
            // Adiciona chaves faltantes
            for (let i = 0; i < missingBraces; i++) {
                cleaned += '}';
            }
            console.log('[DEBUG] JSON reparado, adicionadas', missingBraces, 'chaves');
        }
        
        // Busca objetos JSON válidos
        const jsonMatches = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
            // Tenta parsear do último para o primeiro (o mais completo geralmente é o último)
            for (let i = jsonMatches.length - 1; i >= 0; i--) {
                try {
                    const obj = JSON.parse(jsonMatches[i]);
                    if (obj && (obj.estudo || obj.reflexao || obj.aplicacao)) {
                        console.log('[DEBUG] JSON parseado. Estrutura:', {
                            estudoType: typeof obj.estudo,
                            reflexaoType: typeof obj.reflexao,
                            aplicacaoType: typeof obj.aplicacao
                        });
                        
                        // Extrai texto, lidando com objetos aninhados
                        const estudo = extractText(obj.estudo);
                        const reflexao = extractText(obj.reflexao);
                        const aplicacao = extractText(obj.aplicacao);
                        
                        console.log('[DEBUG] Texto extraído:', {
                            estudoLen: estudo.length,
                            reflexaoLen: reflexao.length,
                            aplicacaoLen: aplicacao.length
                        });
                        
                        return { estudo, reflexao, aplicacao };
                    }
                } catch (e) {
                    console.warn('[DEBUG] Falha ao parsear match', i, ':', e.message);
                    continue;
                }
            }
        }
    } catch (e) {
        console.warn('[DEBUG] Falha geral no parsing de JSON:', e.message);
    }

    // Fallback: parsing por regex
    console.log('[DEBUG] Tentando parsing por regex...');
    let estudo = '', reflexao = '', aplicacao = '';
    
    const estudoMatch = output.match(/(?:estudo|exeg[eé]tic[oa]?)[:\s]*([^\n]*(?:\n(?!reflex|aplic)[^\n]*)*)/i);
    const reflexaoMatch = output.match(/(?:reflex[aã]o?)[:\s]*([^\n]*(?:\n(?!aplic)[^\n]*)*)/i);
    const aplicacaoMatch = output.match(/(?:aplic[aã]o?\s*pr[aá]tic[oa]?)[:\s]*([^\n]*(?:\n(?!$)[^\n]*)*)/i);
    
    if (estudoMatch) estudo = estudoMatch[1].trim();
    if (reflexaoMatch) reflexao = reflexaoMatch[1].trim();
    if (aplicacaoMatch) aplicacao = aplicacaoMatch[1].trim();
    
    console.log('[DEBUG] Resultado do parsing:', { 
        estudoLen: estudo.length, 
        reflexaoLen: reflexao.length, 
        aplicacaoLen: aplicacao.length 
    });
    
    return { estudo, reflexao, aplicacao };
}

function looksLikeRefusal(text) {
    if (!text) return false;
    return /\b(não posso|não posso cumprir|não posso ajudar|i cannot comply|cannot comply|refuse|cannot help)\b/i.test(text);
}

async function generateDevotionalWithAI({ verseText, reference }) {
    if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
        throw new Error('Cloudflare AI não configurado: defina CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_AI_TOKEN.');
    }

    // Prompt mais conciso para caber na resposta
    const basePrompt = `Analise este versículo bíblico e retorne APENAS um JSON válido:

"${verseText}" (${reference})

JSON (sem markdown):
{
  "estudo": "3-4 frases: contexto histórico/cultural e o que o autor queria comunicar",
  "reflexao": "3-4 frases: significado teológico e espiritual",
  "aplicacao": "3-4 frases: como aplicar hoje de forma prática"
}`;

    let output = '';
    const tried = [];
    try {
        tried.push(CF_AI_MODEL);
        output = await callWorkersAI(CF_AI_MODEL, basePrompt);
        console.log('[CF AI] Resposta do modelo primário (tamanho:', output.length, 'chars)');
        console.log('[CF AI] Primeiros 1000 chars:', output.substring(0, 1000));
    } catch (e1) {
        console.error('[CF AI] Falha no modelo primário:', CF_AI_MODEL, 'status:', e1.status, 'details:', e1.details);
        let lastErr = e1;
        for (const fb of CF_AI_FALLBACK_MODELS) {
            try {
                tried.push(fb);
                console.warn('[CF AI] Tentando fallback:', fb);
                output = await callWorkersAI(fb, basePrompt);
                console.log('[CF AI] Resposta do fallback (tamanho:', output.length, 'chars)');
                lastErr = null;
                break;
            } catch (eFb) {
                console.error('[CF AI] Falha no fallback', fb, 'status:', eFb.status, 'details:', eFb.details);
                lastErr = eFb;
            }
        }
        if (lastErr) {
            const err = new Error('Falha ao executar modelo de IA na Cloudflare (todos os modelos tentados).');
            err.details = { tried, last_error: lastErr.details };
            throw err;
        }
    }

    let { estudo, reflexao, aplicacao } = parseDevotionalOutput(output);
    const refusal = looksLikeRefusal(estudo) || looksLikeRefusal(reflexao) || looksLikeRefusal(aplicacao) || looksLikeRefusal(output);

    if (refusal || (!estudo && !reflexao && !aplicacao)) {
        console.warn('[CF AI] Detectada recusa ou campos vazios. Tentando re-prompt...');
        const retryPrompt = `${basePrompt}

IMPORTANTE: Responda apenas com o JSON completo.`;

        try {
            output = await callWorkersAI(CF_AI_MODEL, retryPrompt);
            console.log('[CF AI] Resposta do re-prompt (tamanho:', output.length, 'chars)');
            ({ estudo, reflexao, aplicacao } = parseDevotionalOutput(output));
        } catch (eRetry) {
            console.warn('[CF AI] Falha no re-prompt com modelo primário. Tentando fallbacks…');
            let recovered = false;
            for (const fb of CF_AI_FALLBACK_MODELS) {
                try {
                    output = await callWorkersAI(fb, retryPrompt);
                    console.log('[CF AI] Resposta do fallback re-prompt (tamanho:', output.length, 'chars)');
                    ({ estudo, reflexao, aplicacao } = parseDevotionalOutput(output));
                    recovered = true;
                    break;
                } catch (_) {}
            }
            if (!recovered) {
                console.warn('[CF AI] Nenhum modelo conseguiu gerar conteúdo. Usando fallbacks locais.');
            }
        }
    }

    // Fallback local final
    if (!estudo) {
        console.warn('[CF AI] Campo "estudo" vazio. Usando fallback local.');
        estudo = `Este versículo (${reference}) revela aspectos importantes sobre Deus e seu relacionamento com a humanidade. Considere o contexto histórico: quem escreveu, para quem, e por quê. O autor busca comunicar verdades eternas através de situações específicas de sua época.`;
    }
    if (!reflexao) {
        console.warn('[CF AI] Campo "reflexao" vazio. Usando fallback local.');
        reflexao = `Este texto nos convida a refletir sobre o caráter de Deus e nossa resposta prática de fé. A Palavra orienta, consola e corrige com amor. Permita que esta verdade molde seus pensamentos e afeições hoje.`;
    }
    if (!aplicacao) {
        console.warn('[CF AI] Campo "aplicacao" vazio. Usando fallback local.');
        aplicacao = `Separe alguns minutos para orar sobre este tema. Escreva uma ação simples que você pode praticar hoje (encorajar alguém, perdoar, servir ou agradecer). Releia o versículo à noite e anote um aprendizado.`;
    }

    console.log('[CF AI] Resultado final:', {
        estudoLen: estudo.length,
        reflexaoLen: reflexao.length,
        aplicacaoLen: aplicacao.length
    });

    return { estudo, reflexao, aplicacao };
}

// ROTAS
router.get('/devotional/daily', async (req, res) => {
    const version = req.query.version || 'nvi';
    try {
        await ensureDevotionalTable();
        const userId = req.usuario?.id_usuario;
        const dayKey = getDevotionalDayKey(DEVOTIONAL_TZ, DEVOTIONAL_RESET_HOUR);

        if (userId) {
            const { rows } = await pool.query(
                'SELECT verse_text, verse_reference, estudo, reflexao, aplicacao FROM app_biblia.devocional_diario WHERE id_usuario=$1 AND day_key=$2',
                [userId, dayKey]
            );
            if (rows.length > 0) {
                const r = rows[0];
                return res.json({ verse: { text: r.verse_text, reference: r.verse_reference }, estudo: r.estudo, reflexao: r.reflexao, aplicacao: r.aplicacao, cached: true });
            }
        }

        const verseResp = await fetch(`${BIBLE_API_URL}/verses/${version}/random`, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const verseData = await verseResp.json();
        if (!verseResp.ok) {
            return res.status(verseResp.status).json({ error: 'Erro ao buscar versículo', details: verseData });
        }

        const verseText = verseData.text;
        const reference = `${verseData.book.name} ${verseData.chapter}:${verseData.number}`;

        const { estudo, reflexao, aplicacao } = await generateDevotionalWithAI({ verseText, reference });
        
        if (userId) {
            try {
                await pool.query(
                    `INSERT INTO app_biblia.devocional_diario (id_usuario, day_key, verse_text, verse_reference, estudo, reflexao, aplicacao)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (id_usuario, day_key) DO UPDATE SET verse_text=EXCLUDED.verse_text, verse_reference=EXCLUDED.verse_reference, estudo=EXCLUDED.estudo, reflexao=EXCLUDED.reflexao, aplicacao=EXCLUDED.aplicacao`,
                    [userId, dayKey, verseText, reference, estudo, reflexao, aplicacao]
                );
            } catch (e) {
                console.warn('[Devocional] Falha ao gravar cache:', e?.message);
            }
        }
        res.json({ verse: { text: verseText, reference }, estudo, reflexao, aplicacao, cached: false });
    } catch (error) {
        console.error('Erro ao gerar devocional diário (GET):', error?.message, 'details:', error?.details);
        res.status(502).json({ error: 'Erro ao gerar devocional diário via IA.', details: error?.details || undefined });
    }
});

router.post('/devotional/daily', async (req, res) => {
    try {
        await ensureDevotionalTable();
        const { verseText, reference } = req.body || {};
        if (!verseText || !reference) {
            return res.status(400).json({ error: 'Parâmetros ausentes: envie verseText e reference.' });
        }

        const userId = req.usuario?.id_usuario;
        const dayKey = getDevotionalDayKey(DEVOTIONAL_TZ, DEVOTIONAL_RESET_HOUR);

        if (userId) {
            const { rows } = await pool.query(
                'SELECT verse_text, verse_reference, estudo, reflexao, aplicacao FROM app_biblia.devocional_diario WHERE id_usuario=$1 AND day_key=$2',
                [userId, dayKey]
            );
            if (rows.length > 0) {
                const r = rows[0];
                return res.json({ verse: { text: r.verse_text, reference: r.verse_reference }, estudo: r.estudo, reflexao: r.reflexao, aplicacao: r.aplicacao, cached: true });
            }
        }

        const { estudo, reflexao, aplicacao } = await generateDevotionalWithAI({ verseText, reference });

        if (userId) {
            try {
                await pool.query(
                    `INSERT INTO app_biblia.devocional_diario (id_usuario, day_key, verse_text, verse_reference, estudo, reflexao, aplicacao)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (id_usuario, day_key) DO UPDATE SET verse_text=EXCLUDED.verse_text, verse_reference=EXCLUDED.verse_reference, estudo=EXCLUDED.estudo, reflexao=EXCLUDED.reflexao, aplicacao=EXCLUDED.aplicacao`,
                    [userId, dayKey, verseText, reference, estudo, reflexao, aplicacao]
                );
            } catch (e) {
                console.warn('[Devocional] Falha ao gravar cache:', e?.message);
            }
        }

        res.json({ verse: { text: verseText, reference }, estudo, reflexao, aplicacao, cached: false });
    } catch (error) {
        console.error('Erro ao gerar devocional diário (POST):', error?.message, 'details:', error?.details);
        res.status(502).json({ error: 'Erro ao gerar devocional diário via IA.', details: error?.details || undefined });
    }
});

router.use((req, res, next) => {
    if (!API_TOKEN) {
        console.error ("ERRO: A variável de ambiente API_BIBLIA não está configurada no servidor.");
        return res.status(500).json({ error: "Configuração do servidor incorreta." });
    }
    next();
});

router.get('/verses/:version/random', async (req,res) => {
    const { version } = req.params;
    const url = `${BIBLE_API_URL}/verses/${version}/random`;

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
        console.error('Erro ao buscar versículo aleatório:', error);
        res.status(500).json({ error: 'Erro interno ao contatar o serviço da Bíblia.' });
    }
});

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
