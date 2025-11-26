# ✅ CORREÇÃO FINAL - Busca de Versículos

## 🔧 O que foi corrigido:

### **Problema Original:**
```
Erro 403 Forbidden - Token não autorizado
```

### **Causa Raiz:**
A API da Bíblia Digital exige um token específico que só o **backend** possui (`API_BIBLIA` env var).

### **Solução Implementada:**
Criar um **proxy no backend** que:
1. Recebe requisição do frontend (com token JWT do usuário)
2. Valida autenticação do usuário
3. Faz chamada para API externa (com token da Bíblia Digital)
4. Retorna resultados ao frontend

---

## 📋 Arquivos Modificados:

### 1. **Backend** - `backend/routes/bibleRoutes.js`
```javascript
// Nova rota adicionada:
router.post('/verses/search', async (req, res) => {
    const { version, search } = req.body;
    
    // Validação
    if (!search || search.trim().length < 3) {
        return res.status(400).json({ 
            error: 'Termo de busca deve ter no mínimo 3 caracteres' 
        });
    }
    
    // Proxy autenticado para A Bíblia Digital
    const url = `${BIBLE_API_URL}/verses/search`;
    const apiResponse = await fetch(url, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${API_TOKEN}`,  // ← Token do servidor
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ version, search })
    });
    
    res.json(await apiResponse.json());
});
```

### 2. **Frontend** - `www/js/biblia.js`
```javascript
// Endpoint corrigido:
const response = await fetch(`${API_URL}/verses/search`, {  // ← Usa proxy
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // ← Token JWT do usuário
    },
    body: JSON.stringify({
        version: versaoAtual,
        search: trimmedSearch
    })
});
```

---

## 🧪 Como Testar:

### **Passo 1: Verificar que o servidor está rodando**
Abra o navegador em:
```
http://localhost:3000
```

Se ver a página inicial, o backend está OK ✅

### **Passo 2: Abrir a página da Bíblia**
```
http://localhost:3000/html/biblia.html
```
ou se estiver usando o servidor Python:
```
http://localhost:8080/html/biblia.html
```

### **Passo 3: Fazer login**
- Use suas credenciais ou Google Sign-In
- Você precisa estar autenticado para usar a busca

### **Passo 4: Testar a busca**
1. Clique no ícone 🔍 no header
2. Digite "amor" (ou qualquer palavra com 3+ caracteres)
3. Aguarde 500ms (debounce)
4. Veja os resultados aparecerem!

### **Passo 5: Verificar logs no console**
Abra DevTools (F12) e veja:

**Logs esperados (sucesso):**
```
[BUSCA] Buscando por: "amor" na versão nvi
[BUSCA] Endpoint: http://localhost:3000/api/bible/verses/search
[BUSCA] Status da resposta: 200
[BUSCA] Resultados recebidos: {occurrence: 542, version: "nvi", verses: Array(542)}
[BUSCA] Total de versículos: 542
```

**Se der erro, você verá:**
```
[BUSCA] Erro da API: <detalhes>
[BUSCA] Erro ao buscar versículos: Error: ...
```

---

## 🐛 Troubleshooting:

### **Erro: "Cannot POST /api/bible/verses/search"**
- ✅ **Corrigido!** Servidor foi reiniciado com a nova rota
- Se persistir: Pare o servidor (Ctrl+C) e reinicie: `node server.js`

### **Erro 401 - Não autorizado**
- Você não está logado
- Faça login primeiro

### **Erro 400 - Bad Request**
- Termo de busca tem menos de 3 caracteres
- Digite pelo menos 3 letras

### **Erro 403 - Forbidden**
- Se ver este erro agora, significa que o token `API_BIBLIA` não está configurado no backend
- Verifique o arquivo `.env` do backend

### **Nenhum resultado**
- A palavra pode não existir na Bíblia
- Tente termos comuns: "deus", "jesus", "amor", "fé"

---

## 📊 Fluxo de Autenticação:

```
┌─────────────┐
│  Frontend   │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Busca "amor"
       │    Authorization: Bearer <JWT_USER>
       ▼
┌─────────────┐
│   Backend   │
│  (Node.js)  │
└──────┬──────┘
       │
       │ 2. Valida JWT do usuário ✅
       │ 3. Faz proxy com token da API
       │    Authorization: Bearer <API_BIBLIA_TOKEN>
       ▼
┌─────────────────────┐
│  A Bíblia Digital   │
│  (API Externa)      │
└──────┬──────────────┘
       │
       │ 4. Retorna versículos
       ▼
┌─────────────┐
│  Frontend   │
│  (Mostra)   │
└─────────────┘
```

---

## ✅ Checklist de Validação:

- [ ] Servidor backend está rodando na porta 3000
- [ ] Você está logado na aplicação
- [ ] Clicar no ícone 🔍 abre o modal
- [ ] Digitar 3+ caracteres ativa a busca
- [ ] Loading aparece durante a busca
- [ ] Resultados aparecem em cards
- [ ] Termo buscado está destacado (amarelo)
- [ ] Contador mostra total de versículos
- [ ] Clicar em resultado navega ao versículo
- [ ] Console mostra logs de [BUSCA] sem erros

---

## 🎯 Teste Rápido:

Execute este código no console do navegador (F12):
```javascript
// Teste direto da API
const token = await window.AuthManager.getToken();

const response = await fetch('http://localhost:3000/api/bible/verses/search', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        version: 'nvi',
        search: 'amor'
    })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Resultados:', data.verses?.length);
console.log('Dados:', data);
```

**Resultado esperado:**
```
Status: 200
Resultados: 542
Dados: {occurrence: 542, version: "nvi", verses: Array(542)}
```

---

## 🚀 Pronto!

Se tudo estiver OK, você verá:
- ✅ Status 200
- ✅ Centenas de versículos retornados
- ✅ Interface mostrando os resultados

**Teste agora e me avise o resultado!** 🎉
