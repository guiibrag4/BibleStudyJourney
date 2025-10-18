// Arquivo: www/js/saves.js
// Sistema de Salvos para Bible Study Journey
// ATUALIZADO: Usa saves-manager.js para sincronizar com API/localStorage
// SEM ONCLICK INLINE (usa event delegation para compatibilidade com CSP)

class SavesManager {
    constructor() {
        this.currentTab = 'versiculos';
        this.saves = {
            versiculos: [],
            capitulos: [],
            notas: []
        };
        this.init();
    }

    async init() {
        await this.loadSaves();
        this.setupEventListeners();
        this.renderCurrentTab();
        this.updateCounts();
    }

    async loadSaves() {
        try {
            // Aguardar saves-manager estar disponível
            if (!window.savesManager) {
                console.warn('savesManager não disponível, tentando novamente em 500ms');
                setTimeout(() => this.init(), 500);
                return;
            }

            // Carregar todos os saves usando saves-manager
            const [highlights, chapters, notes] = await Promise.all([
                window.savesManager.highlights.getAll(),
                window.savesManager.chapters.getAll(),
                window.savesManager.notes.getAll()
            ]);

            this.saves = {
                versiculos: highlights || [],
                capitulos: chapters || [],
                notas: notes || []
            };

            console.log('[saves.js] Saves carregados:', this.saves);
        } catch (error) {
            console.error("Erro ao carregar salvos:", error);
        }
    }

    setupEventListeners() {
        // Navegação entre abas
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Modal
        const modal = document.getElementById('fullscreen-modal');
        const closeBtn = document.getElementById('close-modal-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Fechar modal ao clicar fora
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Tecla ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });

        // EVENT DELEGATION para botões dos cards (evita onclick inline)
        document.addEventListener('click', (e) => {
            // Botão de editar grifo
            if (e.target.closest('.edit-highlight-btn')) {
                const btn = e.target.closest('.edit-highlight-btn');
                const id = btn.dataset.id;
                this.editHighlight(id);
            }

            // Botão de excluir versículo
            if (e.target.closest('.delete-versiculo-btn')) {
                const btn = e.target.closest('.delete-versiculo-btn');
                const id = btn.dataset.id;
                this.deleteItem('versiculos', id);
            }

            // Botão de expandir versículo
            if (e.target.closest('.expand-versiculo-btn')) {
                const btn = e.target.closest('.expand-versiculo-btn');
                const id = btn.dataset.id;
                this.showFullContent('versiculo', id);
            }

            // Botão de ler capítulo
            if (e.target.closest('.read-chapter-btn')) {
                const btn = e.target.closest('.read-chapter-btn');
                const id = btn.dataset.id;
                this.readChapter(id);
            }

            // Botão de excluir capítulo
            if (e.target.closest('.delete-capitulo-btn')) {
                const btn = e.target.closest('.delete-capitulo-btn');
                const id = btn.dataset.id;
                this.deleteItem('capitulos', id);
            }

            // Botão de editar nota
            if (e.target.closest('.edit-note-btn')) {
                const btn = e.target.closest('.edit-note-btn');
                const id = btn.dataset.id;
                this.editNote(id);
            }

            // Botão de excluir nota
            if (e.target.closest('.delete-nota-btn')) {
                const btn = e.target.closest('.delete-nota-btn');
                const id = btn.dataset.id;
                this.deleteItem('notas', id);
            }

            // Botão de expandir nota
            if (e.target.closest('.expand-nota-btn')) {
                const btn = e.target.closest('.expand-nota-btn');
                const id = btn.dataset.id;
                this.showFullContent('nota', id);
            }
        });
    }

    switchTab(tabName) {
        // Atualizar botões
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-selected', 'true');
        }

        // Atualizar conteúdo
        document.querySelectorAll('.saves-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`.${tabName}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentTab = tabName;
        this.renderCurrentTab();
    }

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'versiculos':
                this.renderVersiculos();
                break;
            case 'capitulos':
                this.renderCapitulos();
                break;
            case 'notas':
                this.renderNotas();
                break;
        }
    }

    renderVersiculos() {
        const grid = document.getElementById('versiculos-grid');
        const empty = document.getElementById('versiculos-empty');
        
        if (!this.saves.versiculos || this.saves.versiculos.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        
        grid.innerHTML = this.saves.versiculos.map(versiculo => `
            <div class="save-card versiculo-card highlight-${versiculo.color}" data-id="${versiculo.id}">
                <div class="card-header">
                    <h3 class="card-title">${versiculo.reference}</h3>
                    <div class="card-actions">
                        <button class="action-btn edit-highlight-btn" data-id="${versiculo.id}" title="Editar grifo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete-versiculo-btn" data-id="${versiculo.id}" title="Excluir versículo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <p class="card-text">${this.truncateText(versiculo.text, 150)}</p>
                    <div class="card-meta">
                        <span class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Salvo em ${versiculo.date}
                        </span>
                        <span class="meta-item">
                            <span class="color-indicator" style="background: var(--highlight-${versiculo.color})"></span>
                            ${this.getColorName(versiculo.color)}
                        </span>
                    </div>
                </div>
                <button class="card-expand expand-versiculo-btn" data-id="${versiculo.id}" title="Ver completo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    renderCapitulos() {
        const grid = document.getElementById('capitulos-grid');
        const empty = document.getElementById('capitulos-empty');
        
        if (!this.saves.capitulos || this.saves.capitulos.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        
        grid.innerHTML = this.saves.capitulos.map(capitulo => `
            <div class="save-card capitulo-card" data-id="${capitulo.id}">
                <div class="card-header">
                    <h3 class="card-title">${capitulo.title}</h3>
                    <div class="card-actions">
                        <button class="action-btn read-chapter-btn" data-id="${capitulo.id}" title="Ler capítulo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete-capitulo-btn" data-id="${capitulo.id}" title="Remover dos salvos">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <p class="card-subtitle">${capitulo.subtitle}</p>
                    <div class="card-meta">
                        <span class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Salvo em ${capitulo.date}
                        </span>
                        <span class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                            ${capitulo.verseCount || 0} versículos
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderNotas() {
        const grid = document.getElementById('notas-grid');
        const empty = document.getElementById('notas-empty');
        
        if (!this.saves.notas || this.saves.notas.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        
        grid.innerHTML = this.saves.notas.map(nota => `
            <div class="save-card nota-card" data-id="${nota.id}">
                <div class="card-header">
                    <h3 class="card-title">${nota.reference}</h3>
                    <div class="card-actions">
                        <button class="action-btn edit-note-btn" data-id="${nota.id}" title="Editar nota">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete-nota-btn" data-id="${nota.id}" title="Excluir nota">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <p class="card-text">${this.truncateText(nota.text, 120)}</p>
                    <div class="card-meta">
                        <span class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Criado em ${nota.date}
                        </span>
                        <span class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                            ${nota.text.length} caracteres
                        </span>
                    </div>
                </div>
                <button class="card-expand expand-nota-btn" data-id="${nota.id}" title="Ver completo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    updateCounts() {
        const versiculosCount = this.saves.versiculos?.length || 0;
        const capitulosCount = this.saves.capitulos?.length || 0;
        const notasCount = this.saves.notas?.length || 0;
        const totalCount = versiculosCount + capitulosCount + notasCount;

        const versiculosCountEl = document.getElementById('versiculos-count');
        const capitulosCountEl = document.getElementById('capitulos-count');
        const notasCountEl = document.getElementById('notas-count');
        const totalItemsEl = document.getElementById('total-items');

        if (versiculosCountEl) versiculosCountEl.textContent = versiculosCount;
        if (capitulosCountEl) capitulosCountEl.textContent = capitulosCount;
        if (notasCountEl) notasCountEl.textContent = notasCount;
        if (totalItemsEl) totalItemsEl.textContent = totalCount;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    getColorName(color) {
        const colorNames = {
            yellow: "Amarelo",
            green: "Verde",
            blue: "Azul",
            red: "Vermelho",
            purple: "Roxo",
            orange: "Laranja",
            pink: "Rosa",
            cyan: "Ciano"
        };
        return colorNames[color] || color;
    }

    showFullContent(type, id) {
        const modal = document.getElementById('fullscreen-modal');
        const modalInfo = document.getElementById('modal-info');
        const modalText = document.getElementById('modal-text');
        
        let item;
        if (type === 'versiculo') {
            item = this.saves.versiculos?.find(v => v.id === id);
            if (item) {
                modalInfo.innerHTML = `
                    <h2>${item.reference}</h2>
                    <div class="modal-meta">
                        <span>Versão ${item.version}</span>
                        <span>Grifado em ${this.getColorName(item.color).toLowerCase()}</span>
                        <span>Salvo em ${item.date}</span>
                    </div>
                `;
                modalText.innerHTML = `<p class="verse-text">${item.text}</p>`;
            }
        } else if (type === 'nota') {
            item = this.saves.notas?.find(n => n.id === id);
            if (item) {
                modalInfo.innerHTML = `
                    <h2>${item.reference}</h2>
                    <div class="modal-meta">
                        <span>Versão ${item.version}</span>
                        <span>Criado em ${item.date}</span>
                        <span>${item.text.length} caracteres</span>
                    </div>
                `;
                modalText.innerHTML = `<div class="note-text">${item.text.replace(/\n/g, '<br>')}</div>`;
            }
        }
        
        if (item) {
            modal.style.display = 'flex';
        }
    }

    async deleteItem(type, id) {
        if (!confirm('Tem certeza que deseja excluir este item?')) {
            return;
        }

        try {
            let success = false;
            
            if (type === 'versiculos') {
                const item = this.saves.versiculos.find(v => v.id === id);
                if (item) {
                    success = await window.savesManager.highlights.remove(item.reference);
                }
            } else if (type === 'capitulos') {
                success = await window.savesManager.chapters.remove(id);
            } else if (type === 'notas') {
                const item = this.saves.notas.find(n => n.id === id);
                if (item) {
                    success = await window.savesManager.notes.remove(item.reference);
                }
            }

            if (success) {
                await this.loadSaves();
                this.renderCurrentTab();
                this.updateCounts();
                this.showNotification('Item excluído com sucesso!', 'success');
            } else {
                this.showNotification('Erro ao excluir item', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            this.showNotification('Erro ao excluir item', 'error');
        }
    }

    editHighlight(id) {
        // Implementar edição de grifo (mudar cor)
        this.showNotification('Funcionalidade de edição em desenvolvimento', 'info');
    }

    editNote(id) {
        // Implementar edição de nota
        this.showNotification('Funcionalidade de edição em desenvolvimento', 'info');
    }

    readChapter(id) {
        // Implementar navegação para o capítulo
        this.showNotification('Redirecionando para o capítulo...', 'info');
        // Aqui você pode implementar a navegação de volta para biblia.html com o capítulo específico
        setTimeout(() => {
            window.location.href = 'biblia.html';
        }, 1000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'saves-notification';
        notification.textContent = message;
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3'
        };

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: colors[type] || colors.info,
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            fontSize: '14px',
            fontWeight: '500'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.savesManagerUI = new SavesManager();
});

// Atualizar dados quando a página ganhar foco (caso o usuário volte de outra aba)
window.addEventListener('focus', async () => {
    if (window.savesManagerUI) {
        await window.savesManagerUI.loadSaves();
        window.savesManagerUI.renderCurrentTab();
        window.savesManagerUI.updateCounts();
    }
});

