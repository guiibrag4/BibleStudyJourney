# Modelos do Cloudflare Workers AI

## Modelos de Geração de Texto (LLM)
- **@cf/openai/gpt-oss-120b**: OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-120b is for production, general purpose, high reasoning use-cases.
- **@cf/openai/gpt-oss-20b**: OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-20b is for lower latency, and local or specialized use-cases.
- **@cf/meta/llama-4-scout-17b-16e-instruct**: Llama 4 Scout is a 17 billion parameter model with 16 experts that is natively multimodal. These models leverage a mixture-of-experts architecture to offer industry-leading performance in text and image understanding.
- **@cf/meta/llama-3.3-70b-instruct-fp8-fast**: Llama 3.3 70B quantized to fp8 precision, optimized to be faster.
- **@cf/meta/llama-3.1-8b-instruct-fast**: The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models. The Llama 3.1 instruction tuned text only models are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.
- **@cf/ibm/granite-4.0-h-micro**: Granite 4.0 instruct models deliver strong performance across benchmarks, achieving industry-leading results in key agentic tasks like instruction following and function calling. These efficiencies make the models well-suited for a wide range of use cases like retrieval-augmented generation (RAG), multi-agent workflows, and edge deployments.
- **@cf/mistral/mistral-7b-instruct-v0.2**: Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2. Mistral-7B-v0.2 has the following changes compared to Mistral-7B-v0.1: 32k context window (vs 8k context in v0.1), rope-theta = 1e6, and no Sliding-Window Attention.
- **@cf/google/gemma-7b-it-lora-beta**: Gemma-7B-it-loraBeta is a Gemma-7B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.
- **@cf/google/gemma-2b-it-lora-beta**: Gemma-2b-it-loraBeta is a Gemma-2B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.
- **@cf/meta/llama-2-7b-chat-hf-lora-beta**: Llama-2-7b-chat-hf-loraBeta is a Llama2 base model that Cloudflare dedicated for inference with LoRA adapters. Llama 2 is a collection of pretrained and fine-tuned generative text models ranging in scale from 7 billion to 70 billion parameters. This is the repository for the 7B fine-tuned model, optimized for dialogue use cases and converted for the Hugging Face Transformers format.

## Outras Tarefas (Visto no screenshot)
- Text-to-Speech
- Summarization
- Text Embeddings
- Text Classification
- Object Detection
- Text-to-Image
- Automatic Speech Recognition
- Translation
- Image-to-Text
- Image Classification
- Voice Activity Detection
- Batch

## Modelos de Geração de Texto (LLM) - Continuação
- **@cf/meta/llama-3-8b-instruct**: Generation over generation, Meta Llama 3 demonstrates state-of-the-art performance on a wide range of industry benchmarks and offers new capabilities including improved reasoning and code generation.
- **@cf/openai/whisper-large-v3-turbo**: Whisper is a pre-trained model for automatic speech recognition (ASR) and speech-to-text.
- **@cf/llava-hf/llava-1.5-7b-hf-beta**: LLAVA is an open-source chatbot trained by fine-tuning LLaMA/Vicuna on GPT-generated multimodal instruction-following data.
- **@cf/openai/whisper-tiny-en-beta**: Whisper is a pre-trained model for automatic speech recognition (ASR) and speech-to-text.
- **@cf/mistral/mistral-7b-instruct-v0.2-beta**: The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2.
- **@cf/google/gemma-7b-it-lora-beta**: This is a Gemma-7B base model that Cloudflare dedicates for inference with LoRA adapters.
- **@cf/google/gemma-2b-it-lora-beta**: This is a Gemma-2B base model that Cloudflare dedicates for inference with LoRA adapters.

## Modelos de Embeddings
- **@cf/baai/bge-m3**: Multi-Functionality, Multi-Linguallity, and Multi-Granularity embeddings model.

## Modelos de Visão
- **@cf/llava-hf/llava-1.5-7b-hf-beta**: LLAVA is an open-source chatbot trained by fine-tuning LLaMA/Vicuna on GPT-generated multimodal instruction-following data.

## Modelos de Reconhecimento de Fala
- **@cf/openai/whisper-large-v3-turbo**: Whisper is a pre-trained model for automatic speech recognition (ASR) and speech-to-text.
- **@cf/openai/whisper-tiny-en-beta**: Whisper is a pre-trained model for automatic speech recognition (ASR) and speech-to-text.

## Modelos de Geração de Imagem
- **@cf/black-forest-labs/flux-1-schnell**: FLUX.1 [schnell] is a 12 billion parameter rectified flow transformer capable of generating high-quality images.

## Modelos de Texto para Fala
- **@cf/myshell-ai/mmelotts**: MeloTTS is a high-quality multi-lingual text-to-speech library by MyShell.ai.
