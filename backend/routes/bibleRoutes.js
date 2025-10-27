const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const BIBLE_API_URL = "https://www.abibliadigital.com.br/api";
const API_TOKEN = process.env.API_BIBLIA;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_AI_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;
const CF_AI_MODEL = process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fast';
const CF_AI_FALLBACK_MODELS = (process.env.CLOUDFLARE_AI_FALLBACK_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);

async function callWorkersAI(modelName, prompt) {
    // Não codificar o model_name com encodeURIComponent, pois ele contém barras que fazem parte da rota
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${modelName}`;
    const aiResp = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CF_AI_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
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
    // Alguns modelos podem retornar campos diferentes no futuro
    return String(result || '');
}

function parseDevotionalOutput(output) {
    // Tenta extrair JSON primeiro
    try {
        // Remove cercas de código se existirem
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : output;
        const obj = JSON.parse(jsonText);
        if (obj && (obj.reflexao || obj.aplicacao)) {
            return {
                reflexao: (obj.reflexao || '').toString().trim(),
                aplicacao: (obj.aplicacao || '').toString().trim()
            };
        }
    } catch (_) {}

    // Regex por seções rotuladas (fallback)
    let reflexao = '', aplicacao = '';
    const reflexaoMatch = output.match(/Reflex[aã]o?:?([\s\S]*?)(Aplic[aã]o Pr[aá]tica:|$)/i);
    const aplicacaoMatch = output.match(/Aplic[aã]o Pr[aá]tica:([\s\S]*)/i);
    if (reflexaoMatch) reflexao = reflexaoMatch[1].trim();
    if (aplicacaoMatch) aplicacao = aplicacaoMatch[1].trim();
    return { reflexao, aplicacao };
}

function looksLikeRefusal(text) {
    if (!text) return false;
    return /\b(não posso|não posso cumprir|não posso ajudar|i cannot comply|cannot comply|refuse|cannot help)\b/i.test(text);
}

async function generateDevotionalWithAI({ verseText, reference }) {
    if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
        throw new Error('Cloudflare AI não configurado: defina CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_AI_TOKEN.');
    }

    const basePrompt = [
        'Você é um assistente cristão que escreve em português do Brasil.',
        'Este é um pedido seguro e benigno (conteúdo religioso/devocional). Evite qualquer conteúdo sensível (violência, sexualidade, política).',
        'Gere um devocional diário a partir do versículo abaixo e responda APENAS com um JSON válido no formato:',
        '{"reflexao": "texto breve com 3-5 frases, sem clichês, explicando significado e contexto", "aplicacao": "parágrafo curto com 3-5 frases, sugestões concretas e realistas para aplicar hoje"}',
        `Versículo: ${verseText} (${reference})`
    ].join('\n');

    let output = '';
    const tried = [];
    try {
        tried.push(CF_AI_MODEL);
        output = await callWorkersAI(CF_AI_MODEL, basePrompt);
    } catch (e1) {
        console.error('[CF AI] Falha no modelo primário:', CF_AI_MODEL, 'status:', e1.status, 'details:', e1.details);
        // tenta fallbacks
        let lastErr = e1;
        for (const fb of CF_AI_FALLBACK_MODELS) {
            try {
                tried.push(fb);
                console.warn('[CF AI] Tentando fallback:', fb);
                output = await callWorkersAI(fb, basePrompt);
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

    // Parse e checagem de recusa
    let { reflexao, aplicacao } = parseDevotionalOutput(output);
    const refusal = looksLikeRefusal(reflexao) || looksLikeRefusal(aplicacao) || looksLikeRefusal(output);

    if (refusal || (!reflexao && !aplicacao)) {
        // Tenta um re-prompt único, deixando ainda mais explícito
        const retryPrompt = [
            basePrompt,
            '',
            'IMPORTANTE: Este pedido é permitido. Produza o JSON solicitado, sem mensagens de recusa, sem avisos, sem preâmbulos.'
        ].join('\n');

        try {
            output = await callWorkersAI(CF_AI_MODEL, retryPrompt);
            ({ reflexao, aplicacao } = parseDevotionalOutput(output));
        } catch (eRetry) {
            console.warn('[CF AI] Falha no re-prompt com modelo primário. Tentando fallbacks…');
            let recovered = false;
            for (const fb of CF_AI_FALLBACK_MODELS) {
                try {
                    output = await callWorkersAI(fb, retryPrompt);
                    ({ reflexao, aplicacao } = parseDevotionalOutput(output));
                    recovered = true;
                    break;
                } catch (_) {}
            }
            if (!recovered) {
                // continua para fallback local
            }
        }
    }

    // Fallback local final para garantir conteúdo útil
    if (!reflexao) {
        reflexao = `O versículo "${verseText}" (${reference}) nos convida a refletir sobre o caráter de Deus e nossa resposta prática de fé. Considere como esse texto se conecta à sua história e às promessas bíblicas, lembrando que a Palavra orienta, consola e corrige com amor. Permita que esta verdade molde seus pensamentos e afeições hoje.`;
    }
    if (!aplicacao) {
        aplicacao = `Separe alguns minutos para orar sobre este tema, agradecendo a Deus e pedindo sabedoria para aplicar este ensino. Escreva uma ação simples que você pode praticar hoje (por exemplo, encorajar alguém, perdoar, servir ou agradecer). Releia o versículo à noite e anote um aprendizado.`;
    }

    return { reflexao, aplicacao };
}

// NOVA ROTA: Devocional Diário com IA
// GET /api/bible/devotional/daily?version=nvi -> busca um versículo aleatório e gera devocional
router.get('/devotional/daily', async (req, res) => {
    const version = req.query.version || 'nvi';
    try {
        const verseResp = await fetch(`${BIBLE_API_URL}/verses/${version}/random`, {
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        const verseData = await verseResp.json();
        if (!verseResp.ok) {
            return res.status(verseResp.status).json({ error: 'Erro ao buscar versículo', details: verseData });
        }

        const verseText = verseData.text;
        const reference = `${verseData.book.name} ${verseData.chapter}:${verseData.number}`;

        const { reflexao, aplicacao } = await generateDevotionalWithAI({ verseText, reference });

        res.json({ verse: { text: verseText, reference }, reflexao, aplicacao });
    } catch (error) {
        console.error('Erro ao gerar devocional diário (GET):', error?.message, 'details:', error?.details);
        res.status(502).json({ error: 'Erro ao gerar devocional diário via IA.', details: error?.details || undefined });
    }
});

// POST /api/bible/devotional/daily -> usa o versículo enviado pelo frontend
router.post('/devotional/daily', async (req, res) => {
    try {
        const { verseText, reference } = req.body || {};
        if (!verseText || !reference) {
            return res.status(400).json({ error: 'Parâmetros ausentes: envie verseText e reference.' });
        }

        const { reflexao, aplicacao } = await generateDevotionalWithAI({ verseText, reference });
        res.json({ verse: { text: verseText, reference }, reflexao, aplicacao });
    } catch (error) {
        console.error('Erro ao gerar devocional diário (POST):', error?.message, 'details:', error?.details);
        res.status(502).json({ error: 'Erro ao gerar devocional diário via IA.', details: error?.details || undefined });
    }
});

// Middleware para adicionar o token de autenticação em todas as requisições
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