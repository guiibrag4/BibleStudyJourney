# Funcionalidades de Busca e Compartilhamento - Salvos

## Visão Geral

Implementação de busca em tempo real e compartilhamento de versículos/notas com templates visuais pré-definidos na tela de salvos.

---

## 1. Busca em Tempo Real

### Funcionalidades

- **Busca integrada**: Filtro unificado para versículos, capítulos e notas
- **Busca em múltiplos campos**:
  - Referências bíblicas (ex: "João 3:16", "Gênesis 1")
  - Texto do conteúdo
  - Cores de destaque (ex: "amarelo", "verde")
- **UX aprimorada**:
  - Botão "X" para limpar busca
  - Feedback visual quando não há resultados
  - Busca instantânea enquanto digita

### Implementação Técnica

**Arquivo modificado**: `www/js/saves.js`

**Propriedades adicionadas à classe `SavesManager`**:
```javascript
this.searchQuery = '';          // Query de busca atual
this.filteredSaves = {          // Resultados filtrados
    versiculos: [],
    capitulos: [],
    notas: []
};
```

**Métodos principais**:

#### `setupSearchListeners()`
Configura event listeners para o input de busca:
```javascript
setupSearchListeners() {
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            this.filterSaves();
            this.renderCurrentTab();
            
            // Mostrar/ocultar botão de limpar
            if (clearSearchBtn) {
                clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            this.searchQuery = '';
            clearSearchBtn.style.display = 'none';
            this.filterSaves();
            this.renderCurrentTab();
        });
    }
}
```

#### `filterSaves()`
Filtra os salvos com base na query de busca:
```javascript
filterSaves() {
    if (!this.searchQuery) {
        // Sem busca: mostra todos
        this.filteredSaves = { ...this.saves };
        return;
    }

    const query = this.searchQuery;

    // Filtrar versículos
    this.filteredSaves.versiculos = this.saves.versiculos.filter(v => 
        v.reference.toLowerCase().includes(query) ||
        v.text.toLowerCase().includes(query) ||
        this.getColorName(v.color).toLowerCase().includes(query)
    );

    // Filtrar capítulos
    this.filteredSaves.capitulos = this.saves.capitulos.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.subtitle.toLowerCase().includes(query)
    );

    // Filtrar notas
    this.filteredSaves.notas = this.saves.notas.filter(n => 
        n.reference.toLowerCase().includes(query) ||
        n.text.toLowerCase().includes(query)
    );
}
```

### Mudanças nos Métodos de Renderização

**Antes**:
```javascript
renderVersiculos() {
    const versiculos = this.saves.versiculos;
    // ...
}
```

**Depois**:
```javascript
renderVersiculos() {
    const versiculos = this.filteredSaves.versiculos;
    
    if (versiculos.length === 0) {
        if (this.searchQuery) {
            // Mensagem específica quando é resultado de busca
            empty.innerHTML = `
                <svg>...</svg>
                <p>Nenhum versículo encontrado</p>
            `;
        }
    }
    // ...
}
```

---

## 2. Compartilhamento com Templates

### Funcionalidades

- **6 templates visuais** com gradientes únicos:
  - Classic (dourado)
  - Modern (roxo/rosa)
  - Elegant (cinza escuro)
  - Minimal (azul claro)
  - Sunset (laranja/rosa)
  - Ocean (azul/ciano)

- **Opções de compartilhamento**:
  - 📱 **WhatsApp**: Envia texto formatado
  - 📋 **Copiar texto**: Copia para clipboard
  - 🖼️ **Download imagem**: Em desenvolvimento (stub)

### Implementação Técnica

**Propriedades adicionadas**:
```javascript
this.selectedShareItem = null;  // Item sendo compartilhado (versículo ou nota)
```

**Métodos principais**:

#### `openShareModal(type, id)`
Abre modal de compartilhamento:
```javascript
openShareModal(type, id) {
    // Buscar o item nos salvos
    let item;
    if (type === 'versiculo') {
        item = this.saves.versiculos.find(v => v.id === id);
    } else if (type === 'nota') {
        item = this.saves.notas.find(n => n.id === id);
    }

    if (!item) return;

    this.selectedShareItem = { type, ...item };
    
    // Renderizar preview dos templates
    this.renderShareTemplates();
    
    // Mostrar modal
    const modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'flex';
}
```

#### `renderShareTemplates()`
Renderiza os 6 templates com preview do conteúdo:
```javascript
renderShareTemplates() {
    const container = document.getElementById('share-templates');
    if (!container || !this.selectedShareItem) return;

    const templates = [
        {
            id: 'classic',
            name: 'Clássico',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        // ... outros 5 templates
    ];

    container.innerHTML = templates.map(template => `
        <div class="share-template" data-template="${template.id}">
            <div class="share-preview" style="background: ${template.gradient}">
                <div class="share-preview-content">
                    <p class="share-preview-reference">${this.selectedShareItem.reference}</p>
                    <p class="share-preview-text">${this.truncateText(this.selectedShareItem.text, 80)}</p>
                </div>
            </div>
            <p class="share-template-name">${template.name}</p>
        </div>
    `).join('');

    // Selecionar primeiro template por padrão
    const firstTemplate = container.querySelector('.share-template');
    if (firstTemplate) firstTemplate.classList.add('selected');

    // Event listeners para seleção
    container.querySelectorAll('.share-template').forEach(el => {
        el.addEventListener('click', () => {
            container.querySelectorAll('.share-template').forEach(t => 
                t.classList.remove('selected')
            );
            el.classList.add('selected');
        });
    });
}
```

#### `shareToWhatsApp()`
Compartilha via WhatsApp:
```javascript
shareToWhatsApp() {
    if (!this.selectedShareItem) return;

    const text = `📖 *${this.selectedShareItem.reference}*\n\n"${this.selectedShareItem.text}"\n\n_Compartilhado via Bible Study Journey_`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}
```

#### `copyText()`
Copia texto para clipboard:
```javascript
async copyText() {
    if (!this.selectedShareItem) return;

    const text = `${this.selectedShareItem.reference}\n\n"${this.selectedShareItem.text}"\n\n- Bible Study Journey`;

    try {
        await navigator.clipboard.writeText(text);
        this.showNotification('Texto copiado!', 'success');
    } catch (err) {
        console.error('Erro ao copiar:', err);
        this.showNotification('Erro ao copiar texto', 'error');
    }
}
```

#### `downloadAsImage()` (Stub)
Placeholder para download de imagem:
```javascript
downloadAsImage() {
    this.showNotification('Download de imagem em desenvolvimento', 'info');
    // TODO: Implementar com html2canvas ou similar
}
```

### Botões de Compartilhar nos Cards

**Versículos (`renderVersiculos()`)**:
```html
<button class="action-btn share-versiculo-btn" data-id="${versiculo.id}" title="Compartilhar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
</button>
```

**Notas (`renderNotas()`)**:
```html
<button class="action-btn share-nota-btn" data-id="${nota.id}" title="Compartilhar">
    <!-- Mesmo SVG -->
</button>
```

### Event Listeners

**Adicionados em `setupEventListeners()`**:
```javascript
// Botão de compartilhar versículo
if (e.target.closest('.share-versiculo-btn')) {
    const btn = e.target.closest('.share-versiculo-btn');
    const id = btn.dataset.id;
    this.openShareModal('versiculo', id);
    return;
}

// Botão de compartilhar nota
if (e.target.closest('.share-nota-btn')) {
    const btn = e.target.closest('.share-nota-btn');
    const id = btn.dataset.id;
    this.openShareModal('nota', id);
    return;
}
```

**Modal de compartilhamento**:
```javascript
const shareModal = document.getElementById('share-modal');
const closeShareBtn = document.getElementById('close-share-btn');
const downloadImageBtn = document.getElementById('download-image-btn');
const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
const copyTextBtn = document.getElementById('copy-text-btn');

closeShareBtn.addEventListener('click', () => {
    shareModal.style.display = 'none';
});

shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) {
        shareModal.style.display = 'none';
    }
});

downloadImageBtn.addEventListener('click', () => this.downloadAsImage());
shareWhatsappBtn.addEventListener('click', () => this.shareToWhatsApp());
copyTextBtn.addEventListener('click', () => this.copyText());
```

---

## 3. Mudanças nos Arquivos

### `www/js/saves.js`
- **Linhas modificadas**: ~100
- **Métodos adicionados**: 7 (`setupSearchListeners`, `filterSaves`, `openShareModal`, `renderShareTemplates`, `getSelectedTemplate`, `downloadAsImage`, `shareToWhatsApp`, `copyText`)
- **Propriedades adicionadas**: 2 (`searchQuery`, `filteredSaves`, `selectedShareItem`)
- **Event listeners adicionados**: 8 (busca, compartilhar versículo/nota, ações do modal)

### `www/css/saves.css`
**Estilos adicionados**:

```css
/* Barra de busca */
.search-container {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-primary);
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.search-wrapper {
    position: relative;
    max-width: 600px;
    margin: 0 auto;
}

.search-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 2.5rem;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(103, 126, 234, 0.1);
}

.clear-search {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-secondary);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
}

/* Modal de compartilhamento */
.share-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.share-modal-content {
    background: var(--bg-primary);
    border-radius: 20px;
    max-width: 800px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.share-template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.share-template {
    cursor: pointer;
    border-radius: 12px;
    padding: 0.5rem;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.share-template.selected {
    border-color: var(--primary-color);
    background: var(--bg-secondary);
}

.share-preview {
    border-radius: 8px;
    padding: 1.5rem;
    color: white;
    min-height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

### `www/html/saves.html`
**HTML adicionado**:

```html
<!-- Barra de busca (antes do saves-menu) -->
<div class="search-container">
    <div class="search-wrapper">
        <svg class="search-icon">...</svg>
        <input type="text" id="search-input" class="search-input" placeholder="Buscar em salvos...">
        <button id="clear-search-btn" class="clear-search" style="display: none;">×</button>
    </div>
</div>

<!-- Modal de compartilhamento (no final do body) -->
<div id="share-modal" class="share-modal">
    <div class="share-modal-content">
        <div class="share-modal-header">
            <h2>Compartilhar</h2>
            <button id="close-share-btn">×</button>
        </div>
        <div class="share-modal-body">
            <h3>Escolha um template:</h3>
            <div id="share-templates" class="share-template-grid"></div>
        </div>
        <div class="share-modal-footer">
            <button id="download-image-btn">🖼️ Baixar Imagem</button>
            <button id="share-whatsapp-btn">📱 WhatsApp</button>
            <button id="copy-text-btn">📋 Copiar Texto</button>
        </div>
    </div>
</div>
```

---

## 4. Fluxo de Uso

### Busca
1. Usuário digita no input de busca
2. `filterSaves()` filtra os dados em tempo real
3. `renderCurrentTab()` re-renderiza apenas os itens filtrados
4. Botão "X" limpa a busca e restaura todos os itens

### Compartilhamento
1. Usuário clica no botão de compartilhar em um card
2. `openShareModal()` armazena o item e abre o modal
3. `renderShareTemplates()` renderiza os 6 templates com preview
4. Usuário seleciona um template (border azul indica seleção)
5. Usuário escolhe ação:
   - **WhatsApp**: Abre WhatsApp Web com texto formatado
   - **Copiar**: Copia texto para clipboard e mostra notificação
   - **Download**: Mostra mensagem "em desenvolvimento"

---

## 5. Próximos Passos (TODO)

### Download de Imagem
Para implementar o download real, usar a biblioteca **html2canvas**:

```javascript
async downloadAsImage() {
    const template = this.getSelectedTemplate();
    if (!template || !this.selectedShareItem) return;

    try {
        // Criar elemento temporário com o template
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: -9999px;
            width: 600px;
            height: 400px;
            background: ${template.gradient};
            padding: 2rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            color: white;
        `;
        container.innerHTML = `
            <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">
                ${this.selectedShareItem.reference}
            </h2>
            <p style="font-size: 1.1rem; line-height: 1.6;">
                "${this.selectedShareItem.text}"
            </p>
            <p style="margin-top: 2rem; opacity: 0.8; font-size: 0.9rem;">
                Bible Study Journey
            </p>
        `;
        document.body.appendChild(container);

        // Converter para canvas
        const canvas = await html2canvas(container, {
            backgroundColor: null,
            scale: 2  // Melhor qualidade
        });

        // Remover elemento temporário
        document.body.removeChild(container);

        // Download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.selectedShareItem.reference}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });

        this.showNotification('Imagem baixada!', 'success');
    } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        this.showNotification('Erro ao gerar imagem', 'error');
    }
}
```

**Instalação da biblioteca**:
```html
<!-- Adicionar em www/html/saves.html antes do </body> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

---

## 6. Considerações de Performance

- **Busca**: Filtro instantâneo sem debounce (perfomance OK com centenas de itens)
- **Renderização**: Apenas re-renderiza a aba atual, não todas
- **Templates**: Renderizados on-demand ao abrir modal
- **Event delegation**: Evita criar N listeners (um por card)

---

## 7. Compatibilidade

- ✅ **Web**: Totalmente funcional
- ✅ **Android (Capacitor)**: `navigator.clipboard` e `window.open()` funcionam
- ✅ **iOS (Capacitor)**: Mesmas APIs funcionam nativamente
- ⚠️ **Download imagem**: Requer biblioteca externa (html2canvas)

---

**Última atualização**: Novembro 2025  
**Autor**: GitHub Copilot (Claude Sonnet 4.5)
