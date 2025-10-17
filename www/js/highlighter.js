// Arquivo: www/js/highlighter.js
// Sistema de Grifos e Notas para Bible Study Journey
// ATUALIZADO: Usa saves-manager.js para sincronizar com API/localStorage

class BibleHighlighter {
    constructor() {
        this.colors = {
            yellow: { name: "Amarelo", light: "#fff9c4", dark: "#ffc107" },
            green: { name: "Verde", light: "#c8e6c9", dark: "#4caf50" },
            blue: { name: "Azul", light: "#bbdefb", dark: "#2196f3" },
            red: { name: "Vermelho", light: "#ffcdd2", dark: "#f44336" },
            purple: { name: "Roxo", light: "#e1bee7", dark: "#9c27b0" },
            orange: { name: "Laranja", light: "#ffe0b2", dark: "#ff9800" },
            pink: { name: "Rosa", light: "#f8bbd9", dark: "#e91e63" },
            cyan: { name: "Ciano", light: "#b2ebf2", dark: "#00bcd4" }
        };
        this.currentVerse = null;
        
        // Mapa de nomes de livros para abreviações
        this.bookAbbreviations = {
            "Gênesis": "gn", "Êxodo": "ex", "Levítico": "lv", "Números": "nm", "Deuteronômio": "dt",
            "Josué": "js", "Juízes": "jz", "Rute": "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
            "1 Reis": "1rs", "2 Reis": "2rs", "1 Crônicas": "1cr", "2 Crônicas": "2cr",
            "Esdras": "ed", "Neemias": "ne", "Ester": "et", "Jó": "jó", "Salmos": "sl",
            "Provérbios": "pv", "Eclesiastes": "ec", "Cantares": "ct", "Isaías": "is",
            "Jeremias": "jr", "Lamentações": "lm", "Ezequiel": "ez", "Daniel": "dn",
            "Oséias": "os", "Joel": "jl", "Amós": "am", "Obadias": "ob", "Jonas": "jn",
            "Miquéias": "mq", "Naum": "na", "Habacuque": "hb", "Sofonias": "sf",
            "Ageu": "ag", "Zacarias": "zc", "Malaquias": "ml", "Mateus": "mt",
            "Marcos": "mc", "Lucas": "lc", "João": "jo", "Atos": "at", "Romanos": "rm",
            "1 Coríntios": "1co", "2 Coríntios": "2co", "Gálatas": "gl",
            "Efésios": "ef", "Filipenses": "fp", "Colossenses": "cl",
            "1 Tessalonicenses": "1ts", "2 Tessalonicenses": "2ts",
            "1 Timóteo": "1tm", "2 Timóteo": "2tm", "Tito": "tt", "Filemom": "fl",
            "Hebreus": "hb", "Tiago": "tg", "1 Pedro": "1pe", "2 Pedro": "2pe",
            "1 João": "1jo", "2 João": "2jo", "3 João": "3jo", "Judas": "jd",
            "Apocalipse": "ap"
        };
        
        this.init();
    }

    init() {
        this.createColorPalette();
        this.createNoteModal();
        this.setupEventListeners();
        this.loadHighlightsAndNotes();
        // Adicionar listener para quando o capítulo mudar
        window.addEventListener("chapterChanged", () => this.loadHighlightsAndNotes());
    }

    createColorPalette() {
        const palette = document.createElement("div");
        palette.id = "color-palette";
        palette.className = "color-palette";
        palette.style.display = "none";
        
        palette.innerHTML = `
            <div class="palette-header">
                <span>Escolha uma cor:</span>
                <button class="palette-close">×</button>
            </div>
            <div class="color-options">
                ${Object.entries(this.colors).map(([key, color]) => `
                    <button class="color-option" data-color="${key}" style="background: ${color.light}; border: 2px solid ${color.dark};" title="${color.name}">
                        <span class="color-name">${color.name}</span>
                    </button>
                `).join("")}
            </div>
            <div class="palette-actions">
                <button class="action-button note-button">📝 Adicionar Nota</button>
                <button class="action-button remove-button">🗑️ Remover Grifo</button>
            </div>
        `;
        
        document.body.appendChild(palette);
    }

    createNoteModal() {
        const modal = document.createElement("div");
        modal.id = "note-modal";
        modal.className = "note-modal";
        modal.style.display = "none";
        
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <h3>Adicionar Nota</h3>
                    <button class="note-modal-close">×</button>
                </div>
                <div class="note-modal-body">
                    <div class="verse-info">
                        <span id="note-verse-ref"></span>
                    </div>
                    <textarea id="note-text" placeholder="Digite sua nota aqui..." rows="6"></textarea>
                </div>
                <div class="note-modal-footer">
                    <button class="note-save-btn">Salvar Nota</button>
                    <button class="note-cancel-btn">Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Clique em versículos
        document.addEventListener("click", (e) => {
            const verse = e.target.closest("p[id^='verse-']");
            if (verse && !e.target.closest(".color-palette") && !e.target.closest(".note-modal")) {
                this.showColorPalette(verse, e);
            }
        });

  document.addEventListener("click", (e) => {
            const colorBtn = e.target.closest(".color-option");
            if (colorBtn) {
                const color = colorBtn.dataset.color;
                this.applyHighlight(color);
                return;
            }
            
            const noteBtn = e.target.closest(".note-button");
            if (noteBtn) {
                this.showNoteModal();
                return;
            }
            
            const removeBtn = e.target.closest(".remove-button");
            if (removeBtn) {
                this.removeHighlight();
                return;
            }
            
            const paletteCloseBtn = e.target.closest(".palette-close");
            if (paletteCloseBtn) {
                this.hideColorPalette();
                return;
            }
        });

         document.addEventListener("click", async (e) => {
            const closeBtn = e.target.closest(".note-modal-close");
            const cancelBtn = e.target.closest(".note-cancel-btn");
            const saveBtn = e.target.closest(".note-save-btn");
            
            if (closeBtn || cancelBtn) {
                this.hideNoteModal();
                return;
            }
            
            if (saveBtn) {
                // Feedback de carregamento
                const btn = saveBtn;
                const prevText = btn.textContent;
                btn.disabled = true;
                btn.textContent = "Salvando...";

                try {
                    await this.saveNote(); // já mostra notificação e fecha o modal
                    // Recarrega indicadores sem esperar próxima troca de capítulo
                    await this.loadHighlightsAndNotes();
                } catch (err) {
                    console.error('Erro ao salvar nota:', err);
                    this.showNotification("Erro ao salvar nota", "error");
                } finally {
                    btn.disabled = false;
                    btn.textContent = prevText;
                }
            }
        });

        // Fechar paleta ao clicar fora
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".color-palette") && !e.target.closest("p[id^='verse-']")) {
                this.hideColorPalette();
            }
        });
    }

    showColorPalette(verse, event) {
        this.currentVerse = verse;
        const palette = document.getElementById("color-palette");
        
        // Posicionar a paleta próxima ao versículo
        const rect = verse.getBoundingClientRect();
        palette.style.position = "fixed";
        palette.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 300)}px`;
        palette.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
        palette.style.display = "block";
        palette.style.zIndex = "1000";
        
        event.stopPropagation();
    }

    hideColorPalette() {
        document.getElementById("color-palette").style.display = "none";
        this.currentVerse = null;
    }

    async showNoteModal() {
        if (!this.currentVerse) return;
        
        const modal = document.getElementById("note-modal");
        const verseRef = document.getElementById("note-verse-ref");
        const noteText = document.getElementById("note-text");
        
        const reference = this.getVerseReference(this.currentVerse);
        verseRef.textContent = reference.display;
        
        // Buscar nota existente usando saves-manager
        const existingNote = await this.getExistingNote(reference.api);
        noteText.value = existingNote || "";
        
        modal.style.display = "flex";
        noteText.focus();
        this.hideColorPalette();
    }

    hideNoteModal() {
        document.getElementById("note-modal").style.display = "none";
    }

    async applyHighlight(color) {
        if (!this.currentVerse) return;
        
        // Remover classes de cor existentes
        Object.keys(this.colors).forEach(c => {
            this.currentVerse.classList.remove(`highlight-${c}`);
        });
        
        // Adicionar nova cor
        this.currentVerse.classList.add(`highlight-${color}`);
        this.currentVerse.dataset.highlightColor = color;
        
        // Salvar usando saves-manager
        await this.saveHighlight(this.currentVerse, color);
        
        this.hideColorPalette();
        this.showNotification(`Versículo grifado em ${this.colors[color].name.toLowerCase()}!`);
    }

    async removeHighlight() {
        if (!this.currentVerse) return;
        
        // Remover classes de cor
        Object.keys(this.colors).forEach(c => {
            this.currentVerse.classList.remove(`highlight-${c}`);
        });
        
        delete this.currentVerse.dataset.highlightColor;
        
        // Remover usando saves-manager
        await this.removeHighlightFromStorage(this.currentVerse);
        
        this.hideColorPalette();
        this.showNotification("Grifo removido!");
    }

  async saveNote() {
        if (!this.currentVerse) return;
        
        const noteText = document.getElementById("note-text").value.trim();
        const reference = this.getVerseReference(this.currentVerse);
        
        // Adicionar ou remover indicador de nota
        if (noteText) {
            this.addNoteIndicator(this.currentVerse);
        } else {
            this.removeNoteIndicator(this.currentVerse);
        }
        
        // Salvar usando saves-manager
        await this.saveNoteToStorage(reference.api, noteText);
        
        this.hideNoteModal();
        this.showNotification(noteText ? "Nota salva!" : "Nota removida!");
    }

    addNoteIndicator(verse) {
        // Remover indicador existente
        let existingIndicator = verse.querySelector(".note-indicator");
        if (!existingIndicator) {
            existingIndicator = document.createElement("span");
            existingIndicator.className = "note-indicator";
            existingIndicator.innerHTML = "📝";
            existingIndicator.title = "Este versículo possui uma nota";
            verse.appendChild(existingIndicator);
        }
    }

    removeNoteIndicator(verse) {
        const existingIndicator = verse.querySelector(".note-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    getVerseReference(verse) {
        const verseNumber = verse.id.replace("verse-", "");
        const bookChapterText = document.getElementById("chapter-selector")?.textContent || "";
        
        // Parsear "Gênesis 1" -> livro: "Gênesis", capitulo: "1"
        const match = bookChapterText.match(/^(.+?)\s+(\d+)$/);
        
        if (!match) {
            console.error('Formato de capítulo inválido:', bookChapterText);
            return {
                display: `${bookChapterText}:${verseNumber}`,
                api: `${bookChapterText}:${verseNumber}`
            };
        }
        
        const [, bookName, chapter] = match;
        const bookAbbr = this.bookAbbreviations[bookName] || bookName.toLowerCase();
        
        return {
            display: `${bookName} ${chapter}:${verseNumber}`,
            api: `${bookAbbr}${chapter}:${verseNumber}`  // Formato: "gn1:1"
        };
    }

    async getExistingNote(reference) {
        try {
            if (!window.savesManager) {
                console.warn('savesManager não disponível ainda');
                return "";
            }
            const note = await window.savesManager.notes.getByReference(reference);
            return note?.text || "";
        } catch (error) {
            console.error('Erro ao buscar nota existente:', error);
            return "";
        }
    }

    async saveHighlight(verse, color) {
        try {
            if (!window.savesManager) {
                console.warn('savesManager não disponível ainda');
                return;
            }

            const reference = this.getVerseReference(verse);
            const text = verse.textContent.replace(/\s*📝\s*$/, "").replace(/^\d+\s*/, "").trim();
            const version = document.getElementById("version-selector")?.textContent || "NVI";

            console.log('[highlighter] Salvando grifo:', {
                reference: reference.api,
                version,
                text: text.substring(0, 50) + '...',
                color
            });

            await window.savesManager.highlights.save({
                reference: reference.api,
                version,
                text,
                color
            });
        } catch (error) {
            console.error('Erro ao salvar grifo:', error);
            this.showNotification('Erro ao salvar grifo', 'error');
        }
    }

    async removeHighlightFromStorage(verse) {
        try {
            if (!window.savesManager) {
                console.warn('savesManager não disponível ainda');
                return;
            }

            const reference = this.getVerseReference(verse);
            await window.savesManager.highlights.remove(reference.api);
        } catch (error) {
            console.error('Erro ao remover grifo:', error);
        }
    }

    async saveNoteToStorage(reference, noteText) {
        try {
            if (!window.savesManager) {
                console.warn('savesManager não disponível ainda');
                return;
            }

            const version = document.getElementById("version-selector")?.textContent || "NVI";

            if (noteText) {
                await window.savesManager.notes.save({
                    reference,
                    version,
                    text: noteText
                });
            } else {
                // Se texto vazio, remover a nota
                await window.savesManager.notes.remove(reference);
            }
        } catch (error) {
            console.error('Erro ao salvar nota:', error);
        }
    }

    async loadHighlightsAndNotes() {
        try {
            if (!window.savesManager) {
                console.warn('savesManager não disponível ainda, tentando novamente em 1s');
                setTimeout(() => this.loadHighlightsAndNotes(), 1000);
                return;
            }

            const bookChapterText = document.getElementById("chapter-selector")?.textContent || "";
            const match = bookChapterText.match(/^(.+?)\s+(\d+)$/);
            
            if (!match) {
                console.warn('Formato de capítulo inválido:', bookChapterText);
                return;
            }
            
            const [, bookName, chapter] = match;
            const bookAbbr = this.bookAbbreviations[bookName] || bookName.toLowerCase();
            const currentBookChapter = `${bookAbbr}${chapter}`;  // Ex: "gn1"

            console.log('[highlighter] Carregando grifos e notas para:', currentBookChapter);

            // Limpar todos os grifos e indicadores de nota existentes na página
            document.querySelectorAll("p[id^='verse-']").forEach(verseElement => {
                Object.keys(this.colors).forEach(c => {
                    verseElement.classList.remove(`highlight-${c}`);
                });
                this.removeNoteIndicator(verseElement);
            });
            
            // Carregar grifos
            const highlights = await window.savesManager.highlights.getAll();
            highlights.forEach(highlight => {
                if (highlight.reference.startsWith(currentBookChapter)) {
                    const verseElement = this.findVerseElement(highlight.reference);
                    if (verseElement) {
                        verseElement.classList.add(`highlight-${highlight.color}`);
                        verseElement.dataset.highlightColor = highlight.color;
                    }
                }
            });
                
            // Carregar indicadores de notas
            const notes = await window.savesManager.notes.getAll();
            notes.forEach(note => {
                if (note.reference.startsWith(currentBookChapter)) {
                    const verseElement = this.findVerseElement(note.reference);
                    if (verseElement) {
                        this.addNoteIndicator(verseElement);
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao carregar grifos e notas:', error);
        }
    }

    findVerseElement(reference) {
        // A referência está no formato "gn1:1"
        const parts = reference.split(":");
        if (parts.length < 2) return null;
        const verseNumber = parts[parts.length - 1];
        return document.getElementById(`verse-${verseNumber}`);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement("div");
        notification.className = "highlight-notification";
        notification.textContent = message;
        
        const colors = {
            success: "#4caf50",
            error: "#f44336",
            info: "#2196f3"
        };

        Object.assign(notification.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            background: colors[type] || colors.success,
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: "10000",
            transform: "translateX(100%)",
            transition: "transform 0.3s ease",
            fontSize: "14px",
            fontWeight: "500"
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = "translateX(0)";
        }, 10);

        setTimeout(() => {
            notification.style.transform = "translateX(100%)";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Sistema de Salvamento de Páginas
// ATUALIZADO: Usa saves-manager.js
class PageSaver {
    constructor() {
        this.bookAbbreviations = {
            "Gênesis": "gn", "Êxodo": "ex", "Levítico": "lv", "Números": "nm", "Deuteronômio": "dt",
            "Josué": "js", "Juízes": "jz", "Rute": "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
            "1 Reis": "1rs", "2 Reis": "2rs", "1 Crônicas": "1cr", "2 Crônicas": "2cr",
            "Esdras": "ed", "Neemias": "ne", "Ester": "et", "Jó": "jó", "Salmos": "sl",
            "Provérbios": "pv", "Eclesiastes": "ec", "Cantares": "ct", "Isaías": "is",
            "Jeremias": "jr", "Lamentações": "lm", "Ezequiel": "ez", "Daniel": "dn",
            "Oséias": "os", "Joel": "jl", "Amós": "am", "Obadias": "ob", "Jonas": "jn",
            "Miquéias": "mq", "Naum": "na", "Habacuque": "hb", "Sofonias": "sf",
            "Ageu": "ag", "Zacarias": "zc", "Malaquias": "ml", "Mateus": "mt",
            "Marcos": "mc", "Lucas": "lc", "João": "jo", "Atos": "at", "Romanos": "rm",
            "1 Coríntios": "1co", "2 Coríntios": "2co", "Gálatas": "gl",
            "Efésios": "ef", "Filipenses": "fp", "Colossenses": "cl",
            "1 Tessalonicenses": "1ts", "2 Tessalonicenses": "2ts",
            "1 Timóteo": "1tm", "2 Timóteo": "2tm", "Tito": "tt", "Filemom": "fl",
            "Hebreus": "hb", "Tiago": "tg", "1 Pedro": "1pe", "2 Pedro": "2pe",
            "1 João": "1jo", "2 João": "2jo", "3 João": "3jo", "Judas": "jd",
            "Apocalipse": "ap"
        };
        this.init();
    }

    init() {
        this.setupSavePageButton();
    }

    setupSavePageButton() {
        const savePageBtn = document.querySelector(".save-page");
        if (savePageBtn) {
            savePageBtn.addEventListener("click", () => {
                this.saveCurrentPage();
            });
        }
    }

    async saveCurrentPage() {
        try {
            if (!window.savesManager) {
                this.showNotification("Sistema de saves não disponível", "error");
                return;
            }

            const chapterInfo = document.getElementById("chapter-selector")?.textContent || "";
            const versionInfo = document.getElementById("version-selector")?.textContent || "NVI";
            
            if (!chapterInfo) {
                this.showNotification("Nenhuma página para salvar", "error");
                return;
            }

            // Parsear "Gênesis 1" -> livro: "Gênesis", capitulo: 1
            const match = chapterInfo.match(/^(.+?)\s+(\d+)$/);
            if (!match) {
                this.showNotification("Formato de capítulo inválido", "error");
                return;
            }

            const [, bookName, capituloStr] = match;
            const bookAbbr = this.bookAbbreviations[bookName] || bookName.toLowerCase();
            const capitulo = parseInt(capituloStr);

            // Contar versículos na página atual
            const verses = document.querySelectorAll("[id^='verse-']");
            const verseCount = verses.length;

            const result = await window.savesManager.chapters.save({
                title: `${bookName} ${capitulo}`,
                subtitle: `Versão ${versionInfo}`,
                verseCount,
                livro: bookAbbr,
                capitulo,
                versao: versionInfo
            });

            if (result.success === false && result.message === 'Capítulo já salvo') {
                this.showNotification("Esta página já está salva!", "info");
            } else if (result.success || result.chapter) {
                this.showNotification("Página salva com sucesso!", "success");
            } else {
                this.showNotification("Erro ao salvar página", "error");
            }
        } catch (error) {
            console.error('Erro ao salvar página:', error);
            this.showNotification("Erro ao salvar página", "error");
        }
    }

    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = "page-save-notification";
        notification.textContent = message;
        
        const colors = {
            success: "#4caf50",
            error: "#f44336",
            info: "#2196f3"
        };

        Object.assign(notification.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            background: colors[type] || colors.info,
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: "10000",
            transform: "translateX(100%)",
            transition: "transform 0.3s ease",
            fontSize: "14px",
            fontWeight: "500"
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = "translateX(0)";
        }, 10);

        setTimeout(() => {
            notification.style.transform = "translateX(100%)";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar as classes
document.addEventListener("DOMContentLoaded", () => {
    window.bibleHighlighter = new BibleHighlighter();
    window.pageSaver = new PageSaver();
});

