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
              // Fecha ao clicar no overlay OU no conteúdo do modal (qualquer clique)
              if (e.target === modal || e.target.closest('.modal-content')) {
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
                // Botão de navegar para versículo grifado
                if (e.target.closest('.navigate-verse-btn')) {
                    const btn = e.target.closest('.navigate-verse-btn');
                const id = btn.dataset.id;
                    this.navigateToHighlightedVerse(id);
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
                    return; // Previne conflito com navegação
            }

                // Clicar no card de versículo navega para ele (exceto em botões de ação)
                const versiculoCard = e.target.closest('.versiculo-card');
                if (versiculoCard && !e.target.closest('.card-actions') && !e.target.closest('.card-expand')) {
                    const id = versiculoCard.dataset.id;
                    this.navigateToHighlightedVerse(id);
                    return;
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
                            <button class="action-btn navigate-verse-btn" data-id="${versiculo.id}" title="Ir para versículo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
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
        // Mantido para compatibilidade; redireciona para o versículo grifado
        this.navigateToHighlightedVerse(id);
    }
    
    navigateToHighlightedVerse(id) {
        // Navegar para o versículo grifado na tela da bíblia
        const item = this.saves.versiculos?.find(v => v.id === id);
        if (item) {
            this.navigateToVerse(item.reference, item.version);
        }
    }

    editNote(id) {
        // Abrir modal de edição de nota
        const nota = this.saves.notas?.find(n => n.id === id);
        if (!nota) return;

        // Criar modal de edição
        const modal = document.createElement('div');
        modal.className = 'edit-note-modal';
        modal.innerHTML = `
            <div class="edit-note-content">
                <div class="edit-note-header">
                    <h3>Editar Nota - ${nota.reference}</h3>
                    <button class="close-edit-note-btn">×</button>
                </div>
                <div class="edit-note-body">
                    <textarea class="edit-note-textarea" placeholder="Digite sua nota...">${nota.text}</textarea>
                </div>
                <div class="edit-note-footer">
                    <button class="save-edit-note-btn">Salvar</button>
                    <button class="cancel-edit-note-btn">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners do modal
        const closeModal = () => {
            modal.remove();
        };

        modal.querySelector('.close-edit-note-btn').addEventListener('click', closeModal);
        modal.querySelector('.cancel-edit-note-btn').addEventListener('click', closeModal);
        
        modal.querySelector('.save-edit-note-btn').addEventListener('click', async () => {
            const newText = modal.querySelector('.edit-note-textarea').value.trim();
            
            if (!newText) {
                this.showNotification('A nota não pode estar vazia', 'error');
                return;
            }

            try {
                const result = await window.savesManager.notes.save({
                    reference: nota.reference,
                    version: nota.version,
                    text: newText
                });

                if (result) {
                    this.showNotification('Nota atualizada com sucesso!', 'success');
                    await this.loadSaves();
                    this.renderCurrentTab();
                    closeModal();
                } else {
                    this.showNotification('Erro ao atualizar nota', 'error');
                }
            } catch (error) {
                console.error('Erro ao atualizar nota:', error);
                this.showNotification('Erro ao atualizar nota', 'error');
            }
        });

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Aplicar estilos inline
        Object.assign(modal.style, {
            display: 'flex',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '10000',
            justifyContent: 'center',
            alignItems: 'center'
        });

            // Estilos para o conteúdo do modal
            const content = modal.querySelector('.edit-note-content');
            Object.assign(content.style, {
                backgroundColor: 'var(--background-color, #fff)',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            });

            const header = modal.querySelector('.edit-note-header');
            Object.assign(header.style, {
                padding: '20px',
                borderBottom: '1px solid var(--border-color, #eaeaea)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            });

            const h3 = modal.querySelector('.edit-note-header h3');
            Object.assign(h3.style, {
                margin: '0',
                fontSize: '18px',
                color: 'var(--text-color, #333)',
                fontWeight: '600'
            });

            const closeEditBtn = modal.querySelector('.close-edit-note-btn');
            Object.assign(closeEditBtn.style, {
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: 'var(--text-color, #666)',
                lineHeight: '1',
                padding: '0',
                width: '32px',
                height: '32px'
            });

            const body = modal.querySelector('.edit-note-body');
            Object.assign(body.style, {
                padding: '20px',
                flexGrow: '1',
                overflowY: 'auto'
            });

            const textarea = modal.querySelector('.edit-note-textarea');
            Object.assign(textarea.style, {
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                border: '1px solid var(--border-color, #ddd)',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: 'var(--input-background, #fff)',
                color: 'var(--text-color, #333)',
                lineHeight: '1.6'
            });

            const footer = modal.querySelector('.edit-note-footer');
            Object.assign(footer.style, {
                padding: '20px',
                borderTop: '1px solid var(--border-color, #eaeaea)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
            });

            const saveBtn = modal.querySelector('.save-edit-note-btn');
            Object.assign(saveBtn.style, {
                padding: '10px 24px',
                backgroundColor: 'var(--accent-color, #2196f3)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            });

            const cancelBtn = modal.querySelector('.cancel-edit-note-btn');
            Object.assign(cancelBtn.style, {
                padding: '10px 24px',
                backgroundColor: 'var(--button-secondary, #e0e0e0)',
                color: 'var(--text-color, #333)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            });
    }

    readChapter(id) {
        // Navegar para o capítulo específico na tela da bíblia
        const capitulo = this.saves.capitulos?.find(c => c.id === id);
        if (capitulo) {
            this.navigateToChapter(capitulo.livro, capitulo.capitulo, capitulo.versao);
        }
    }

    navigateToVerse(reference, version) {
        // Parse da referência (ex: "gn1:1" ou "Gênesis 1:1")
        const match = reference.match(/^([0-9A-Za-zÀ-ÿ°]+)(\d+):(\d+)$/i);
        if (!match) {
            console.error('Formato de referência inválido:', reference);
            return;
        }

        const [, livro, capitulo, versiculo] = match;
        
        // Salvar estado no localStorage para biblia.html carregar
        const state = {
            version: version.toLowerCase(),
            book: livro.toLowerCase(),
            chapter: parseInt(capitulo),
            verse: parseInt(versiculo)
        };

        localStorage.setItem('bibleNavigationState', JSON.stringify(state));
        
        // Redirecionar
        window.location.href = 'biblia.html';
    }

    navigateToChapter(livro, capitulo, version) {
        // Salvar estado no localStorage para biblia.html carregar
        const state = {
            version: version.toLowerCase(),
            book: livro.toLowerCase(),
            chapter: parseInt(capitulo),
            verse: 1
        };

        localStorage.setItem('bibleNavigationState', JSON.stringify(state));
        
        // Redirecionar
        window.location.href = 'biblia.html';
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

