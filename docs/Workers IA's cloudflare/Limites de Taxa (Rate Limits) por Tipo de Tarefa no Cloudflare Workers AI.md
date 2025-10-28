# Limites de Taxa (Rate Limits) por Tipo de Tarefa no Cloudflare Workers AI

O Workers AI está em Disponibilidade Geral (GA), e os limites de taxa foram atualizados. As inferências de modelos no modo local usando Wrangler também contam para esses limites. Modelos Beta podem ter limites de taxa mais baixos.

Os limites de taxa padrão por tipo de tarefa são:

| Tipo de Tarefa | Limite Padrão (Requisições por Minuto - RPM) | Limites Específicos de Modelo |
| :--- | :--- | :--- |
| **Automatic Speech Recognition (ASR)** | 720 RPM | Nenhum listado |
| **Image Classification** | 3000 RPM | Nenhum listado |
| **Image-to-Text** | 720 RPM | Nenhum listado |
| **Object Detection** | 3000 RPM | Nenhum listado |
| **Summarization** | 1500 RPM | Nenhum listado |
| **Text Classification** | 2000 RPM | Nenhum listado |
| **Text Embeddings** | 3000 RPM | @cf/baai/bge-large-en-v1.5: 1500 RPM |
| **Text Generation (LLM)** | 300 RPM | @hf/thebloke/mistral-7b-instruct-v0.1-awq: 400 RPM<br>@cf/microsoft/phi-2: 720 RPM<br>@cf/qwen/qwen1.5-0.5b-chat: 1500 RPM<br>@cf/qwen/qwen1.5-1.8b-chat: 720 RPM<br>@cf/qwen/qwen1.5-14b-chat-awq: 150 RPM<br>@cf/tinyllama/tinyllama-1.1b-chat-v1.0: 720 RPM |
| **Text-to-Image** | 720 RPM | @cf/runwayml/stable-diffusion-v1-5-img2img: 1500 RPM |
| **Translation** | 720 RPM | Nenhum listado |

**Nota sobre Gratuidade:** A documentação não especifica quais modelos são *gratuitos* em termos de custo, mas sim quais são os *limites de taxa*. O Workers AI possui um modelo de preços baseado em uso, mas a Cloudflare geralmente oferece uma camada gratuita generosa. Para confirmar a gratuidade, é necessário buscar a página de preços.

**Próxima Etapa:** Buscar a página de preços para confirmar a camada gratuita e as limitações de uso.
