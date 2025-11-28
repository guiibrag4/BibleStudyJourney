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
        this.filteredSaves = {
            versiculos: [],
            capitulos: [],
            notas: []
        };
        this.searchQuery = '';
        this.selectedShareItem = null;
        this.init();
    }

    async init() {
        await this.loadSaves();
        this.setupEventListeners();
        this.setupSearchListeners();
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

            // Inicializar filteredSaves com todos os dados
            this.filterSaves();

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
            if (e.key === 'Escape') {
                if (modal?.style.display !== 'none') {
                    modal.style.display = 'none';
                }
                const shareModal = document.getElementById('share-modal');
                if (shareModal?.style.display === 'flex') {
                    shareModal.style.display = 'none';
                }
            }
        });

        // Event listeners do modal de compartilhamento
        const shareModal = document.getElementById('share-modal');
        const closeShareBtn = document.getElementById('close-share-btn');
        const downloadImageBtn = document.getElementById('download-image-btn');
        const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
        const copyTextBtn = document.getElementById('copy-text-btn');

        if (closeShareBtn) {
            closeShareBtn.addEventListener('click', () => {
                shareModal.style.display = 'none';
            });
        }

        // Fechar modal ao clicar no overlay
        shareModal?.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.style.display = 'none';
            }
        });

        if (downloadImageBtn) {
            downloadImageBtn.addEventListener('click', () => this.downloadAsImage());
        }

        if (shareWhatsappBtn) {
            shareWhatsappBtn.addEventListener('click', () => this.shareToWhatsApp());
        }

        if (copyTextBtn) {
            copyTextBtn.addEventListener('click', () => this.copyText());
        }

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
                return;
            }

            // Botão de compartilhar versículo
            if (e.target.closest('.share-versiculo-btn')) {
                const btn = e.target.closest('.share-versiculo-btn');
                const id = btn.dataset.id;
                this.openShareModal('versiculo', id);
                return;
            }

            // Botão de expandir versículo
            if (e.target.closest('.expand-versiculo-btn')) {
                const btn = e.target.closest('.expand-versiculo-btn');
                const id = btn.dataset.id;
                this.showFullContent('versiculo', id);
                return;
            }

            // Clicar no card de versículo navega (exceto botões de ação)
            const versiculoCard = e.target.closest('.versiculo-card');
            if (versiculoCard && 
                !e.target.closest('.delete-versiculo-btn') && 
                !e.target.closest('.share-versiculo-btn') && 
                !e.target.closest('.expand-versiculo-btn')) {
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
                return;
            }

            // Clicar no card de capítulo navega (exceto botão de excluir)
            const capituloCard = e.target.closest('.capitulo-card');
            if (capituloCard && !e.target.closest('.delete-capitulo-btn')) {
                const id = capituloCard.dataset.id;
                this.readChapter(id);
                return;
            }

            // Botão de editar nota
            if (e.target.closest('.edit-note-btn')) {
                const btn = e.target.closest('.edit-note-btn');
                const id = btn.dataset.id;
                this.editNote(id);
                return;
            }

            // Botão de compartilhar nota
            if (e.target.closest('.share-nota-btn')) {
                const btn = e.target.closest('.share-nota-btn');
                const id = btn.dataset.id;
                this.openShareModal('nota', id);
                return;
            }

            // Botão de excluir nota
            if (e.target.closest('.delete-nota-btn')) {
                const btn = e.target.closest('.delete-nota-btn');
                const id = btn.dataset.id;
                this.deleteItem('notas', id);
                return;
            }

            // Botão de expandir nota
            if (e.target.closest('.expand-nota-btn')) {
                const btn = e.target.closest('.expand-nota-btn');
                const id = btn.dataset.id;
                this.showFullContent('nota', id);
                return;
            }

            // Clicar no card de nota abre edição (exceto botões de excluir e expandir)
            const notaCard = e.target.closest('.nota-card');
            if (notaCard && !e.target.closest('.delete-nota-btn') && !e.target.closest('.expand-nota-btn')) {
                const id = notaCard.dataset.id;
                this.editNote(id);
                return;
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
        
        if (!this.filteredSaves.versiculos || this.filteredSaves.versiculos.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            if (this.searchQuery) {
                empty.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>Nenhum versículo encontrado</p>
                `;
            }
            return;
        }

        empty.style.display = 'none';
        
        grid.innerHTML = this.filteredSaves.versiculos.map(versiculo => `
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
                        <button class="action-btn share-versiculo-btn" data-id="${versiculo.id}" title="Compartilhar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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
        
        if (!this.filteredSaves.capitulos || this.filteredSaves.capitulos.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            if (this.searchQuery) {
                empty.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>Nenhum capítulo encontrado</p>
                `;
            }
            return;
        }

        empty.style.display = 'none';
        
        grid.innerHTML = this.filteredSaves.capitulos.map(capitulo => `
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
        
        if (!this.filteredSaves.notas || this.filteredSaves.notas.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            if (this.searchQuery) {
                empty.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>Nenhuma nota encontrada</p>
                `;
            }
            return;
        }

        empty.style.display = 'none';
        
        grid.innerHTML = this.filteredSaves.notas.map(nota => `
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
                        <button class="action-btn share-nota-btn" data-id="${nota.id}" title="Compartilhar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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

    // ========================================================================
    // FUNCIONALIDADE DE BUSCA
    // ========================================================================
    
    setupSearchListeners() {
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-search');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.filterSaves();
                this.renderCurrentTab();
                
                // Mostrar/esconder botão de limpar
                if (clearBtn) {
                    clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                this.filterSaves();
                this.renderCurrentTab();
                clearBtn.style.display = 'none';
                searchInput.focus();
            });
        }
    }

    filterSaves() {
        if (!this.searchQuery) {
            this.filteredSaves = {
                versiculos: this.saves.versiculos,
                capitulos: this.saves.capitulos,
                notas: this.saves.notas
            };
            return;
        }

        this.filteredSaves = {
            versiculos: this.saves.versiculos.filter(v => 
                v.reference.toLowerCase().includes(this.searchQuery) ||
                v.text.toLowerCase().includes(this.searchQuery) ||
                this.getColorName(v.color).toLowerCase().includes(this.searchQuery)
            ),
            capitulos: this.saves.capitulos.filter(c =>
                c.title.toLowerCase().includes(this.searchQuery) ||
                c.subtitle.toLowerCase().includes(this.searchQuery)
            ),
            notas: this.saves.notas.filter(n =>
                n.reference.toLowerCase().includes(this.searchQuery) ||
                n.text.toLowerCase().includes(this.searchQuery)
            )
        };
    }

    // ========================================================================
    // FUNCIONALIDADE DE COMPARTILHAMENTO
    // ========================================================================

    openShareModal(type, id) {
        const modal = document.getElementById('share-modal');
        
        let item;
        if (type === 'versiculo') {
            item = this.saves.versiculos?.find(v => v.id === id);
        } else if (type === 'nota') {
            item = this.saves.notas?.find(n => n.id === id);
        }

        if (!item) return;

        this.selectedShareItem = { type, item };
        this.renderShareTemplates();
        modal.style.display = 'flex';

        // Event listeners
        const closeBtn = modal.querySelector('.close-share-modal');
        closeBtn.onclick = () => modal.style.display = 'none';

        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };

        // Botões de ação
        document.getElementById('download-image').onclick = () => this.downloadAsImage();
        document.getElementById('share-whatsapp').onclick = () => this.shareToWhatsApp();
        document.getElementById('copy-text').onclick = () => this.copyText();
    }

    renderShareTemplates() {
        const container = document.getElementById('share-templates');
        const { type, item } = this.selectedShareItem;

        const templates = [
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
            }
        ];

        // Armazenar templates completos para uso no download
        this.availableTemplates = templates;

        container.innerHTML = templates.map(template => `
            <div class="share-template" data-template="${template.id}">
                <div class="template-preview" style="
                    background: ${template.gradient};
                    ${template.pattern ? `background-image: url('${template.pattern}');` : ''}
                    background-size: ${template.pattern ? '60px 60px' : 'cover'};
                    color: ${template.textColor};
                ">
                    <strong style="font-size: 0.9rem;">${item.reference}</strong><br><br>
                    <span style="font-size: 0.75rem; line-height: 1.4;">"${this.truncateText(item.text, 70)}"</span>
                </div>
                <div class="template-name">${template.name}</div>
            </div>
        `).join('');

        // Event listeners para selecionar template
        container.querySelectorAll('.share-template').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('.share-template').forEach(t => t.classList.remove('selected'));
                el.classList.add('selected');
            });
        });

        // Selecionar o primeiro por padrão
        container.querySelector('.share-template')?.classList.add('selected');
    }

    getSelectedTemplate() {
        const selected = document.querySelector('.share-template.selected');
        return selected ? selected.dataset.template : 'classic';
    }

    async downloadAsImage() {
        if (!window.html2canvas) {
            this.showNotification('Biblioteca html2canvas não carregada. Tente novamente.', 'error');
            return;
        }

        const { item } = this.selectedShareItem;
        const templateId = this.getSelectedTemplate();
        const template = this.availableTemplates?.find(t => t.id === templateId);

        if (!template) {
            this.showNotification('Selecione um template primeiro', 'error');
            return;
        }

        try {
            // Mostrar loading
            this.showNotification('Gerando imagem... ⏳', 'info');

            // Criar container temporário para renderização
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: -9999px;
                left: -9999px;
                width: 1080px;
                height: 1080px;
                background: ${template.gradient};
                ${template.pattern ? `background-image: url('${template.pattern}');` : ''}
                background-size: ${template.pattern ? '120px 120px' : 'cover'};
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 80px;
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            `;

            // Conteúdo da imagem
            container.innerHTML = `
                <div style="
                    width: 100%;
                    max-width: 900px;
                    text-align: center;
                    color: ${template.textColor};
                ">
                    <!-- Ícone de citação superior -->
                    <div style="font-size: 80px; opacity: 0.3; margin-bottom: 40px;">"</div>
                    
                    <!-- Referência bíblica -->
                    <h2 style="
                        font-size: 48px;
                        font-weight: 700;
                        margin: 0 0 60px 0;
                        letter-spacing: -0.5px;
                        text-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">${item.reference}</h2>
                    
                    <!-- Texto do versículo -->
                    <p style="
                        font-size: 32px;
                        line-height: 1.8;
                        margin: 0 0 60px 0;
                        font-weight: 400;
                        text-shadow: 0 1px 5px rgba(0,0,0,0.1);
                        max-width: 800px;
                        margin-left: auto;
                        margin-right: auto;
                    ">"${item.text}"</p>
                    
                    <!-- Ícone de citação inferior -->
                    <div style="font-size: 80px; opacity: 0.3; margin-bottom: 60px; transform: rotate(180deg);">"</div>
                    
                    <!-- Rodapé -->
                    <div style="
                        font-size: 24px;
                        opacity: 0.7;
                        font-weight: 500;
                        letter-spacing: 1px;
                    ">📖 Bible Study Journey</div>
                </div>
            `;

            document.body.appendChild(container);

            // Aguardar fontes carregarem
            await document.fonts.ready;

            // Pequeno delay para garantir renderização
            await new Promise(resolve => setTimeout(resolve, 100));

            // Gerar canvas com alta qualidade
            const canvas = await html2canvas(container, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            // Remover container temporário
            document.body.removeChild(container);

            // Converter para blob e fazer download
            canvas.toBlob((blob) => {
                if (!blob) {
                    this.showNotification('Erro ao gerar imagem', 'error');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${item.reference.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.showNotification('Imagem baixada com sucesso! 📸', 'success');
                document.getElementById('share-modal').style.display = 'none';
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            this.showNotification('Erro ao gerar imagem: ' + error.message, 'error');
        }
    }

    shareToWhatsApp() {
        const { item } = this.selectedShareItem;
        const text = `*${item.reference}*\n\n"${item.text}"\n\n_Compartilhado via Bible Study Journey_`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    async copyText() {
        const { item } = this.selectedShareItem;
        const text = `${item.reference}\n\n"${item.text}"\n\nCompartilhado via Bible Study Journey`;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Texto copiado para a área de transferência!', 'success');
            document.getElementById('share-modal').style.display = 'none';
        } catch (error) {
            console.error('Erro ao copiar:', error);
            this.showNotification('Erro ao copiar texto', 'error');
        }
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

