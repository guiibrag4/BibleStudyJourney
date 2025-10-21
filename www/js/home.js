const API_URL = "https://www.abibliadigital.com.br/api";
const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJXZWQgQXByIDE2IDIwMjUgMTQ6MjU6MjkgR01UKzAwMDAuNjdmZmIwZWI1ZDA2ZjYwMDI4MzczZjlmIiwiaWF0IjoxNzQ0ODEzNTI5fQ.4SyoatsJ2L0lWPalu_2PsOA6-Somv-gDdDHSHR2OyfA";

// ===== ESTADO GLOBAL =====
let versaoAtual = "nvi";
let livroAtual = "gn";
let capituloAtual = 1;
let versoAtual = 1;

// Variáveis temporárias para navegação fluida
let tempLivro = null;
let tempCapitulo = null;

// ===== ELEMENTOS DO DOM =====
const versionSelector = document.getElementById('version-selector');
const chapterSelector = document.getElementById('chapter-selector');
const bibleContentEl = document.getElementById('bible-content');
const versionDialog = document.getElementById('version-dialog');
const bookDialog = document.getElementById('book-dialog');
const chapterDialog = document.getElementById('chapter-dialog');
const verseDialog = document.getElementById('verse-dialog');
const overlay = document.getElementById('overlay');
const versionSelect = document.getElementById('version-select');

// ===== UTILITÁRIOS =====
function capitalizeBookName(book) {
    const bookNames = {
        gn: "Gênesis", ex: "Êxodo", lv: "Levítico", nm: "Números", dt: "Deuteronômio",
        js: "Josué", jz: "Juízes", rt: "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel",
        "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas",
        ed: "Esdras", ne: "Neemias", et: "Ester", jó: "Jó", sl: "Salmos",
        pv: "Provérbios", ec: "Eclesiastes", ct: "Cantares", is: "Isaías",
        jr: "Jeremias", lm: "Lamentações", ez: "Ezequiel", dn: "Daniel",
        os: "Oséias", jl: "Joel", am: "Amós", ob: "Obadias", jn: "Jonas",
        mq: "Miquéias", na: "Naum", hb: "Habacuque", sf: "Sofonias",
        ag: "Ageu", zc: "Zacarias", ml: "Malaquias", mt: "Mateus",
        mc: "Marcos", lc: "Lucas", jo: "João", at: "Atos", rm: "Romanos",
        "1co": "1 Coríntios", "2co": "2 Coríntios", gl: "Gálatas",
        ef: "Efésios", fp: "Filipenses", cl: "Colossenses",
        "1ts": "1 Tessalonicenses", "2ts": "2 Tessalonicenses",
        "1tm": "1 Timóteo", "2tm": "2 Timóteo", tt: "Tito", fl: "Filemom",
        hb: "Hebreus", tg: "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro",
        "1jo": "1 João", "2jo": "2 João", "3jo": "3 João", jd: "Judas",
        ap: "Apocalipse"
    };
    return bookNames[book] || book;
}

function updateChapterSelectorStyle() {
    if (livroAtual === "1ts" || livroAtual === "2ts") {
        chapterSelector.classList.add("tessalonicenses");
    } else {
        chapterSelector.classList.remove("tessalonicenses");
    }
}

function updateUI() {
    chapterSelector.textContent = `${capitalizeBookName(livroAtual)} ${capituloAtual}`;
    versionSelector.textContent = versaoAtual.toUpperCase();
    updateChapterSelectorStyle();
}

// ===== GERENCIAMENTO DE ESTADO =====
async function saveCurrentState() {
    try {
        const state = {
            version: versaoAtual,
            book: livroAtual,
            chapter: capituloAtual,
            verse: versoAtual,
        };
        await localforage.setItem('bibleAppState', state);
    } catch (error) {
        console.error("Erro ao salvar o estado:", error);
    }
}

async function loadInitialState() {
    try {
        const savedState = await localforage.getItem('bibleAppState');

        if (savedState) {
            versaoAtual = savedState.version || "nvi";
            livroAtual = savedState.book || "gn";
            capituloAtual = savedState.chapter || 1;
            versoAtual = savedState.verse || 1;
        }

        updateUI();
        await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
    } catch (error) {
        console.error("Erro ao carregar o estado inicial:", error);
    }
}

// ===== GERENCIAMENTO DE MODAIS =====
function openDialog(dialog) {
    dialog.classList.add('open');
    overlay.classList.add('open');
}

function closeDialog(dialog) {
    dialog.classList.remove('open');
    overlay.classList.remove('open');
}

function closeAllModals() {
    const modals = document.querySelectorAll('.dialog');
    modals.forEach(modal => modal.classList.remove('open'));
    overlay.classList.remove('open');
}

// ===== API CALLS =====
async function fetchBibleContent(version, book, chapter) {
    try {
        const response = await fetch(`${API_URL}/verses/${version}/${book}/${chapter}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const data = await response.json();
        console.log("Conteúdo da Bíblia:", data);
        renderBibleContent(data.verses);
    } catch (error) {
        console.error("Erro ao buscar conteúdo da Bíblia:", error);
    }
}

async function fetchChapters(book) {
    try {
        const response = await fetch(`${API_URL}/books/${book}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const data = await response.json();
        const chapters = Array.from({ length: data.chapters }, (_, i) => i + 1);

        const chapterGrid = document.getElementById('chapter-grid');
        chapterGrid.innerHTML = chapters
            .map(chapter => `<button class="chapter-item" data-chapter="${chapter}">${chapter}</button>`)
            .join('');

        return data.chapters;
    } catch (error) {
        console.error("Erro ao buscar capítulos:", error);
        return [];
    }
}

async function fetchVerses(version, book, chapter) {
    try {
        const response = await fetch(`${API_URL}/verses/${version}/${book}/${chapter}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const data = await response.json();

        if (data.verses && data.verses.length > 0) {
            const verses = data.verses.map((_, i) => i + 1);
            const verseGrid = document.getElementById('verse-grid');
            verseGrid.innerHTML = verses
                .map(verse => `<button class="verse-item" data-verse="${verse}">${verse}</button>`)
                .join('');
        }
    } catch (error) {
        console.error("Erro ao buscar versículos:", error);
    }
}

function renderBibleContent(verses) {
    bibleContentEl.innerHTML = '';
    verses.forEach((verse) => {
        const verseElement = document.createElement('p');
        verseElement.id = `verse-${verse.number}`;
        verseElement.innerHTML = `<span style="color: blue;">${verse.number}</span> ${verse.text}`;
        bibleContentEl.appendChild(verseElement);
    });
    window.dispatchEvent(new Event('chapterChanged'));
}

// ===== NAVEGAÇÃO FLUIDA =====
function scrollToVerse(verseNumber) {
    const verseElement = document.getElementById(`verse-${verseNumber}`);
    if (verseElement) {
        verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function highlightVerse(verseNumber) {
    const verseElement = document.getElementById(`verse-${verseNumber}`);
    if (verseElement) {
        verseElement.classList.add('highlight');
        setTimeout(() => verseElement.classList.add('fade-out'), 1000);
        setTimeout(() => verseElement.classList.remove('highlight', 'fade-out'), 1600);
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Seletor de versão - atualiza imediatamente
    if (versionSelector) {
        versionSelector.addEventListener('click', () => openDialog(versionDialog));
    }

    if (versionSelect) {
        versionSelect.addEventListener('change', async (event) => {
            versaoAtual = event.target.value.toLowerCase();
            updateUI();
            await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
            await saveCurrentState();
            closeAllModals();
        });
    }

    // Seletor de livro/capítulo - abre navegação fluida
    if (chapterSelector) {
        chapterSelector.addEventListener('click', () => openDialog(bookDialog));
    }

    // Seleção de livro - apenas carrega capítulos, não atualiza conteúdo
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('book-item')) {
            tempLivro = event.target.dataset.book;
            await fetchChapters(tempLivro);
            closeDialog(bookDialog);
            openDialog(chapterDialog);
        }
    });

    // Seleção de capítulo - atualiza o conteúdo e vai para versículos
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('chapter-item')) {
            tempCapitulo = parseInt(event.target.dataset.chapter);
            
            // Aqui é onde atualizamos o estado e o conteúdo
            livroAtual = tempLivro;
            capituloAtual = tempCapitulo;
            
            updateUI();
            await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
            await fetchVerses(versaoAtual, livroAtual, capituloAtual);
            await saveCurrentState();
            
            closeDialog(chapterDialog);
            openDialog(verseDialog);
        }
    });

    // Seleção de versículo - apenas navega para o versículo
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('verse-item')) {
            versoAtual = parseInt(event.target.dataset.verse);
            scrollToVerse(versoAtual);
            highlightVerse(versoAtual);
            closeAllModals();
            saveCurrentState();
        }
    });

    // Botões de fechar
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Fechar ao clicar fora ou no overlay
    document.querySelectorAll('.dialog').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAllModals();
        });
    });

    if (overlay) {
        overlay.addEventListener('click', closeAllModals);
    }

    // Tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // Temas
    const themeOptions = document.getElementById('theme-options');
    if (themeOptions) {
        themeOptions.addEventListener('click', (event) => {
            if (event.target.classList.contains('theme-option-btn')) {
                const selectedTheme = event.target.dataset.theme;
                if (window.themeManager) {
                    window.themeManager.applyTheme(selectedTheme);
                    window.themeManager.saveTheme(selectedTheme);
                }
                closeAllModals();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async ( ) => {
    // ... (seu código existente)

    const markAsReadBtn = document.getElementById('mark-book-as-read-btn');
    if (markAsReadBtn) {
        markAsReadBtn.addEventListener('click', async () => {
            // 'livroAtual' é a variável global que já existe no seu home.js
            if (!livroAtual) {
                alert('Nenhum livro selecionado.');
                return;
            }

            if (confirm(`Deseja marcar o livro de ${capitalizeBookName(livroAtual)} como lido?`)) {
                try {
                    const token = await window.AuthManager.getToken();
                    const response = await fetch(`/api/user/stats/read-book/${livroAtual}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        alert('Livro marcado como lido com sucesso!');
                    } else {
                        throw new Error('Não foi possível marcar o livro como lido.');
                    }
                } catch (error) {
                    console.error(error);
                    alert(error.message);
                }
            }
        });
    }
});

// ===== INICIALIZAÇÃO =====
window.addEventListener('beforeunload', saveCurrentState);

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadInitialState();
});