// Sistema de Grifos e Notas para Bible Study Journey
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
                <button class="palette-close" onclick="this.parentElement.parentElement.style.display=\'none\'">×</button>
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
            const verse = e.target.closest("p[id^=\'verse-\']");
            if (verse && !e.target.closest(".color-palette") && !e.target.closest(".note-modal")) {
                this.showColorPalette(verse, e);
            }
        });

        // Eventos da paleta de cores
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("color-option")) {
                const color = e.target.dataset.color;
                this.applyHighlight(color);
            }
            
            if (e.target.classList.contains("note-button")) {
                this.showNoteModal();
            }
            
            if (e.target.classList.contains("remove-button")) {
                this.removeHighlight();
            }
        });

        // Eventos do modal de notas
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("note-modal-close") || e.target.classList.contains("note-cancel-btn")) {
                this.hideNoteModal();
            }
            
            if (e.target.classList.contains("note-save-btn")) {
                this.saveNote();
            }
        });

        // Fechar paleta ao clicar fora
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".color-palette") && !e.target.closest("p[id^=\'verse-\']")) {
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

    showNoteModal() {
        if (!this.currentVerse) return;
        
        const modal = document.getElementById("note-modal");
        const verseRef = document.getElementById("note-verse-ref");
        const noteText = document.getElementById("note-text");
        
        verseRef.textContent = this.getVerseReference(this.currentVerse);
        noteText.value = this.getExistingNote(this.currentVerse) || "";
        
        modal.style.display = "flex";
        noteText.focus();
        this.hideColorPalette();
    }

    hideNoteModal() {
        document.getElementById("note-modal").style.display = "none";
    }

    applyHighlight(color) {
        if (!this.currentVerse) return;
        
        // Remover classes de cor existentes
        Object.keys(this.colors).forEach(c => {
            this.currentVerse.classList.remove(`highlight-${c}`);
        });
        
        // Adicionar nova cor
        this.currentVerse.classList.add(`highlight-${color}`);
        this.currentVerse.dataset.highlightColor = color;
        
        // Salvar no localStorage
        this.saveHighlight(this.currentVerse, color);
        
        this.hideColorPalette();
        this.showNotification(`Versículo grifado em ${this.colors[color].name.toLowerCase()}!`);
    }

    removeHighlight() {
        if (!this.currentVerse) return;
        
        // Remover classes de cor
        Object.keys(this.colors).forEach(c => {
            this.currentVerse.classList.remove(`highlight-${c}`);
        });
        
        delete this.currentVerse.dataset.highlightColor;
        
        // Remover do localStorage
        this.removeHighlightFromStorage(this.currentVerse);
        
        this.hideColorPalette();
        this.showNotification("Grifo removido!");
    }

    saveNote() {
        if (!this.currentVerse) return;
        
        const noteText = document.getElementById("note-text").value.trim();
        
        // Adicionar indicador de nota
        if (noteText) {
            this.addNoteIndicator(this.currentVerse);
        } else {
            this.removeNoteIndicator(this.currentVerse);
        }
        
        // Salvar no localStorage
        this.saveNoteToStorage(this.currentVerse, noteText);
        
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
        const bookChapter = document.getElementById("chapter-selector")?.textContent || "";
        return `${bookChapter}:${verseNumber}`;
    }

    getExistingNote(verse) {
        const saves = JSON.parse(localStorage.getItem("bibleStudySaves") || "{}");
        const reference = this.getVerseReference(verse);
        const note = saves.notas?.find(n => n.reference === reference);
        return note?.text || "";
    }

    saveHighlight(verse, color) {
        const saves = JSON.parse(localStorage.getItem("bibleStudySaves") || "{}");
        if (!saves.versiculos) saves.versiculos = [];
        
        const reference = this.getVerseReference(verse);
        const text = verse.textContent.replace(/\s*📝\s*$/, "").trim(); // Remover o indicador de nota antes de salvar o texto
        
        // Remover grifo existente para este versículo (usando a referência completa)
        saves.versiculos = saves.versiculos.filter(v => v.reference !== reference);
        
        // Adicionar novo grifo
        saves.versiculos.push({
            id: `v${Date.now()}`,
            reference: reference,
            version: document.getElementById("version-selector")?.textContent || "NVI",
            text: text,
            color: color,
            date: new Date().toLocaleDateString("pt-BR")
        });
        
        localStorage.setItem("bibleStudySaves", JSON.stringify(saves));
    }

    removeHighlightFromStorage(verse) {
        const saves = JSON.parse(localStorage.getItem("bibleStudySaves") || "{}");
        if (!saves.versiculos) return;
        
        const reference = this.getVerseReference(verse);
        saves.versiculos = saves.versiculos.filter(v => v.reference !== reference);
        
        localStorage.setItem("bibleStudySaves", JSON.stringify(saves));
    }

    saveNoteToStorage(verse, noteText) {
        const saves = JSON.parse(localStorage.getItem("bibleStudySaves") || "{}");
        if (!saves.notas) saves.notas = [];
        
        const reference = this.getVerseReference(verse);
        
        // Remover nota existente para este versículo (usando a referência completa)
        saves.notas = saves.notas.filter(n => n.reference !== reference);
        
        if (noteText) {
            // Adicionar nova nota
            saves.notas.push({
                id: `n${Date.now()}`,
                reference: reference,
                version: document.getElementById("version-selector")?.textContent || "NVI",
                text: noteText,
                date: new Date().toLocaleDateString("pt-BR")
            });
        }
        
        localStorage.setItem("bibleStudySaves", JSON.stringify(saves));
    }

    loadHighlightsAndNotes() {
        const saves = JSON.parse(localStorage.getItem("bibleStudySaves") || "{}");
        const currentBookChapter = document.getElementById("chapter-selector")?.textContent || "";

        // Limpar todos os grifos e indicadores de nota existentes na página
        document.querySelectorAll("p[id^=\'verse-\']").forEach(verseElement => {
            Object.keys(this.colors).forEach(c => {
                verseElement.classList.remove(`highlight-${c}`);
            });
            this.removeNoteIndicator(verseElement);
        });
        
        // Carregar grifos para o capítulo atual
        if (saves.versiculos) {
            saves.versiculos.forEach(highlight => {
                if (highlight.reference.startsWith(currentBookChapter)) {
                    const verseElement = this.findVerseElement(highlight.reference);
                    if (verseElement) {
                        verseElement.classList.add(`highlight-${highlight.color}`);
                        verseElement.dataset.highlightColor = highlight.color;
                    }
                }
            });
        }
            
        // Carregar indicadores de notas para o capítulo atual
        if (saves.notas) {
            saves.notas.forEach(note => {
                if (note.reference.startsWith(currentBookChapter)) {
                    const verseElement = this.findVerseElement(note.reference);
                    if (verseElement) {
                        this.addNoteIndicator(verseElement);
                    }
                }
            });
        }
    }

    findVerseElement(reference) {
        // A referência agora inclui Livro e Capítulo, e Versículo
        const parts = reference.split(":");
        if (parts.length < 2) return null; // Garante que a referência está no formato esperado
        const verseNumber = parts[parts.length - 1];
        return document.getElementById(`verse-${verseNumber}`);
    }

    showNotification(message) {
        const notification = document.createElement("div");
        notification.className = "highlight-notification";
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#4caf50",
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
class PageSaver {
    constructor() {
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

    saveCurrentPage() {
        const chapterInfo = document.getElementById("chapter-selector")?.textContent || "";
        const versionInfo = document.getElementById("version-selector")?.textContent || "NVI";
        
        if (!chapterInfo) {
            this.showNotification("Nenhuma página para salvar", "error");
            return;
        }

        const saves = JSON.parse(localStorage.getItem("bibleStudySaves") || "{}");
        if (!saves.capitulos) saves.capitulos = [];

        // Verificar se já está salvo
        const alreadySaved = saves.capitulos.find(c => c.title === chapterInfo);
        if (alreadySaved) {
            this.showNotification("Esta página já está salva!", "info");
            return;
        }

        // Contar versículos na página atual
        const verses = document.querySelectorAll("[id^=\'verse-\']");
        const verseCount = verses.length;

        // Adicionar nova página salva
        saves.capitulos.push({
            id: `c${Date.now()}`,
            title: chapterInfo,
            subtitle: `Versão ${versionInfo}`,
            verseCount: verseCount,
            date: new Date().toLocaleDateString("pt-BR")
        });

        localStorage.setItem("bibleStudySaves", JSON.stringify(saves));
        this.showNotification("Página salva com sucesso!", "success");
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


