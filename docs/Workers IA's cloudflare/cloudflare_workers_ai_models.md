# Cloudflare Workers AI — Modelos, Quotas Gratuitas e Limitações

> Documento resumido sobre quais IA (modelos) o Cloudflare disponibiliza via Workers AI, diferenças relevantes entre elas e limitações do uso gratuito. Baseado na documentação pública do Cloudflare e no painel de modelos do Workers AI.

---

## 1. Visão Geral

**Workers AI** é a plataforma de inference-as-a-service da Cloudflare que permite executar modelos (LLMs, ASR, embeddings, classificação de imagens, etc.) através da edge network sem gerenciar infraestrutura GPU. O catálogo de modelos é curado e inclui várias implementações open-source populares (por exemplo: Llama, Whisper, modelos de embeddings, classificadores de imagem).

> Observação: a lista de *modelos visíveis e habilitados* pode variar por conta — o painel `https://dash.cloudflare.com/.../ai/workers-ai/models` mostra exatamente quais modelos sua conta pode usar.

---

## 2. O que é "gratuito" (cota / créditos gratuitos)

- **Cota gratuita diária**: a Cloudflare oferece uma alocação gratuita de **10.000 Neurons por dia** para uso de inference. Essa é a principal forma de uso gratuito para Workers AI.
- **Acesso ao catálogo**: o catálogo de modelos (texto, embeddings, ASR, visão) está disponível para contas Free e Paid — usar esses modelos consome a cota de neurônios.
- **Workers Free**: o plano gratuito de Workers também permanece aplicado (limites de requisições, CPU e memória) e pode afetar integrações mais pesadas.

---

## 3. Principais diferenças entre modelos (resumo prático)

- **Modelos de geração de texto (LLMs)**
  - Ex.: Llama family (ex.: Llama 3.x instruction-tuned) — usados para completions, instruções, conversação.
  - Diferenças: tamanho, latência, custo (neurônios consumidos), aptidão para instruções/`instruct`.

- **Modelos de embeddings**
  - Usados para transformar texto em vetores (busca semântica, similaridade).
  - Normalmente consomem menos neurônios por token que modelos de geração, mas variam por arquitetura.

- **Modelos de transcrição / ASR**
  - Ex.: variantes do Whisper — para converter áudio em texto.
  - Consumo e latência maiores (processamento de áudio). Podem ter limitações de tamanho do arquivo ou duração.

- **Modelos de visão (image classification / object detection)**
  - Usados para classificar imagens ou detectar objetos. Limitações comuns: tamanho da imagem, formatos aceitos e throughput.

- **Modelos beta / experimentais**
  - Podem ter limites adicionais, disponibilidade restrita ou comportamento menos estável.

---

## 4. Limitações e pontos de atenção (detalhado)

1. **Quota diária de neurônios (10k/dia)**
   - Se ultrapassar, as requisições são cobradas ou bloqueadas conforme a política de faturamento. Planeje o consumo (tokens, tipo de modelo, chamadas por minuto).

2. **Rate limits por tipo de tarefa**
   - Há limites de requisições por minuto para geração de texto, embeddings, ASR etc. Ex.: limites típicos de centenas de requisições por minuto (variável por modelo).

3. **Limites do plano Workers Free**
   - Requisições diárias, tempo de execução e uso de CPU/memória também limitam integrações que usem Workers + Workers AI.

4. **Tamanho / entrada máxima**
   - Modelos têm limites de tokens (texto) ou duração/tamanho (áudio/imagem). Consultar o modelo específico no painel revela esses detalhes.

5. **Modelos em beta**
   - Podem não ser adequados para produção — provavelmente com menor SLA ou mudanças.

6. **Erros por excesso de uso**
   - Ex.: HTTP 429 (Too Many Requests) ao ultrapassar rate limits; erros de quota quando excede a cota diária.

7. **Logs / observabilidade**
   - O armazenamento e a retenção de logs podem ser limitados no plano gratuito.

---

## 5. Como verificar os modelos disponíveis para sua conta (passo-a-passo)

1. Acesse o painel: `https://dash.cloudflare.com/` e faça login.
2. Selecione o site/account correto (ID da conta aparece no topo). O seu link específico mostra `87cb04a8...` (ID de conta).
3. Vá para **AI → Workers AI → Models** (ou acesse direto o link que você forneceu).
4. No painel de modelos você verá: nome do modelo, tipo (text/embeddings/asr/vision), tamanho, restrições e se é `beta`.
5. Clique em cada modelo para ver detalhes (limite de tokens / pricing / recomendação de uso).

---

## 6. Recomendações práticas

- **Medir consumo em desenvolvimento**: faça testes de latência e consumo para estimar neurônios por chamada (tokens por geração, duração média do áudio etc.).
- **Preferir embeddings leves para busca**: se sua aplicação precisar apenas de busca semântica, use modelos de embeddings — custam menos que gerar texto.
- **Cachear resultados**: para chamadas repetitivas (mesmas perguntas ou trechos de áudio), salve respostas para reduzir consumo.
- **Monitorar erros 429**: implementar retry/backoff e circuit-breaker para respeitar rate limits.
- **Testar modelos em staging**: confirme comportamento e custo antes de entrar em produção.

---

## 7. Recursos e links úteis

- Documentação Workers AI (modelos, limits, pricing): https://developers.cloudflare.com/workers-ai/
- Pricing & quotas: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Limits: https://developers.cloudflare.com/workers-ai/platform/limits/

---

## 8. Próximo passo eu posso fazer por você
- Se quiser, eu posso gerar um `README.md` ou um guia técnico (com exemplos de chamadas HTTP/JS para invocar um modelo específico) diretamente no seu repositório — diga qual modelo do painel você quer usar (nome exato) e eu faço o exemplo pronto.

---

*Documento criado automaticamente com base na documentação pública da Cloudflare e no painel de modelos da sua conta.*

