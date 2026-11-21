/**
 * Camada de provedor de IA (Cloudflare Workers AI, endpoint compatível com OpenAI).
 *
 * Tenta os modelos na ordem: CLOUDFLARE_AI_MODEL, DEFAULT_MODEL e depois
 * CLOUDFLARE_AI_FALLBACK_MODELS. Modelos descontinuados (HTTP 410) são pulados até o
 * servidor reiniciar, para que um .env antigo não derrube o devocional.
 * Para trocar de provedor no futuro, basta outro módulo com a mesma função generateJson.
 */
const DEFAULT_MODEL = '@cf/openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 60000;

const retiredModels = new Set();

function configuredModels() {
  const fallbacks = (process.env.CLOUDFLARE_AI_FALLBACK_MODELS || '').split(',');
  // O modelo padrão vem antes dos fallbacks: se o principal do .env cair, usa o melhor disponível.
  const models = [process.env.CLOUDFLARE_AI_MODEL, DEFAULT_MODEL, ...fallbacks]
    .map((m) => (m || '').trim())
    .filter(Boolean);
  return [...new Set(models)].filter((m) => !retiredModels.has(m));
}

async function callModel(model, { system, user, schema, maxTokens }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'resposta', schema, strict: true } },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`Workers AI ${model}: HTTP ${response.status}`);
    error.status = response.status;
    error.details = body.errors || body;
    throw error;
  }

  const content = body.choices?.[0]?.message?.content;
  return typeof content === 'string' ? JSON.parse(content) : content;
}

/**
 * Gera um objeto JSON que segue `schema`. Se `validate` lançar erro, a resposta é
 * descartada e o próximo modelo é tentado. Lança erro se nenhum modelo servir.
 */
async function generateJson({ system, user, schema, maxTokens = 4000, validate = () => {} }) {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_AI_TOKEN) {
    throw new Error('Cloudflare AI não configurado: defina CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_AI_TOKEN.');
  }

  const failures = [];
  for (const model of configuredModels()) {
    try {
      const result = await callModel(model, { system, user, schema, maxTokens });
      validate(result);
      return { result, model };
    } catch (error) {
      if (error.status === 410) {
        retiredModels.add(model);
        console.warn(`[IA] ${model} foi descontinuado pela Cloudflare. Atualize CLOUDFLARE_AI_MODEL no .env.`);
      } else {
        console.error(`[IA] Falha em ${model}:`, error.message, error.details || '');
      }
      failures.push({ model, error: error.message });
    }
  }

  const error = new Error('Nenhum modelo de IA conseguiu responder.');
  error.details = failures;
  throw error;
}

module.exports = { generateJson, DEFAULT_MODEL };
