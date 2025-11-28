# Como Adicionar Novos Templates - Tutorial

## 📝 Estrutura de um Template

Cada template é um objeto JavaScript com esta estrutura:

```javascript
{
    id: 'nome-unico-kebab-case',          // ID único para identificação
    name: 'Nome Exibido',                 // Nome mostrado ao usuário
    gradient: 'linear-gradient(...)',     // CSS gradient
    textColor: '#ffffff',                 // Cor do texto (hex)
    pattern: 'data:image/svg+xml,...'     // Padrão SVG opcional (ou null)
}
```

---

## 🎯 Passo a Passo para Adicionar Template

### 1. Abrir o arquivo
```
www/js/saves.js
```

### 2. Localizar a função `renderShareTemplates()`
Procure pela linha (aproximadamente linha 1010):
```javascript
const templates = [
```

### 3. Adicionar novo template no array
Copie e cole este código **dentro do array**, após o último template existente:

```javascript
            {
                id: 'seu-template',
                name: 'Seu Nome',
                gradient: 'linear-gradient(135deg, #cor1 0%, #cor2 100%)',
                textColor: '#ffffff',
                pattern: null
            },
```

### 4. Salvar e testar
Abra `saves.html` no navegador e veja seu template na lista!

---

## 🎨 Exemplos Prontos para Copiar e Colar

### Template 1: Terra Santa
```javascript
            {
                id: 'terra-santa',
                name: 'Terra Santa',
                gradient: 'linear-gradient(135deg, #d4a574 0%, #8b6914 100%)',
                textColor: '#ffffff',
                pattern: null
            },
```

### Template 2: Fogo Pentecostal
```javascript
            {
                id: 'fogo-pentecostal',
                name: 'Fogo Pentecostal',
                gradient: 'linear-gradient(135deg, #ff6b00 0%, #ff0000 50%, #ffd700 100%)',
                textColor: '#ffffff',
                pattern: null
            },
```

### Template 3: Estrela de Belém
```javascript
            {
                id: 'estrela-belem',
                name: 'Estrela de Belém',
                gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                textColor: '#ffffff',
                pattern: 'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M50 0 L55 35 L90 40 L60 60 L70 95 L50 75 L30 95 L40 60 L10 40 L45 35 Z" fill="%23ffd700" fill-opacity="0.3"/%3E%3C/svg%3E'
            },
```

### Template 4: Pomba do Espírito
```javascript
            {
                id: 'pomba-espirito',
                name: 'Pomba do Espírito',
                gradient: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 50%, #00acc1 100%)',
                textColor: '#004d61',
                pattern: null
            },
```

### Template 5: Pergaminho Antigo
```javascript
            {
                id: 'pergaminho',
                name: 'Pergaminho Antigo',
                gradient: 'linear-gradient(135deg, #f4e9d8 0%, #e8d5b7 100%)',
                textColor: '#3e2723',
                pattern: 'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Ctext x="50" y="50" font-size="60" fill="%23000" fill-opacity="0.03" text-anchor="middle"%3E✝%3C/text%3E%3C/svg%3E'
            },
```

---

## 🌈 Geradores de Gradientes

### Ferramentas Online Recomendadas

1. **UI Gradients** - https://uigradients.com/
   - Biblioteca enorme de gradientes prontos
   - Copie o CSS diretamente

2. **CoolHue** - https://webkul.github.io/coolhue/
   - Gradientes modernos e trendy
   - Seleção curada

3. **Gradient Hunt** - https://gradienthunt.com/
   - Paletas de gradientes
   - Votação comunitária

4. **CSS Gradient** - https://cssgradient.io/
   - Criador visual interativo
   - Ajuste fino de cores e ângulos

### Exemplo de Uso:
1. Acesse https://uigradients.com/
2. Escolha um gradiente (ex: "Celestial")
3. Copie o código CSS: `linear-gradient(135deg, #C33764 0%, #1D2671 100%)`
4. Cole no seu template

---

## 🎨 Criando Padrões SVG

### Padrão 1: Pontos
```javascript
pattern: 'data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="20" cy="20" r="2" fill="%23ffffff" fill-opacity="0.1"/%3E%3C/svg%3E'
```
**Resultado**: Bolinhas brancas espalhadas

### Padrão 2: Linhas Diagonais
```javascript
pattern: 'data:image/svg+xml,%3Csvg width="50" height="50" xmlns="http://www.w3.org/2000/svg"%3E%3Cline x1="0" y1="50" x2="50" y2="0" stroke="%23ffffff" stroke-opacity="0.2" stroke-width="1"/%3E%3C/svg%3E'
```
**Resultado**: Listras diagonais

### Padrão 3: Grade
```javascript
pattern: 'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Crect x="0" y="45" width="100" height="2" fill="%23ffffff" fill-opacity="0.1"/%3E%3Crect x="45" y="0" width="2" height="100" fill="%23ffffff" fill-opacity="0.1"/%3E%3C/svg%3E'
```
**Resultado**: Grade quadriculada

### Padrão 4: Estrelas
```javascript
pattern: 'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M50 0 L55 35 L90 40 L60 60 L70 95 L50 75 L30 95 L40 60 L10 40 L45 35 Z" fill="%23ffffff" fill-opacity="0.3"/%3E%3C/svg%3E'
```
**Resultado**: Estrelas brilhantes

### Ferramenta para Criar SVG
- **SVG Pattern Generator**: https://www.heropatterns.com/
- **Pattern Monster**: https://pattern.monster/

---

## 🔧 Testando Cores de Texto

### Regra Geral:
- **Gradientes escuros**: `textColor: '#ffffff'` (branco)
- **Gradientes claros**: `textColor: '#2c3e50'` (cinza escuro)
- **Gradientes amarelos/dourados**: `textColor: '#2c3e50'` (melhor contraste)

### Teste de Contraste:
Use https://webaim.org/resources/contrastchecker/

Exemplo:
- Cor de fundo (gradiente médio): `#667eea`
- Cor do texto: `#ffffff`
- Resultado: **Contraste 4.5:1** (bom para texto)

---

## 📋 Código Completo de Exemplo

Aqui está o código completo com 15 templates (10 originais + 5 novos):

```javascript
const templates = [
    // === ORIGINAIS ===
    {
        id: 'royal-purple',
        name: 'Púrpura Real',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'sunset-glow',
        name: 'Pôr do Sol',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'ocean-breeze',
        name: 'Brisa Oceânica',
        gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'forest-green',
        name: 'Verde Floresta',
        gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'golden-hour',
        name: 'Hora Dourada',
        gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
        textColor: '#2c3e50',
        pattern: null
    },
    {
        id: 'midnight-blue',
        name: 'Azul Meia-Noite',
        gradient: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
        textColor: '#ffffff',
        pattern: 'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0l30 30-30 30L0 30z" fill="%23ffffff" fill-opacity="0.05"/%3E%3C/svg%3E'
    },
    {
        id: 'rose-gold',
        name: 'Ouro Rosê',
        gradient: 'linear-gradient(135deg, #ed4264 0%, #ffedbc 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'mint-fresh',
        name: 'Menta Fresca',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'warm-flame',
        name: 'Chama Quente',
        gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'cloudy-sky',
        name: 'Céu Nublado',
        gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
        textColor: '#ffffff',
        pattern: 'data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="20" cy="20" r="2" fill="%23ffffff" fill-opacity="0.1"/%3E%3C/svg%3E'
    },
    
    // === NOVOS TEMPLATES ===
    {
        id: 'terra-santa',
        name: 'Terra Santa',
        gradient: 'linear-gradient(135deg, #d4a574 0%, #8b6914 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'fogo-pentecostal',
        name: 'Fogo Pentecostal',
        gradient: 'linear-gradient(135deg, #ff6b00 0%, #ff0000 50%, #ffd700 100%)',
        textColor: '#ffffff',
        pattern: null
    },
    {
        id: 'estrela-belem',
        name: 'Estrela de Belém',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        textColor: '#ffffff',
        pattern: 'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M50 0 L55 35 L90 40 L60 60 L70 95 L50 75 L30 95 L40 60 L10 40 L45 35 Z" fill="%23ffd700" fill-opacity="0.3"/%3E%3C/svg%3E'
    },
    {
        id: 'pomba-espirito',
        name: 'Pomba do Espírito',
        gradient: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 50%, #00acc1 100%)',
        textColor: '#004d61',
        pattern: null
    },
    {
        id: 'pergaminho',
        name: 'Pergaminho Antigo',
        gradient: 'linear-gradient(135deg, #f4e9d8 0%, #e8d5b7 100%)',
        textColor: '#3e2723',
        pattern: 'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Ctext x="50" y="50" font-size="60" fill="%23000" fill-opacity="0.03" text-anchor="middle"%3E✝%3C/text%3E%3C/svg%3E'
    }
];
```

---

## ⚠️ Cuidados Importantes

### 1. IDs Únicos
```javascript
// ❌ ERRADO - IDs duplicados
{ id: 'ocean', ... },
{ id: 'ocean', ... }  // Conflito!

// ✅ CORRETO
{ id: 'ocean-breeze', ... },
{ id: 'ocean-deep', ... }
```

### 2. Vírgulas no Final
```javascript
// ❌ ERRADO - Faltou vírgula
{
    id: 'template1',
    name: 'Nome 1'
}
{
    id: 'template2',  // Erro de sintaxe!

// ✅ CORRETO
{
    id: 'template1',
    name: 'Nome 1'
},
{
    id: 'template2',
```

### 3. Cores em Hexadecimal
```javascript
// ❌ ERRADO
textColor: 'white'

// ✅ CORRETO
textColor: '#ffffff'
```

### 4. Encoding de SVG
```javascript
// ❌ ERRADO - Caracteres não escapados
pattern: 'data:image/svg+xml,<svg>...</svg>'

// ✅ CORRETO - URL encoded
pattern: 'data:image/svg+xml,%3Csvg%3E...%3C/svg%3E'
```

Use esta ferramenta: https://yoksel.github.io/url-encoder/

---

## 🚀 Checklist de Adição

Antes de adicionar um template novo, verifique:

- [ ] ID único (não duplicado)
- [ ] Nome descritivo e atrativo
- [ ] Gradiente testado visualmente
- [ ] Cor de texto com bom contraste
- [ ] Vírgula no final do objeto
- [ ] SVG pattern (se houver) está URL encoded
- [ ] Testado no navegador

---

## 🎓 Recursos para Aprender Mais

### CSS Gradients
- https://developer.mozilla.org/en-US/docs/Web/CSS/gradient
- https://css-tricks.com/css3-gradients/

### SVG Patterns
- https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Patterns
- https://www.svgbackgrounds.com/

### Teoria de Cores
- https://color.adobe.com/
- https://coolors.co/

---

**Boa sorte criando templates incríveis! 🎨✨**
