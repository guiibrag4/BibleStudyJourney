const API_URL = "/api/bible";

// ===== ESTADO GLOBAL =====
let versaoAtual = "nvi";
let livroAtual = "gn";
let capituloAtual = 1;
let versoAtual = 1;
let tempLivro = null;
let tempCapitulo = null;

// ===== ELEMENTOS DO DOM =====
const versionSelector = document.getElementById('version-selector');
const chapterSelector = document.getElementById('chapter-selector');
const bibleContentEl = document.getElementById('bible-content');

// Títulos dinâmicos para mudança de livro/capítulo
const contentBookTitleEl = document.getElementById('content-book-title');
const contentChapterTitleEl = document.getElementById('content-chapter-title');

const versionDialog = document.getElementById('version-dialog');
const bookDialog = document.getElementById('book-dialog');
const chapterDialog = document.getElementById('chapter-dialog');
const verseDialog = document.getElementById('verse-dialog');
const overlay = document.getElementById('overlay');
const versionSelect = document.getElementById('version-select');

// ===== FUNÇÃO AUXILIAR PARA REQUISIÇÕES AUTENTICADAS (NOVO) =====
/**
 * Realiza uma chamada fetch para a API, incluindo o token de autenticação do usuário.
 * @param {string} url - O endpoint da API para chamar (ex: '/verses/nvi/gn/1').
 * @returns {Promise<Response>} - A promessa da resposta da requisição.
 */

async function fetchWithAuth(url) {
    // Assumindo que você tem um AuthManager global para pegar o token, como no seu saves.js
    const token = await window.AuthManager.getToken();
    
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    return fetch(url, { headers });
}

// ===== UTILITÁRIOS =====
function capitalizeBookName(book) {
    const bookNames = { gn: "Gênesis", ex: "Êxodo", lv: "Levítico", nm: "Números", dt: "Deuteronômio", js: "Josué", jz: "Juízes", rt: "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel", "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas", ed: "Esdras", ne: "Neemias", et: "Ester", jó: "Jó", sl: "Salmos", pv: "Provérbios", ec: "Eclesiastes", ct: "Cantares", is: "Isaías", jr: "Jeremias", lm: "Lamentações", ez: "Ezequiel", dn: "Daniel", os: "Oséias", jl: "Joel", am: "Amós", ob: "Obadias", jn: "Jonas", mq: "Miquéias", na: "Naum", hb: "Habacuque", sf: "Sofonias", ag: "Ageu", zc: "Zacarias", ml: "Malaquias", mt: "Mateus", mc: "Marcos", lc: "Lucas", jo: "João", at: "Atos", rm: "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios", gl: "Gálatas", ef: "Efésios", fp: "Filipenses", cl: "Colossenses", "1ts": "1 Tessalonicenses", "2ts": "2 Tessalonicenses", "1tm": "1 Timóteo", "2tm": "2 Timóteo", tt: "Tito", fl: "Filemom", tg: "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro", "1jo": "1 João", "2jo": "2 João", "3jo": "3 João", jd: "Judas", ap: "Apocalipse" };
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

    if (contentBookTitleEl && contentChapterTitleEl) {
        contentBookTitleEl.textContent = capitalizeBookName(livroAtual);
        contentChapterTitleEl.textContent = `Capítulo ${capituloAtual}`;
    }
}

// ===== GERENCIAMENTO DE ESTADO =====
async function saveCurrentState() {
    try {
        const state = { 
            version: versaoAtual, 
            book: livroAtual, 
            chapter: capituloAtual, 
            verse: versoAtual // Importante ter o 'verse' também
        };
        
        // Usamos localforage, que é mais robusto
        await localforage.setItem('bibleAppState', state);

        // Linha de DEBUG: Vamos ver no console o que está sendo salvo
        console.log('✅ Estado da leitura salvo:', state);

    } catch (error) { 
        console.error("❌ Erro ao salvar o estado:", error); 
    }
}

async function loadInitialState() {
    try {
        // A MÁGICA ACONTECE AQUI:
        const savedState = await localforage.getItem('bibleAppState');
        
        if (savedState) {
            versaoAtual = savedState.version || "nvi";
            livroAtual = savedState.book || "gn";
            capituloAtual = savedState.chapter || 1;
            versoAtual = savedState.verse || 1; // Pega até o último versículo visto
        }
        
        updateUI(); // Atualiza a interface com os dados carregados
        await fetchBibleContent(versaoAtual, livroAtual, capituloAtual); // Busca o conteúdo correto
        
        if (savedState && savedState.verse > 1) {
         
            setTimeout(() => {
                scrollToVerse(savedState.verse);
            }, 500);
        }

    } catch (error) { 
        console.error("Erro ao carregar o estado inicial:", error); 
    }
}

// ===== GERENCIAMENTO DE MODAIS =====
function openDialog(dialog) { dialog.classList.add('open'); overlay.classList.add('open'); }
function closeDialog(dialog) { dialog.classList.remove('open'); overlay.classList.remove('open'); }
function closeAllModals() {
    document.querySelectorAll('.dialog').forEach(modal => modal.classList.remove('open'));
    overlay.classList.remove('open');
}

// ===== API CALLS =====
async function fetchBibleContent(version, book, chapter) {
    try {
        const response = await fetchWithAuth(`${API_URL}/verses/${version}/${book}/${chapter}`,);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Conteúdo da Bíblia recebido:", data);
        renderBibleContent(data.verses);
    } catch (error) {
        console.error("Erro ao buscar conteúdo da Bíblia:", error);
    }
}

async function fetchChapters(book) {
    try {
        const response = await fetchWithAuth(`${API_URL}/books/${book}`,);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[biblia.js] Capítulos recebidos:', data);

        const chapters = Array.from({ length: data.chapters }, (_, i) => i + 1);
        const chapterGrid = document.getElementById('chapter-grid');
        chapterGrid.innerHTML = chapters.map(chapter => `<button class="chapter-item" data-chapter="${chapter}">${chapter}</button>`).join('');
        return data.chapters;
    } catch (error) {
        console.error("Erro ao buscar capítulos:", error);
        return [];
    }
}

async function fetchVerses(version, book, chapter) {
    try {
        const response = await fetchWithAuth(`${API_URL}/verses/${version}/${book}/${chapter}`,);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[biblia.js] Versículos recebidos:', data);

        if (data.verses && data.verses.length > 0) {
            const verses = data.verses.map((_, i) => i + 1);
            const verseGrid = document.getElementById('verse-grid');
            verseGrid.innerHTML = verses.map(verse =>
                `<button class="verse-item" data-verse="${verse}">${verse}</button>`).join('');
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
        // verseElement.innerHTML = `<span style="color: var(--accent-color);">${verse.number}</span> ${verse.text}`;
        verseElement.innerHTML = `<span style="color: var(--accent-color); font-weight: 600;">${verse.number}</span> ${verse.text}`;
        bibleContentEl.appendChild(verseElement);
    });
    window.dispatchEvent(new Event('chapterChanged'));
}

// ===== NAVEGAÇÃO =====
function scrollToVerse(verseNumber) {
    const verseElement = document.getElementById(`verse-${verseNumber}`);
    if (verseElement) verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
}

function highlightVerse(verseNumber) {
    const verseElement = document.getElementById(`verse-${verseNumber}`);
    if (verseElement) {
        verseElement.classList.add('highlight');
        setTimeout(() => verseElement.classList.add('fade-out'), 1000);
        setTimeout(() => verseElement.classList.remove('highlight', 'fade-out'), 1600);
    }
}

// ===== DETECÇÃO DE SWIPE PARA MUDANÇA DE CAPÍTULO =====
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let isProcessingSwipe = false; // Flag para evitar swipes múltiplos

async function proximoCapitulo() {
    if (isProcessingSwipe) return;
    isProcessingSwipe = true;

    try {
        const response = await fetchWithAuth(`${API_URL}/books/${livroAtual}`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const bookData = await response.json();

        if (capituloAtual < bookData.chapters) {
            // 1. Adiciona a classe de animação de saída
            bibleContentEl.classList.add('page-turn-next');

            // 2. Espera a animação terminar
            setTimeout(async () => {
                capituloAtual++;
                updateUI();
                await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
                await saveCurrentState();
                window.scrollTo(0, 0);

                // 3. Remove a classe para a próxima animação
                bibleContentEl.classList.remove('page-turn-next');
                isProcessingSwipe = false;
            }, 300); // Tempo deve ser próximo da duração da animação CSS
        } else {
            isProcessingSwipe = false; // Libera o swipe se for o último capítulo
        }
    } catch (error) {
        console.error("Erro ao avançar capítulo:", error);
        isProcessingSwipe = false;
    }
}

async function capituloAnterior() {
    if (isProcessingSwipe) return;
    isProcessingSwipe = true;

    if (capituloAtual > 1) {
        // 1. Adiciona a classe de animação de saída
        bibleContentEl.classList.add('page-turn-prev');

        // 2. Espera a animação terminar
        setTimeout(async () => {
            capituloAtual--;
            updateUI();
            await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
            await saveCurrentState();
            window.scrollTo(0, 0);

            // 3. Remove a classe para a próxima animação
            bibleContentEl.classList.remove('page-turn-prev');
            isProcessingSwipe = false;
        }, 300); // Tempo deve ser próximo da duração da animação CSS
    } else {
        isProcessingSwipe = false; // Libera o swipe se for o primeiro capítulo
    }
}


function handleSwipeGesture() {
    const swipeThreshold = 50; // Mínimo de pixels para considerar um swipe
    const verticalThreshold = 75; // Máximo de desvio vertical
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Ignora se o movimento vertical for muito grande (scroll)
    if (Math.abs(deltaY) > verticalThreshold) return;

    if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX < 0) {
            proximoCapitulo();
        } else {
            capituloAnterior();
        }
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Seletor de versão
    if (versionSelector) versionSelector.addEventListener('click', () => openDialog(versionDialog));
    if (versionSelect) {
        versionSelect.addEventListener('change', async (event) => {
            versaoAtual = event.target.value.toLowerCase();
            updateUI();
            await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
            await saveCurrentState();
            closeAllModals();
        });
    }

    // Seletor de livro/capítulo
    if (chapterSelector) chapterSelector.addEventListener('click', () => openDialog(bookDialog));

    // Navegação fluida
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('book-item')) {
            tempLivro = event.target.dataset.book;
            await fetchChapters(tempLivro);
            closeDialog(bookDialog);
            openDialog(chapterDialog);
        } else if (event.target.classList.contains('chapter-item')) {
            tempCapitulo = parseInt(event.target.dataset.chapter);
            livroAtual = tempLivro;
            capituloAtual = tempCapitulo;
            updateUI();
            await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
            await fetchVerses(versaoAtual, livroAtual, capituloAtual);
            await saveCurrentState();
            closeDialog(chapterDialog);
            openDialog(verseDialog);
        } else if (event.target.classList.contains('verse-item')) {
            versoAtual = parseInt(event.target.dataset.verse);
            scrollToVerse(versoAtual);
            highlightVerse(versoAtual);
            closeAllModals();
            saveCurrentState();
        }
    });

    // Fechar modais
    document.querySelectorAll('.close-button').forEach(button => button.addEventListener('click', closeAllModals));
    document.querySelectorAll('.dialog').forEach(modal => modal.addEventListener('click', (e) => { if (e.target === modal) closeAllModals(); }));
    if (overlay) overlay.addEventListener('click', closeAllModals);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

    // Listeners de Swipe
    document.body.addEventListener('touchstart', e => {
        // Ignora o swipe se o toque começar dentro de um modal
        if (e.target.closest('.dialog.open')) return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    });

    document.body.addEventListener('touchend', e => {
        if (e.target.closest('.dialog.open')) return;
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
    });

    // Marcar livro como lido
    const markAsReadBtn = document.getElementById('mark-book-as-read-btn');
    if (markAsReadBtn) {
        markAsReadBtn.addEventListener('click', async () => {
            if (!livroAtual) { alert('Nenhum livro selecionado.'); return; }
            if (confirm(`Deseja marcar o livro de ${capitalizeBookName(livroAtual)} como lido?`)) {
                try {
                    const token = await window.AuthManager.getToken();
                    const response = await fetch(`/api/user/stats/read-book/${livroAtual}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) { alert('Livro marcado como lido com sucesso!'); }
                    else { throw new Error('Não foi possível marcar o livro como lido.'); }
                } catch (error) { console.error(error); alert(error.message); }
            }
        });
    }
}

// ===== INICIALIZAÇÃO =====
window.addEventListener('beforeunload', saveCurrentState);

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadInitialState();

    // Lógica para mostrar a dica de swipe na primeira visita
    const hint = document.getElementById('swipe-hint');
    const hasSeenSwipeHint = localStorage.getItem('hasSeenSwipeHint');

    if (!hasSeenSwipeHint && hint) {
        // Mostra a dica após um pequeno atraso para o usuário se situar
        setTimeout(() => {
            hint.classList.add('visible');
        }, 1000);

        // Esconde após 4 segundos e marca como vista
        setTimeout(() => {
            hint.classList.remove('visible');
            localStorage.setItem('hasSeenSwipeHint', 'true'); 
        }, 5000); // Duração total: 1s de espera + 4s de exibição
    }
});
