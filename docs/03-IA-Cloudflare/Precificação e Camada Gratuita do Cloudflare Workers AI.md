# Precificação e Camada Gratuita do Cloudflare Workers AI

O Workers AI está incluído nos planos Workers **Gratuito** e **Pago**, e é precificado em **$0.011 por 1.000 Neurons**.

## Camada Gratuita (Free Tier)

A Cloudflare oferece uma alocação gratuita de **10.000 Neurons por dia** para **qualquer usuário**, sem custo.

*   **Plano Workers Gratuito:** 10.000 Neurons por dia. Para usar mais, é necessário fazer o upgrade para o Workers Paid.
*   **Plano Workers Pago:** 10.000 Neurons por dia de alocação gratuita, e o uso acima desse limite é cobrado a $0.011 / 1.000 Neurons.

**Observação:** Todos os limites são redefinidos diariamente à 00:00 UTC.

## O que são Neurons?

Neurons é a métrica da Cloudflare para medir as saídas de IA em diferentes modelos, representando o poder de computação de GPU necessário para realizar a solicitação.

## Modelos Gratuitos (Implícito)

Como a alocação gratuita é baseada em Neurons, **todos os modelos** do Workers AI são "gratuitos" até o limite de **10.000 Neurons por dia**. A diferença entre eles está na **quantidade de Neurons que consomem por token/imagem/minuto de áudio**, o que determina quantos usos você pode fazer por dia gratuitamente.

### Exemplo de Consumo de Neurons (LLM - Geração de Texto)

| Modelo | Neurons por 1M de Tokens de Entrada | Neurons por 1M de Tokens de Saída |
| :--- | :--- | :--- |
| **@cf/meta/llama-3.2-1b-instruct** | 2.457 | 18.252 |
| **@cf/meta/llama-3.1-8b-instruct-awq** | 11.161 | 24.215 |
| **@cf/meta/llama-3-8b-instruct** | 25.608 | 75.147 |
| **@cf/openai/gpt-oss-20b** | 18.182 | 27.273 |
| **@cf/ibm-granite/granite-4.0-h-micro** | 1.542 | 10.158 |

**Conclusão sobre Gratuidade:** Não existem modelos intrinsecamente "gratuitos" ou "pagos", mas sim um limite de uso gratuito (10.000 Neurons/dia) que se aplica a todos os modelos. Modelos menores ou otimizados (como o `granite-4.0-h-micro` ou modelos com `awq`) consomem menos Neurons por token e, portanto, permitem um maior número de chamadas dentro do limite gratuito.

**Próxima Etapa:** Coletar a lista completa de modelos e suas categorias para a resposta final, juntamente com as diferenças de consumo de Neurons e as limitações de taxa (Rate Limits).
