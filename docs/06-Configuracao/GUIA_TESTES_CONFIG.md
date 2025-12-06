# 🧪 Guia de Testes - Configuração Centralizada

## 📋 Índice
1. [Teste Local (Localhost)](#teste-local-localhost)
2. [Teste no Render (Staging)](#teste-no-render-staging)
3. [Diagnóstico de Problemas](#diagnóstico-de-problemas)
4. [Troca de Ambiente](#troca-de-ambiente)

---

## 1. Teste Local (Localhost)

### Passo 1: Iniciar o Servidor

```bash
# Opção 1: Com npm
npm start

# Opção 2: Diretamente com node
node backend/server.js
```

Você deve ver:
```
🚀 Servidor Bible Study Journey iniciado com sucesso!
📍 URL Local:  http://localhost:3000
```

### Passo 2: Abrir Página de Teste

Abra no navegador:
```
http://localhost:3000/test-config.html
```

Esta página vai testar automaticamente:
- ✅ Se o `config.js` foi carregado
- ✅ Se o objeto `CONFIG` está definido
- ✅ Se a função `CONFIG.debug()` existe
- ✅ Se todas as propriedades estão corretas
- ✅ Se o ambiente foi detectado corretamente

### Passo 3: Testar Páginas Principais

1. **Login:** http://localhost:3000/html/login2.html
   - Abra DevTools (F12) → Console
   - Deve aparecer: `✅ [CONFIG] Configuração inicializada com sucesso!`
   - Digite no console: `CONFIG.BASE_URL`
   - Deve retornar: `"http://localhost:3000"`

2. **Home:** http://localhost:3000/html/home2.html
   - Verifique no console
   - Digite: `CONFIG.BIBLE_API_URL`
   - Deve retornar: `"http://localhost:3000/api/bible"`

3. **Bíblia:** http://localhost:3000/html/biblia.html
   - Verifique no console
   - Tente navegar, selecionar versículos
   - Tudo deve funcionar normalmente

### Passo 4: Teste Completo no Console

No console do navegador (F12), execute:

```javascript
// 1. Verificar se CONFIG existe
console.log('CONFIG existe?', typeof CONFIG !== 'undefined');

// 2. Verificar propriedades principais
console.log('BASE_URL:', CONFIG.BASE_URL);
console.log('BIBLE_API_URL:', CONFIG.BIBLE_API_URL);
console.log('AUTH_URL:', CONFIG.AUTH_URL);

// 3. Verificar ambiente
console.log('Ambiente:', CONFIG.ENVIRONMENT);
console.log('É desenvolvimento?', CONFIG.IS_DEVELOPMENT);

// 4. Testar debug (se disponível)
if (typeof CONFIG.debug === 'function') {
    CONFIG.debug();
} else {
    console.error('CONFIG.debug não é uma função!');
}
```

### Problemas Comuns (Localhost)

#### ❌ Erro: "CONFIG is not defined"
**Causa:** O arquivo `config.js` não foi carregado

**Solução:**
1. Verificar se o arquivo existe: `www/js/config.js`
2. Verificar se o HTML tem: `<script src="../js/config.js"></script>`
3. Limpar cache do navegador (Ctrl+Shift+Del)
4. Recarregar página com Ctrl+F5

#### ❌ Erro: "CONFIG.debug is not a function"
**Causa:** O `config.js` foi carregado mas está incompleto

**Solução:**
1. Abrir `www/js/config.js`
2. Verificar se a linha `debug() { ... }` existe no objeto CONFIG
3. Verificar se o arquivo não foi truncado
4. Comparar com a versão do repositório

---

## 2. Teste no Render (Staging)

### Passo 1: Configurar para Staging

Edite `www/js/config.js`:

```javascript
// Linha 26 (aproximadamente):
const FORCE_ENVIRONMENT = 'staging'; // ← Mude de 'auto' para 'staging'
```

**OU** mantenha `'auto'` e o Render será detectado automaticamente pelo hostname.

### Passo 2: Fazer Deploy no Render

#### Opção A: Deploy via Git (Recomendado)

```bash
# 1. Commit das mudanças
git add .
git commit -m "feat: adicionar configuração centralizada de API"

# 2. Push para o repositório
git push origin worker/ai-rules-testing

# 3. Render vai detectar automaticamente e fazer deploy
```

#### Opção B: Deploy Manual

No dashboard do Render:
1. Vá em: https://dashboard.render.com
2. Selecione seu serviço: `biblestudyjourney-v2`
3. Clique em "Manual Deploy" → "Deploy latest commit"
4. Aguarde o build completar (~2-5 minutos)

### Passo 3: Testar no Render

Abra no navegador:
```
https://biblestudyjourney-v2.onrender.com/test-config.html
```

**Resultado esperado:**
```
✅ Objeto CONFIG encontrado!
✅ Função CONFIG.debug() encontrada!
📊 Propriedades do CONFIG:
   - BASE_URL: https://biblestudyjourney-v2.onrender.com
   - ENVIRONMENT: auto-detected
   - IS_STAGING: true
```

### Passo 4: Testar Login e Funcionalidades

1. **Login:** https://biblestudyjourney-v2.onrender.com/html/login2.html
   - Faça login com suas credenciais
   - Verifique no console (F12):
     ```javascript
     CONFIG.BASE_URL
     // Deve retornar: "https://biblestudyjourney-v2.onrender.com"
     ```

2. **Devocional:** https://biblestudyjourney-v2.onrender.com/html/home2.html
   - Verifique se o devocional carrega
   - No console:
     ```javascript
     CONFIG.BIBLE_API_URL
     // Deve retornar: "https://biblestudyjourney-v2.onrender.com/api/bible"
     ```

3. **Leitura da Bíblia:** https://biblestudyjourney-v2.onrender.com/html/biblia.html
   - Teste navegação entre livros/capítulos
   - Teste grifar versículos
   - Verifique se salva corretamente

### Passo 5: Verificar Logs do Servidor (Render)

No dashboard do Render:
1. Clique no serviço `biblestudyjourney-v2`
2. Vá em "Logs"
3. Procure por:
   ```
   ✅ [CONFIG] Configuração inicializada com sucesso!
   📍 [CONFIG] BASE_URL: https://biblestudyjourney-v2.onrender.com
   ```

---

## 3. Diagnóstico de Problemas

### 🔍 Problema: "CONFIG.debug is not a function"

#### Diagnóstico Rápido:

No console do navegador, execute:

```javascript
// Passo 1: CONFIG existe?
console.log('1. CONFIG existe?', typeof CONFIG);
// Esperado: "object"

// Passo 2: Listar propriedades
console.log('2. Propriedades:', Object.keys(CONFIG));
// Esperado: ["BASE_URL", "API_URL", "BIBLE_API_URL", ..., "debug"]

// Passo 3: Verificar tipo de debug
console.log('3. Tipo de debug:', typeof CONFIG.debug);
// Esperado: "function"

// Passo 4: Se debug existe, executar
if (typeof CONFIG.debug === 'function') {
    CONFIG.debug();
} else {
    console.error('❌ debug não é uma função ou não existe!');
    console.log('CONFIG atual:', CONFIG);
}
```

#### Possíveis Causas e Soluções:

**Causa 1: Cache do Navegador**
```bash
# Solução: Limpar cache
- Pressione: Ctrl+Shift+Del
- Marque: "Cached images and files"
- Clique: "Clear data"
- Recarregue: Ctrl+F5
```

**Causa 2: Arquivo config.js Corrompido ou Incompleto**
```bash
# Solução: Verificar integridade
1. Abrir www/js/config.js
2. Procurar pela função debug() (linha ~144)
3. Deve conter:
   debug() {
     console.log('=============== CONFIG DEBUG ===============');
     ...
   }
```

**Causa 3: Ordem de Carregamento Errada**
```html
<!-- ❌ ERRADO: config.js depois de outros scripts -->
<script src="../js/biblia.js"></script>
<script src="../js/config.js"></script>

<!-- ✅ CORRETO: config.js ANTES de todos -->
<script src="../js/config.js"></script>
<script src="../js/biblia.js"></script>
```

**Causa 4: Caminho Incorreto**
```html
<!-- Verifique se o caminho está correto -->
<script src="../js/config.js"></script>
<!-- Para páginas em www/html/, o caminho é ../js/ -->

<!-- Se estiver na raiz (www/), o caminho é: -->
<script src="js/config.js"></script>
```

### 🔍 Problema: Requisições de API Falhando

#### Diagnóstico:

```javascript
// 1. Verificar URL configurada
console.log('URL da API:', CONFIG.API_URL);

// 2. Testar uma requisição simples
fetch(`${CONFIG.API_URL}/user/stats`, {
    headers: {
        'Authorization': `Bearer ${await AuthManager.getToken()}`
    }
})
.then(res => {
    console.log('Status:', res.status);
    return res.json();
})
.then(data => console.log('Dados:', data))
.catch(err => console.error('Erro:', err));
```

#### Soluções:

1. **Verificar se o servidor está rodando:**
   ```bash
   # Localhost:
   curl http://localhost:3000/api/user/stats
   
   # Render:
   curl https://biblestudyjourney-v2.onrender.com/api/user/stats
   ```

2. **Verificar CORS:**
   - No `backend/server.js`, verificar se a origem está permitida
   - Procurar por: `allowedOrigins`

3. **Verificar token de autenticação:**
   ```javascript
   // No console:
   AuthManager.isAuthenticated().then(console.log);
   // Deve retornar: true
   ```

---

## 4. Troca de Ambiente

### Método 1: Detecção Automática (Recomendado)

Em `www/js/config.js`:

```javascript
const FORCE_ENVIRONMENT = 'auto'; // ← Sempre use 'auto' para produção
```

Com `'auto'`, o sistema detecta automaticamente:
- **localhost** → `http://localhost:3000`
- **onrender.com** → `https://biblestudyjourney-v2.onrender.com`
- **duckdns.org** → `https://biblestudyjourney.duckdns.org`
- **Capacitor (Android/iOS)** → Força produção (DuckDNS)

### Método 2: Forçar Ambiente Manualmente

Para **testes locais** apontando para produção:

```javascript
const FORCE_ENVIRONMENT = 'production'; // ← Usa DuckDNS mesmo em localhost
```

Para **testes locais** apontando para staging:

```javascript
const FORCE_ENVIRONMENT = 'staging'; // ← Usa Render mesmo em localhost
```

Para **desenvolvimento normal**:

```javascript
const FORCE_ENVIRONMENT = 'development'; // ← Usa localhost:3000
```

### Método 3: Variável de Ambiente (Futuro - Fase 4)

Na Fase 4, vamos criar um sistema de build que gera automaticamente o ambiente:

```bash
# Desenvolvimento
npm run build:dev

# Staging
npm run build:staging

# Produção
npm run build:prod
```

---

## 5. Checklist de Validação Completa

### ✅ Localhost

- [ ] Servidor inicia sem erros
- [ ] Página de teste carrega: http://localhost:3000/test-config.html
- [ ] Todos os 4 testes passam
- [ ] `CONFIG.debug()` funciona no console
- [ ] Login funciona
- [ ] Devocional carrega
- [ ] Leitura da Bíblia funciona
- [ ] Grifos salvam corretamente

### ✅ Render (Staging)

- [ ] Deploy completa sem erros
- [ ] Página de teste carrega: https://biblestudyjourney-v2.onrender.com/test-config.html
- [ ] `CONFIG.BASE_URL` aponta para Render
- [ ] `CONFIG.IS_STAGING` é `true`
- [ ] Login funciona
- [ ] Devocional carrega (verifica chamadas de IA)
- [ ] Todas as funcionalidades principais funcionam

### ✅ DuckDNS (Produção)

- [ ] Deploy completa sem erros
- [ ] Página de teste carrega: https://biblestudyjourney.duckdns.org/test-config.html
- [ ] `CONFIG.BASE_URL` aponta para DuckDNS
- [ ] `CONFIG.IS_PRODUCTION` é `true`
- [ ] Todas as funcionalidades críticas funcionam
- [ ] Performance aceitável (< 3s para carregar devocional)

---

## 6. Suporte e Contato

Se encontrar problemas que não estão documentados aqui:

1. **Verificar console do navegador** (F12 → Console)
2. **Verificar logs do servidor** (terminal ou Render dashboard)
3. **Executar página de teste**: `/test-config.html`
4. **Copiar mensagens de erro completas**
5. **Relatar com contexto:**
   - Ambiente (localhost/Render/DuckDNS)
   - Navegador e versão
   - Mensagens de erro
   - Resultado dos testes

---

**Última atualização:** 28 de outubro de 2025  
**Versão:** 1.0  
**Autor:** GitHub Copilot
