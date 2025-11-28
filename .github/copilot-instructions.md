# Bible Study Journey - Instruções para Agentes de IA

## Visão Geral do Projeto

**Bible Study Journey** é uma aplicação híbrida (Android/iOS/Web) de estudo bíblico construída com **Capacitor 7.x**, **Node.js/Express**, e **PostgreSQL (Supabase)**. A arquitetura segue o padrão **SPA (Single Page Application)** no frontend com **API REST** no backend.

### Stack Principal
- **Frontend**: Vanilla JS (ES6+), HTML5/CSS3, Capacitor
- **Backend**: Node.js 18+, Express 5.x, PostgreSQL 15+
- **Storage**: LocalForage (IndexedDB/WebSQL), Capacitor Preferences
- **IA**: Cloudflare Workers AI (modelo Llama 3.1-8b)
- **Hosting**: Oracle Cloud (Always Free Tier) + DuckDNS + Let's Encrypt

---

## Arquitetura e Padrões de Código

### 1. Configuração Centralizada (CRÍTICO)

**Arquivo:** `www/js/config.js`

Toda configuração de URLs de API está centralizada no objeto global `CONFIG`. **NUNCA** crie funções `getApiBaseUrl()` duplicadas.

```javascript
// ✅ CORRETO - Usar CONFIG global
fetch(`${CONFIG.API_URL}/endpoint`, { ... });
fetch(`${CONFIG.BIBLE_API_URL}/verses/nvi/gn/1`);

// ❌ ERRADO - Não criar funções de detecção de ambiente duplicadas
function getApiBaseUrl() { ... } // JÁ EXISTE EM config.js
```

**Ambientes disponíveis:**
- `production`: https://biblestudyjourney.duckdns.org
- `staging`: https://biblestudyjourney-v2.onrender.com
- `development`: http://localhost:3000

**Detecção automática:**
- Apps nativos (Capacitor) → sempre `production`
- `localhost/127.0.0.1` → `development`
- `onrender.com` → `staging`
- `duckdns.org` → `production`

### 2. Autenticação JWT (Padrão Stateless)

**Sistema de dois tokens:**
- `token-jwt`: Access token (expira em 7 dias por padrão)
- Armazenamento: Capacitor Preferences (nativo) ou localStorage (web)

**AuthManager Global (`www/js/auth-guard.js`):**

```javascript
// ✅ SEMPRE usar AuthManager para operações de auth
await AuthManager.saveToken(token);
const token = await AuthManager.getToken();
await AuthManager.isAuthenticated();
await AuthManager.clearAuthData();

// ❌ NUNCA acessar localStorage diretamente para tokens
localStorage.setItem('token-jwt', token); // ERRADO
```

**Middleware Backend (`backend/routes/auth/authMiddleware.js`):**
- Valida token JWT em `req.headers.authorization`
- Adiciona `req.usuario.id_usuario` para rotas protegidas
- Verifica existência do usuário no banco

### 3. Persistência de Dados (Padrão Dual-Storage)

O projeto usa **padrão dual-storage**: API para usuários logados, LocalForage/localStorage para anônimos.

**Implementação de referência:** `www/js/saves-manager.js`

```javascript
// ✅ PADRÃO CORRETO - Verifica login e escolhe storage
async function getData() {
  if (await isUserLoggedIn()) {
    // Buscar da API
    const token = await getAuthToken();
    const response = await fetch(API_ENDPOINT, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  } else {
    // Buscar do localForage
    return await localforage.getItem('storage-key');
  }
}
```

**Ordem de preferência de storage:**
1. **API Backend** (usuários autenticados)
2. **LocalForage** (IndexedDB → WebSQL → localStorage fallback)
3. **localStorage** (apenas para JWT tokens e flags simples)

### 4. Estrutura de Rotas Backend

**Padrão de arquivos:**
```
backend/
├── server.js                 # Entry point + middlewares
├── db.js                     # PostgreSQL pool (configurado)
├── db-migration.js           # Migração automática de schema
└── routes/
    ├── auth/
    │   ├── auth.js           # POST /auth/login, /auth/register
    │   └── authMiddleware.js # verifyToken middleware
    ├── bibleRoutes.js        # GET /api/bible/devotional/*
    ├── progressRoutes.js     # GET/POST/DELETE /api/user/progress/:videoId
    ├── highlightsRoutes.js   # GET/POST/DELETE /api/user/highlights
    ├── chaptersRoutes.js     # GET/POST/DELETE /api/user/chapters
    ├── notesRoutes.js        # GET/POST/DELETE /api/user/notes
    └── statsRoutes.js        # GET /api/user/stats
```

**Padrão de rota protegida:**
```javascript
const verifyToken = require('./auth/authMiddleware');
router.post('/', verifyToken, async (req, res) => {
  const userId = req.usuario.id_usuario; // Extraído do JWT
  // ... lógica da rota
});
```

### 5. Banco de Dados (PostgreSQL/Supabase)

**Schema:** `app_biblia` (veja `backend/model.sql`)

**Tabelas principais:**
- `usuario`: Dados de usuário (JWT, Google OAuth)
- `grifado`: Versículos destacados (highlights)
- `anotacoes`: Notas em versículos
- `paginasalva`: Capítulos salvos
- `ProgressoVideos`: Progresso de vídeos (trilhas de estudo)
- `livros_lidos`: Gamificação (livros completos)
- `devocional_leitura`: Gamificação de devocionais diários

**Padrão de nomenclatura:**
- Tabelas: `snake_case` (ex: `livros_lidos`)
- Colunas: `snake_case` (ex: `id_usuario`, `livro_abreviacao`)
- Abreviações de livros: lowercase (ex: `gn`, `1sm`, `jó`)

**Convenções de referências bíblicas:**
```javascript
// Formato: livro + capítulo + ":" + versículo
// Exemplos: "gn1:1", "1sm15:22", "jó38:4"
const match = reference.match(/^([0-9A-Za-zÀ-ÿ°]+)(\d+):(\d+)$/i);
const [, livro, capitulo, versiculo] = match;
```

### 6. Otimizações de Performance (Já Implementadas)

**NÃO remova estas configurações sem discussão:**

**Backend (`server.js`):**
- ✅ Compressão Gzip (Level 6) - reduz 70% do payload
- ✅ HTTP Cache Headers (assets: 1 ano, HTML: 1h, API: no-cache)
- ✅ Connection Pool otimizado (min: 2, max: 20 conexões)
- ✅ Statement timeout: 10s (previne queries travadas)

**Frontend (`www/js/biblia.js`, `saves-manager.js`):**
- ✅ LocalForage cache com timestamp (30 dias para buscas)
- ✅ Debounce de 500ms em operações de save
- ✅ Lazy loading de versículos

**Pool do Banco (`backend/db.js`):**
```javascript
// ✅ NUNCA alterar sem medir impacto:
const pool = new Pool({
  min: 2,                          // Conexões sempre abertas
  max: 20,                         // Limite de conexões simultâneas
  idleTimeoutMillis: 30000,        // Fecha idle após 30s
  statement_timeout: 10000,        // Timeout de query: 10s
  keepAlive: true                  // Previne timeout de rede
});
```

---

## Workflows Críticos

### Build e Deploy

**Desenvolvimento Local:**
```powershell
# Backend
cd backend
npm install
node server.js              # Porta 3000

# Frontend (servir estáticos)
npx serve www               # Porta 3000 (se backend não estiver rodando)

# Build Android
npx cap sync android
npx cap open android        # Gerar APK no Android Studio
```

**Deploy em Produção (Oracle Cloud):**
```bash
# SSH no servidor
ssh opc@seu-ip-oracle

# Atualizar código
cd /var/www/BibleStudyJourney
git pull origin main

# Reiniciar backend
cd backend
npm install --production
pm2 restart bible-study
```

**Variáveis de Ambiente (CRÍTICO):**

Arquivo: `backend/.env` (NUNCA commitar!)

```env
# Servidor
PORT=3000
NODE_ENV=production

# Database (Supabase)
SUPABASE_DATABASE_URL=postgresql://user:pass@host:5432/db
DB_SSL=true

# JWT
JWT_SECRET=sua-chave-secreta-minimo-32-chars
JWT_EXPIRES_IN=7d

# Cloudflare Workers AI (Devocionais)
CLOUDFLARE_ACCOUNT_ID=seu-account-id
CLOUDFLARE_API_TOKEN=seu-api-token

# YouTube API (Trilhas de estudo)
YOUTUBE_API_KEY=sua-youtube-api-key
```

### Testes

**Atualmente:** Testes manuais (MVP)

**Checklist de teste para novas features:**
1. ✅ Funciona em modo anônimo (sem login)?
2. ✅ Funciona com usuário logado?
3. ✅ Sincroniza corretamente API ↔ LocalStorage?
4. ✅ Funciona offline (Capacitor)?
5. ✅ Responsivo em mobile (Android/iOS)?

---

## Convenções de Código

### JavaScript (Frontend)

**Estilo:**
- ES6+ (arrow functions, async/await, destructuring)
- IIFE para módulos: `(function() { 'use strict'; ... })();`
- Variáveis: `camelCase` (ex: `isUserLoggedIn`)
- Constantes globais: `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)

**Naming patterns:**
- Managers: `*Manager` (ex: `AuthManager`, `SavesManager`)
- Async functions: prefixo `async` obrigatório
- DOM elements: prefixo `$` ou sufixo `El` (ex: `$loginBtn`, `containerEl`)

**Debug logging:**
```javascript
const DEBUG = true;
function debugLog(...args) {
  if (DEBUG) console.log('[module-name]', ...args);
}
```

### Node.js (Backend)

**Estilo:**
- CommonJS (`require`, `module.exports`)
- Async/await para operações de DB/fetch
- Try-catch obrigatório em routes

**Padrão de erro handling:**
```javascript
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.usuario.id_usuario;
    // ... lógica
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Route Name] Erro:', error);
    res.status(500).json({ error: 'Mensagem amigável ao usuário' });
  }
});
```

### SQL

**Sempre usar prepared statements (previne SQL injection):**
```javascript
// ✅ CORRETO
await pool.query(
  'SELECT * FROM app_biblia.usuario WHERE id_usuario = $1',
  [userId]
);

// ❌ ERRADO - SQL Injection vulnerability
await pool.query(`SELECT * FROM usuario WHERE id = ${userId}`);
```

---

## Integrações Externas

### 1. Cloudflare Workers AI (Devocionais)

**Arquivo:** `backend/routes/bibleRoutes.js` (função `generateDevotionalWithAI`)

**Modelo principal:** `@cf/meta/llama-3.1-8b-instruct-fast`

**Estrutura de resposta:**
```json
{
  "estudo": "Análise contextual e histórica...",
  "reflexao": "Interpretação teológica...",
  "aplicacao": "Passos práticos..."
}
```

**Rate limits:** 1000 req/dia (camada gratuita)

### 2. YouTube Data API v3

**Endpoint:** `/api/video-info?videoId=xxx`

**Uso:** Buscar metadados de vídeos das trilhas de estudo

**Quota:** 10.000 unidades/dia (gratuito)

### 3. Bible API (Externa)

**URL:** `https://www.abibliadigital.com.br/api`

**Versões suportadas:**
- `nvi` (Nova Versão Internacional)
- `ara` (Almeida Revista e Atualizada)
- `naa` (Nova Almeida Atualizada)
- `arc` (Almeida Revista e Corrigida)
- `tb` (Tradução Brasileira)

---

## Segurança

### Checklist (Já Implementado)

- ✅ JWT tokens (não sessões)
- ✅ HTTPS obrigatório (Let's Encrypt)
- ✅ CORS configurado (whitelist de origens)
- ✅ Helmet.js (security headers)
- ✅ SQL prepared statements
- ✅ Secrets em `.env` (nunca no código)
- ✅ Row-Level Security no Supabase

### O que NÃO fazer

- ❌ Nunca commitar `.env` no Git
- ❌ Nunca expor JWT secrets no frontend
- ❌ Nunca usar SQL dinâmico sem prepared statements
- ❌ Nunca retornar stack traces em produção

---

## Troubleshooting Comum

### "Token expirado" em produção

**Causa:** JWT_EXPIRES_IN muito curto ou relógio do servidor desajustado

**Solução:** Verificar `backend/.env` → `JWT_EXPIRES_IN=7d`

### LocalForage não funciona no Android

**Causa:** CORS ou erro de IndexedDB

**Solução:** Verificar `capacitor.config.json` → `androidScheme: "https"`

### Migração do banco não roda

**Causa:** Permissões no PostgreSQL ou schema `app_biblia` ausente

**Solução:** Executar manualmente `backend/model.sql` no Supabase SQL Editor

### Compressão Gzip não funciona

**Causa:** Nginx ou proxy reverso já comprimindo

**Solução:** Verificar headers de resposta (`Content-Encoding: gzip`)

---

## Documentação Adicional

- **Arquitetura completa:** `BibleAppDoc/README.md`
- **Otimizações:** `docs/Otimizações/PLANO_OTIMIZACAO_PERFORMANCE.md`
- **Devocional IA:** `docs/Workers IA's cloudflare/IMPLEMENTACAO_DEVOCIONAL_IA_CLOUDFLARE.md`
- **Centralização de config:** `docs/FASE1_CENTRALIZACAO_CONFIG.md`

---

## Regras de Modificação (Leia `.github/instructions/Rules.instructions.md`)

1. **Simplicidade primeiro** - evite over-engineering
2. **Não duplique código** - sempre verificar se já existe implementação similar
3. **Refatore em 200-300 linhas** - divida arquivos grandes
4. **Nunca sobrescreva `.env`** sem confirmar
5. **Evite scripts one-time** - prefira migrações de banco
6. **Sempre responda em português (pt-BR)**

---

**Última atualização:** Novembro 2025  
**Mantenedor:** Guilherme Braga (@guiibrag4)
