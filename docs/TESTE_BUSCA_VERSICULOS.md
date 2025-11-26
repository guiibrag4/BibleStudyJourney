# 🧪 Guia de Testes - Busca de Versículos

## ✅ Correções Implementadas (ATUALIZADO)

### 1. **Arquitetura Corrigida - Uso de Proxy**
- ❌ Antes: Frontend → API externa (sem token) → 403 Forbidden
- ✅ Agora: Frontend → Backend (proxy) → API externa (com token) → Sucesso

### 2. **Nova Rota no Backend**
- Endpoint: `POST /api/bible/verses/search`
- Função: Proxy autenticado para A Bíblia Digital
- Token: Gerenciado pelo backend (`API_BIBLIA` env var)

### 3. **Autenticação em Camadas**
- **Frontend → Backend**: Token JWT do usuário
- **Backend → API Externa**: Token da Bíblia Digital (servidor)

---

## 🧪 Como Testar

### **Teste 1: Página de Testes Automatizada**

1. Abra no navegador:
   ```
   http://localhost:8080/test-verse-search.html
   ```

2. Execute os testes na ordem:
   - ✅ **Teste de Conectividade** - Verifica se a API está acessível
   - ✅ **Busca Simples** - Testa com palavras comuns ("amor", "fé", "paz")
   - ✅ **Diferentes Versões** - Testa NVI, ACF, RA
   - ✅ **Validações** - Confirma bloqueio de buscas inválidas

### **Teste 2: Na Página da Bíblia**

1. Abra a página da Bíblia:
   ```
   http://localhost:8080/html/biblia.html
   ```

2. Faça login (se necessário)

3. Clique no ícone 🔍 no header

4. Teste as seguintes buscas:

   **Buscas Válidas:**
   - `amor` - deve retornar ~500+ versículos
   - `fé` - deve retornar ~200+ versículos  
   - `paz` - deve retornar ~300+ versículos
   - `jesus` - deve retornar ~1000+ versículos
   - `deus` - deve retornar ~4000+ versículos

   **Buscas Inválidas (devem ser bloqueadas):**
   - `ab` - menos de 3 caracteres
   - `  ` - apenas espaços
   - (vazio) - nada digitado

5. Verifique o comportamento:
   - ✅ Loading aparece durante busca
   - ✅ Resultados aparecem em cards
   - ✅ Termo buscado aparece destacado em amarelo
   - ✅ Contador mostra total de versículos
   - ✅ Botão "Carregar mais" aparece se > 20 resultados
   - ✅ Clicar em resultado navega para o versículo

### **Teste 3: Navegação aos Resultados**

1. Faça uma busca (ex: "amor")
2. Clique em qualquer resultado
3. Verifique:
   - ✅ Modal fecha automaticamente
   - ✅ Página carrega o livro/capítulo correto
   - ✅ Scroll vai até o versículo
   - ✅ Versículo fica destacado por ~1.6s

### **Teste 4: Cache**

1. Faça uma busca (ex: "fé")
2. Limpe o input e busque novamente "fé"
3. Verifique no console:
   - ✅ Segunda busca deve ser instantânea (cache hit)
   - ✅ Log mostra: "Resultados salvos no cache"

### **Teste 5: Diferentes Versões**

1. Troque a versão no seletor (NVI → ACF)
2. Faça uma busca
3. Verifique:
   - ✅ Resultados correspondem à versão selecionada
   - ✅ Texto dos versículos muda conforme a versão

---

## 🔍 Verificações no Console do Navegador

Abra o DevTools (F12) e verifique os logs:

### **Logs Esperados (Busca Bem-Sucedida):**
```
[BUSCA] Buscando por: "amor" na versão nvi
[BUSCA] Endpoint: https://www.abibliadigital.com.br/api/verses/search
[BUSCA] Status da resposta: 200
[BUSCA] Resultados recebidos: {occurrence: 542, version: "nvi", verses: Array(542)}
[BUSCA] Total de versículos: 542
[BUSCA] Resultados salvos no cache: verse_search_nvi_amor
```

### **Logs de Erro (se houver):**
```
[BUSCA] Erro da API: <detalhes do erro>
[BUSCA] Erro ao buscar versículos: Error: HTTP error! status: 404
[BUSCA] Detalhes: {versao: "nvi", termo: "amor", endpoint: "..."}
```

---

## 🐛 Problemas Comuns e Soluções

### **Erro 404 - Not Found**
- ✅ **Corrigido!** Endpoint estava apontando para backend local
- Agora usa API pública: `abibliadigital.com.br`

### **Erro 400 - Bad Request**
- Verifique se a versão existe (nvi, acf, ra, etc)
- Confirme que o termo de busca tem pelo menos 3 caracteres

### **Erro de CORS**
- API pública permite CORS
- Se ocorrer, pode ser bloqueio de extensão do navegador

### **Nenhum Resultado**
- Confirme que a palavra existe na Bíblia
- Tente termos mais comuns: "deus", "senhor", "jesus"

### **Token não disponível**
- Normal se não estiver logado
- Busca funciona sem autenticação na API pública

---

## 📊 Métricas de Performance

### **Tempos Esperados:**
- ⚡ Primeira busca: 500-2000ms (depende da rede)
- ⚡ Busca em cache: < 50ms (instantâneo)
- ⚡ Renderização de 20 resultados: < 100ms
- ⚡ Navegação ao versículo: 300-500ms

### **Uso de Memória:**
- 📦 Cache por termo: ~50-500KB (depende do nº de resultados)
- 📦 Cache expira em: 1 hora
- 📦 LocalForage: gerenciamento automático

---

## ✅ Checklist Final

Antes de dar como concluído, verifique:

- [ ] Botão 🔍 aparece no header
- [ ] Modal abre ao clicar no botão
- [ ] Input de busca recebe foco automaticamente
- [ ] Debounce funciona (espera 500ms após parar de digitar)
- [ ] Validação bloqueia < 3 caracteres
- [ ] Loading aparece durante busca
- [ ] Resultados renderizam corretamente
- [ ] Termo buscado aparece destacado (mark/highlight)
- [ ] Contador de resultados está correto
- [ ] Paginação funciona (botão "Carregar mais")
- [ ] Navegação ao clicar em resultado funciona
- [ ] Cache funciona (buscas repetidas são instantâneas)
- [ ] Botão limpar (×) funciona
- [ ] Enter no input executa busca
- [ ] Mensagens de erro são claras
- [ ] Diferentes versões funcionam

---

## 🚀 Próximos Passos (Opcional)

Se tudo estiver funcionando, considere:

1. **Histórico de Buscas** - Salvar últimas 10 buscas
2. **Filtros Avançados** - Por testamento (VT/NT)
3. **Busca Múltipla** - "amor E fé" (operadores lógicos)
4. **Compartilhar Resultados** - Link direto para busca
5. **Exportar** - PDF com resultados da busca

---

## 📞 Suporte

Se encontrar erros:

1. Copie os logs do console (F12)
2. Tire print do erro
3. Anote os passos para reproduzir
4. Compartilhe comigo

**Bons testes! 🎉**
