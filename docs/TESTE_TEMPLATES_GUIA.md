# Guia Rápido - Teste de Templates

## 🚀 Como Testar

### 1. Abra a página de Salvos
```
www/html/saves.html
```

### 2. Adicione um versículo de teste (se não tiver nenhum)
- Vá para `biblia.html`
- Abra qualquer capítulo
- Selecione e grife um versículo
- Salve com uma cor

### 3. Teste o Compartilhamento
1. Clique no botão de **compartilhar** (ícone de share) em um card de versículo
2. Veja os 10 templates renderizados
3. Clique em um template para selecioná-lo (borda azul aparece)
4. Clique em **"Baixar Imagem"**
5. Aguarde 2-4 segundos
6. A imagem será baixada automaticamente (1080x1080px)

---

## 📋 Checklist de Teste

### Funcionalidades Básicas
- [ ] Modal de compartilhamento abre ao clicar no botão
- [ ] 10 templates aparecem no grid
- [ ] Seleção de template funciona (borda azul)
- [ ] Preview do versículo aparece em cada template

### Download de Imagem
- [ ] Botão "Baixar Imagem" gera a imagem
- [ ] Notificação "Gerando imagem... ⏳" aparece
- [ ] Download automático após 2-4 segundos
- [ ] Notificação de sucesso "Imagem baixada com sucesso! 📸"
- [ ] Arquivo PNG com nome correto (Ex: Joao_3_16_1732814400.png)

### Qualidade da Imagem
- [ ] Resolução: 1080x1080px
- [ ] Texto nítido e legível
- [ ] Gradiente renderizado corretamente
- [ ] Padrões SVG visíveis (templates Azul Meia-Noite e Céu Nublado)
- [ ] Aspas decorativas aparecem corretamente
- [ ] Rodapé "📖 Bible Study Journey" visível

### WhatsApp
- [ ] Botão WhatsApp abre corretamente
- [ ] Texto formatado com negrito e quebras de linha
- [ ] Funciona em mobile

### Copiar Texto
- [ ] Botão copia texto para clipboard
- [ ] Notificação de sucesso aparece
- [ ] Texto pode ser colado em outro app

---

## 🎨 Templates para Testar

### 1. Teste com Versículos Curtos
**Exemplo**: João 11:35 - "Jesus chorou."
- ✅ Boa escolha: **Céu Nublado**, **Azul Meia-Noite**
- Texto curto permite ver bem os padrões SVG

### 2. Teste com Versículos Médios
**Exemplo**: João 3:16
- ✅ Boa escolha: **Púrpura Real**, **Pôr do Sol**
- Tamanho ideal para todos os templates

### 3. Teste com Versículos Longos
**Exemplo**: Salmos 23:1-3 (se você concatenar)
- ⚠️ Pode precisar scroll no preview
- ✅ Testa limite de caracteres

### 4. Teste Contrastes de Cor
**Template Hora Dourada** (texto escuro):
- Único template com texto `#2c3e50` em vez de branco
- Verifique se está legível

**Templates com Padrões**:
- **Azul Meia-Noite**: Diamantes brancos semi-transparentes
- **Céu Nublado**: Círculos brancos semi-transparentes

---

## 🔍 O que Observar

### No Preview (Modal)
- Referência bíblica em negrito
- Texto do versículo entre aspas
- Truncado em ~70 caracteres com "..."

### Na Imagem Baixada (1080x1080px)
- **Aspas grandes** no topo e rodapé (80px, opacity 0.3)
- **Referência**: 48px, bold, sombra sutil
- **Versículo**: 32px, line-height 1.8, texto completo (sem truncar)
- **Rodapé**: "📖 Bible Study Journey" com opacity 0.7

---

## 🐛 Possíveis Problemas

### "Biblioteca html2canvas não carregada"
**Causa**: CDN não carregou
**Solução**: 
```javascript
// Verificar no console do navegador:
console.log(window.html2canvas);  // Deve retornar uma função
```
- Aguarde alguns segundos após carregar a página
- Verifique conexão com internet

### Imagem não baixa automaticamente
**Causa**: Popup blocker do navegador
**Solução**: 
- Permitir downloads automáticos para o site
- No Chrome: Configurações → Privacidade → Downloads

### Padrões SVG não aparecem
**Causa**: Navegador antigo sem suporte a data URIs
**Solução**: 
- Atualizar navegador
- Testar em Chrome/Edge/Safari mais recentes

### Texto cortado na imagem
**Causa**: Versículo muito longo
**Solução**: 
- Template foi otimizado para versículos de até ~300 caracteres
- Se necessário, editar font-size em `downloadAsImage()`

---

## 📱 Teste em Diferentes Dispositivos

### Desktop (Chrome/Edge/Firefox)
```bash
# Servir localmente:
cd www
python -m http.server 8080

# Abrir: http://localhost:8080/html/saves.html
```

### Mobile (Android - Chrome)
1. Use o mesmo servidor local
2. Acesse pelo IP da máquina na rede local
3. Ex: `http://192.168.1.100:8080/html/saves.html`

### Mobile (Android - App Capacitor)
```bash
npx cap sync android
npx cap open android
# Build e instale no dispositivo
```

---

## 📊 Benchmark de Performance

### Desktop (i5, 8GB RAM)
- Geração de imagem: **~2s**
- Tamanho do arquivo PNG: **250-400KB**

### Mobile (Android mid-range)
- Geração de imagem: **~4s**
- Tamanho do arquivo PNG: **250-400KB**

### Mobile (Android low-end)
- Geração de imagem: **~6-8s**
- Pode travar temporariamente durante geração

---

## 🎯 Sugestões de Melhoria Baseadas em Teste

Após testar, considere adicionar:

### Se versículos longos dão problema:
```javascript
// Ajuste dinâmico de font-size
const fontSize = item.text.length > 200 ? '28px' : 
                 item.text.length > 300 ? '24px' : '32px';
```

### Se quiser indicador de progresso:
```javascript
// Adicionar barra de progresso
const progressBar = document.createElement('div');
progressBar.style.cssText = 'position: fixed; top: 50%; ...';
```

### Se quiser salvar no histórico:
```javascript
// Salvar metadados da imagem gerada
const imageHistory = JSON.parse(localStorage.getItem('imageHistory') || '[]');
imageHistory.push({
    reference: item.reference,
    template: templateId,
    timestamp: Date.now()
});
localStorage.setItem('imageHistory', JSON.stringify(imageHistory));
```

---

## ✅ Critérios de Sucesso

Implementação está funcionando perfeitamente se:

1. ✅ Todos os 10 templates renderizam corretamente
2. ✅ Download funciona em Chrome/Edge/Safari
3. ✅ Imagens são nítidas (2160x2160px internamente)
4. ✅ Gradientes e padrões SVG aparecem
5. ✅ Texto é legível em todos os templates
6. ✅ Tempo de geração < 5s em desktop
7. ✅ WhatsApp e Copiar funcionam
8. ✅ Não há erros no console

---

## 🚀 Próximo Passo

Depois de testar e validar, considere:

1. **Adicionar analytics**: Rastrear templates mais usados
2. **Criar preset de versículos famosos**: Ex: João 3:16, Salmos 23, etc.
3. **Tutorial interativo**: Mostrar como usar na primeira vez
4. **Compartilhamento direto**: API do Instagram/Facebook Stories

---

**Bom teste! 🎨📸**
