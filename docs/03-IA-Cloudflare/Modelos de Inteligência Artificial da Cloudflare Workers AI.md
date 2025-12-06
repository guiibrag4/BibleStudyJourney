# Modelos de Inteligência Artificial da Cloudflare Workers AI

O Cloudflare Workers AI é uma plataforma de inferência de modelos de Inteligência Artificial (IA) acessível via API, executada na rede de borda global da Cloudflare. A plataforma permite que desenvolvedores executem modelos de código aberto de forma eficiente e escalável, sem a necessidade de gerenciar infraestrutura de GPU [1].

## 1. O Conceito de Gratuidade e o Neuron

A Cloudflare não oferece modelos de IA intrinsecamente "gratuitos" ou "pagos". Em vez disso, a precificação é baseada no consumo da métrica **Neuron**, e a plataforma oferece uma alocação gratuita diária que se aplica a todos os modelos.

### 1.1. A Métrica Neuron

**Neuron** é a unidade de medida da Cloudflare para quantificar o poder de computação de GPU necessário para realizar uma solicitação de inferência. O custo de uso, após a cota gratuita, é de **$0.011 por 1.000 Neurons** [2].

### 1.2. Camada Gratuita (Free Tier)

Todos os usuários, mesmo no plano Workers Gratuito, recebem uma alocação gratuita de **10.000 Neurons por dia** [2].

> "Nossa alocação gratuita permite que qualquer pessoa utilize um total de **10.000 Neurons por dia sem custo**. Para usar mais de 10.000 Neurons por dia, você precisa se inscrever no plano Workers Pago." [2]

A diferença entre os modelos, portanto, reside na **eficiência**: modelos menores ou otimizados consomem menos Neurons por operação (token, imagem, minuto de áudio) e, consequentemente, permitem um maior volume de uso dentro da cota gratuita diária.

**Exemplo de Eficiência de Modelos de Geração de Texto (LLM):**

| Modelo | Neurons por 1M de Tokens de Entrada | Neurons por 1M de Tokens de Saída | Eficiência Relativa |
| :--- | :--- | :--- | :--- |
| **@cf/ibm-granite/granite-4.0-h-micro** | 1.542 | 10.158 | **Mais eficiente** (menor consumo) |
| **@cf/meta/llama-3.2-1b-instruct** | 2.457 | 18.252 | Alta eficiência |
| **@cf/meta/llama-3.1-8b-instruct-awq** | 11.161 | 24.215 | Média eficiência (otimizado) |
| **@cf/openai/gpt-oss-20b** | 18.182 | 27.273 | Baixa eficiência |
| **@cf/meta/llama-3-8b-instruct** | 25.608 | 75.147 | **Menos eficiente** (maior consumo) |

## 2. Categorias de Modelos Disponíveis

O Workers AI oferece modelos para uma ampla gama de tarefas, permitindo o desenvolvimento de aplicações diversas [1].

| Categoria | Descrição | Exemplos de Modelos |
| :--- | :--- | :--- |
| **Geração de Texto (LLM)** | Modelos de linguagem para conversação, raciocínio, geração de código e tarefas agenticas. | `@cf/meta/llama-3-8b-instruct`, `@cf/openai/gpt-oss-20b`, `@cf/ibm/granite-4.0-h-micro` |
| **Embeddings** | Geração de vetores numéricos que representam o significado de um texto, essenciais para busca semântica e RAG (Retrieval-Augmented Generation). | `@cf/baai/bge-m3` |
| **Geração de Imagem** | Criação de imagens a partir de descrições textuais (Text-to-Image). | `@cf/black-forest-labs/flux-1-schnell` |
| **Visão** | Modelos multimodais para tarefas como Image-to-Text (descrição de imagens). | `@cf/llava-hf/llava-1.5-7b-hf-beta` |
| **Reconhecimento de Fala (ASR)** | Transcrição de áudio para texto. | `@cf/openai/whisper-large-v3-turbo` |
| **Texto para Fala (TTS)** | Síntese de fala a partir de texto. | `@cf/myshell-ai/mmelotts` |
| **Outras** | Inclui tarefas como Classificação de Texto, Tradução, Detecção de Objetos e Sumarização. | `@cf/huggingface/distilbert-sst-2-int8`, `@cf/meta/m2m100-1.2b` |

## 3. Limitações de Uso (Rate Limits)

Além do limite diário de Neurons, a Cloudflare impõe limites de taxa (Rate Limits) por tipo de tarefa, medidos em Requisições por Minuto (RPM), para garantir a estabilidade e o desempenho da plataforma [3].

| Tipo de Tarefa | Limite Padrão (RPM) | Limites Específicos de Modelo (Exemplos) |
| :--- | :--- | :--- |
| **Text Generation (LLM)** | 300 RPM | `@cf/qwen/qwen1.5-14b-chat-awq`: 150 RPM (Mais restrito) |
| **Text Embeddings** | 3000 RPM | `@cf/baai/bge-large-en-v1.5`: 1500 RPM (Mais restrito) |
| **Image Classification, Object Detection** | 3000 RPM | N/A |
| **ASR, Image-to-Text, Translation** | 720 RPM | N/A |
| **Text-to-Image** | 720 RPM | `@cf/runwayml/stable-diffusion-v1-5-img2img`: 1500 RPM (Menos restrito) |

**Observações sobre Limitações:**

*   **Modelos Otimizados:** Modelos com otimizações como **AWQ** (Activation-aware Weight Quantization) ou **FP8** (Floating Point 8-bit) geralmente oferecem melhor desempenho e menor consumo de Neurons, sendo ideais para maximizar a cota gratuita.
*   **Modelos Beta:** Modelos marcados como `beta` podem ter limites de taxa mais baixos e estão sujeitos a alterações.
*   **Reset Diário:** Todos os limites (Neurons e RPM) são redefinidos diariamente à 00:00 UTC [2].

---

## Referências

[1] Cloudflare Developers. Models. Disponível em: https://developers.cloudflare.com/workers-ai/models/
[2] Cloudflare Developers. Pricing. Disponível em: https://developers.cloudflare.com/workers-ai/platform/pricing/
[3] Cloudflare Developers. Limits. Disponível em: https://developers.cloudflare.com/workers-ai/platform/limits/
