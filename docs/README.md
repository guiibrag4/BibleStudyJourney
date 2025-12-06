# 📚 Documentação do Bible Study Journey

Bem-vindo à documentação completa do projeto **Bible Study Journey**! Esta pasta contém toda a documentação técnica, planejamento estratégico e guias de desenvolvimento organizados por categoria.

---

## 📁 Estrutura de Pastas

### **01-Autenticacao/**
Documentação sobre sistema de autenticação e autorização.

| Arquivo | Descrição |
|---------|-----------|
| `JWT-Token.md` | Implementação de JWT, refresh tokens e segurança |

**Responsável:** Sistema de login/registro  
**Tecnologias:** JWT, Capacitor Preferences, PostgreSQL

---

### **02-Features/**
Funcionalidades do aplicativo e suas implementações.

| Arquivo | Descrição |
|---------|-----------|
| `CABECALHO_INTELIGENTE.md` | Header dinâmico baseado em contexto |
| `SALVOS_BUSCA_COMPARTILHAR.md` | Sistema de salvos e busca de versículos |
| `TEMPLATES_COMPARTILHAMENTO.md` | Templates para compartilhamento social |
| `TEMPLATES_IDEIAS_FUTURAS.md` | Backlog de ideias para templates |
| `COMO_ADICIONAR_TEMPLATES.md` | Guia para criar novos templates |
| `CORRECAO_BUSCA_FINAL.md` | Correções no sistema de busca |

**Escopo:** UI/UX, compartilhamento, organização de conteúdo

---

### **03-IA-Cloudflare/**
Integração com Cloudflare Workers AI para recursos de IA.

| Arquivo | Descrição |
|---------|-----------|
| `IMPLEMENTACAO_DEVOCIONAL_IA_CLOUDFLARE.md` | Devocionais gerados por IA (Llama 3.1) |
| `AJUSTES_FINAIS_DEVOCIONAL.md` | Refinamentos no gerador de devocionais |
| `GAMIFICACAO_DEVOCIONAL_IMPLEMENTADO.md` | Sistema de recompensas por leitura devocional |
| `cloudflare_workers_ai_models.md` | Catálogo de modelos disponíveis |
| `Modelos de Inteligência Artificial da Cloudflare Workers AI.md` | Comparação de modelos |
| `Modelos do Cloudflare Workers AI.md` | Detalhamento técnico de modelos |
| `Precificação e Camada Gratuita do Cloudflare Workers AI.md` | Custos e limites |
| `Limites de Taxa (Rate Limits) por Tipo de Tarefa no Cloudflare Workers AI.md` | Rate limits |
| `Economia e custo-benefício workersIA.md` | Análise de ROI da IA |

**Modelos usados:** Llama 3.1-8b (atual), GPT-4o-mini (futuro)  
**Limite gratuito:** 1000 requests/dia

---

### **04-Otimizacoes/**
Melhorias de performance, cache e escalabilidade.

| Arquivo | Descrição |
|---------|-----------|
| `PLANO_OTIMIZACAO_PERFORMANCE.md` | Estratégia geral de otimização |
| `ETAPA1_BACKEND_OTIMIZACOES.md` | Otimizações no Node.js/Express |
| `ETAPA1_OTIMIZACOES_BACKEND.md` | Detalhamento de otimizações (duplicata) |
| `ETAPA1_CHECKLIST_VALIDACAO.md` | Checklist de validação pós-otimização |
| `CACHE_GLOBAL_IMPLEMENTADO.md` | Sistema de cache com LocalForage |

**Resultados:** 
- 70% redução de payload (Gzip)
- 80% redução de chamadas de API (cache)
- Tempo de carregamento: 2s → 0.8s

---

### **05-Testes/**
Guias de testes manuais e automatizados (MVP).

| Arquivo | Descrição |
|---------|-----------|
| `TESTE_BUSCA_VERSICULOS.md` | Casos de teste para busca |
| `TESTE_TEMPLATES_GUIA.md` | Casos de teste para templates |

**Status:** Testes manuais (MVP) - testes automatizados planejados

---

### **06-Configuracao/**
Configuração de ambiente, build e deploy.

| Arquivo | Descrição |
|---------|-----------|
| `FASE1_CENTRALIZACAO_CONFIG.md` | Centralização de config em `config.js` |
| `GUIA_TESTES_CONFIG.md` | Como testar diferentes ambientes |

**Ambientes:**
- **Development:** `http://localhost:3000`
- **Staging:** `https://biblestudyjourney-v2.onrender.com`
- **Production:** `https://biblestudyjourney.duckdns.org`

---

### **07-Planejamento/**
Roadmaps, estratégias de negócio e planejamento de features.

| Arquivo | Descrição |
|---------|-----------|
| `PROFUNDIDADE_ESTUDO_BIBLICO.md` | **[NOVO]** Estratégia para adicionar profundidade ao app |
| `Custo e estratégia de escalabilidade.md` | Análise de custos e escalabilidade |

**Próximos passos:**
- Fase 1: Ferramentas de exegese (6 semanas)
- Fase 2: Recursos acadêmicos (8 semanas)
- Fase 3: IA contextual (4 semanas)

---

### **08-Arquitetura/**
Arquitetura do sistema, diagramas e documentação técnica.

| Arquivo | Descrição |
|---------|-----------|
| `migracao-projeto.md` | Migração de projeto legado |
| `README.md` | Arquitetura completa (cópia do BibleAppDoc) |

**Stack:**
- Frontend: Vanilla JS + Capacitor 7.x
- Backend: Node.js 18 + Express 5.x
- Database: PostgreSQL 15 (Supabase)
- Hosting: Oracle Cloud (Always Free)

---

## 🚀 Começando

### Para Desenvolvedores
1. Leia primeiro: `08-Arquitetura/README.md`
2. Configure ambiente: `06-Configuracao/FASE1_CENTRALIZACAO_CONFIG.md`
3. Entenda autenticação: `01-Autenticacao/JWT-Token.md`

### Para Product Managers
1. Roadmap: `07-Planejamento/PROFUNDIDADE_ESTUDO_BIBLICO.md`
2. Features atuais: `02-Features/`
3. Custos: `07-Planejamento/Custo e estratégia de escalabilidade.md`

### Para Arquitetos
1. Arquitetura: `08-Arquitetura/README.md`
2. Otimizações: `04-Otimizacoes/PLANO_OTIMIZACAO_PERFORMANCE.md`
3. IA: `03-IA-Cloudflare/IMPLEMENTACAO_DEVOCIONAL_IA_CLOUDFLARE.md`

---

## 📊 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| **Linhas de código** | ~15.000 (estimado) |
| **Arquivos de código** | 30+ |
| **Endpoints de API** | 20+ |
| **Tabelas no banco** | 10 |
| **Modelos de IA** | 2 (Llama 3.1, futuro GPT-4o-mini) |
| **Ambientes** | 3 (dev, staging, prod) |

---

## 🔗 Links Úteis

- **Repositório GitHub:** [guiibrag4/BibleStudyJourney](https://github.com/guiibrag4/BibleStudyJourney)
- **API de Bíblia:** [A Bíblia Digital](https://www.abibliadigital.com.br/api)
- **Cloudflare Workers AI:** [Documentação](https://developers.cloudflare.com/workers-ai/)
- **Supabase (DB):** [Dashboard](https://supabase.com/dashboard)

---

## 📝 Contribuindo com a Documentação

### Convenções de Nomenclatura
- Use `MAIUSCULO_COM_UNDERLINE.md` para documentos de implementação
- Use `PascalCase.md` para documentos de planejamento
- Use prefixos numéricos em pastas (`01-`, `02-`, etc.) para ordenação

### Estrutura de Documento
```markdown
# Título do Documento

## Contexto
Por que este documento existe?

## Objetivo
O que ele resolve/documenta?

## Implementação
Como foi/será feito?

## Resultados
Métricas ou outcomes

## Próximos Passos
O que vem depois?
```

---

## 📞 Contato

**Desenvolvedor:** Guilherme Braga (@guiibrag4)  
**Projeto:** Bible Study Journey (TCC)  
**Última atualização:** Dezembro 2025

---

**Nota:** Esta documentação é atualizada continuamente. Para a versão mais recente, verifique o repositório Git.
