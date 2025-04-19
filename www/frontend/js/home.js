const API_URL = "https://www.abibliadigital.com.br/api";
const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJXZWQgQXByIDE2IDIwMjUgMTQ6MjU6MjkgR01UKzAwMDAuNjdmZmIwZWI1ZDA2ZjYwMDI4MzczZjlmIiwiaWF0IjoxNzQ0ODEzNTI5fQ.4SyoatsJ2L0lWPalu_2PsOA6-Somv-gDdDHSHR2OyfA";

// Current state
let versaoAtual = "nvi";
let livroAtual = "";
let capituloAtual = 1;
let versoAtual = 1;

// DOM elements
const versionSelector = document.getElementById('version-selector');
const chapterSelector = document.getElementById('chapter-selector');
const bibleContentEl = document.getElementById('bible-content');
const versionDialog = document.getElementById('version-dialog');
const bookDialog = document.getElementById('book-dialog');
const chapterDialog = document.getElementById('chapter-dialog');
const verseDialog = document.getElementById('verse-dialog');
const overlay = document.getElementById('overlay');
const versionSelect = document.getElementById('version-select');
const bookSelect = document.getElementById('book-select');
const chapterSelect = document.getElementById('chapter-select');
const verseSelect = document.getElementById('verse-select');
const closeButtons = document.querySelectorAll('.close-button');

// Função para carregar o estado inicial
async function loadInitialState() {
  try {
    const savedState = await localforage.getItem('bibleAppState');
    console.log("Estado salvo encontrado e carregado: ", savedState); // Log Para depuração

    if (savedState) {
      // Carrega o último estado salvo
      versaoAtual = savedState.version || "nvi";
      livroAtual = savedState.book || "gn"; // Gênesis como padrão
      capituloAtual = savedState.chapter || 1;
      versoAtual = savedState.verse || 1;
    } else {
      // Estado padrão para o primeiro uso
      versaoAtual = "nvi";
      livroAtual = "gn"; // Gênesis
      capituloAtual = 1;
      versoAtual = 1;
    }

    // Atualiza o seletor de capítulo com o estado inicial
    chapterSelector.textContent = `${capitalizeBookName(livroAtual)} ${capituloAtual}:${versoAtual}`;
    await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
  } catch (error) {
    console.error("Erro ao carregar o estado inicial:", error);
  }
}

// Função para salvar o estado atual no localForage
async function saveCurrentState() {
  try {
    const state = {
      version: versaoAtual,
      book: livroAtual,
      chapter: capituloAtual,
      verse: versoAtual,
    };
    await localforage.setItem('bibleAppState', state);
    console.log("Estado salvo:", state); // Log Para depuração
  } catch (error) {
    console.error("Erro ao salvar o estado:", error);
  }
}

// Função para capitalizar o nome do livro (opcional, para exibição)
function capitalizeBookName(book) {
  const bookNames = {
    gn: "Gênesis",
    ex: "Êxodo",
    lv: "Levítico",
    nm: "Números",
    dt: "Deuteronômio",
    // Adicione outros livros aqui, se necessário
  };
  return bookNames[book] || book;
}


// Buscar livros pela API
async function fetchBooks() {
  try {
    const response = await fetch(`${API_URL}/books`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const books = await response.json();
    console.log("Livros carregados:", books); // Apenas para depuração
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
  }
}

// Buscar capítulos para o livro selecionado
async function fetchChapters(book) {
  try {
    const response = await fetch(`${API_URL}/books/${book}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await response.json();
    const chapters = Array.from({ length: data.chapters }, (_, i) => i + 1);

    // Renderiza os capítulos na matriz
    const chapterGrid = document.getElementById('chapter-grid');
    chapterGrid.innerHTML = chapters
      .map(
        (chapter) =>
          `<button class="chapter-item" data-chapter="${chapter}">${chapter}</button>`
      )
      .join('');

    // Adiciona eventos de clique para cada capítulo
    document.querySelectorAll('.chapter-item').forEach((button) => {
      button.addEventListener('click', async (event) => {
        capituloAtual = event.target.dataset.chapter; // Obtém o capítulo selecionado
        await fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
        await fetchVerses(versaoAtual, livroAtual, capituloAtual);
        closeDialog(chapterDialog); // Fecha o diálogo de capítulos
        openDialog(verseDialog); // Abre o diálogo de versículos
        saveCurrentState(); // Salva o estado atual
      });
    });
  } catch (error) {
    console.error("Erro ao buscar capítulos:", error);
  }
}

// Buscar conteúdo da Bíblia (capítulo inteiro)
async function fetchBibleContent(version, book, chapter) {
  try {
    const response = await fetch(`${API_URL}/verses/${version}/${book}/${chapter}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await response.json();
    console.log("Conteúdo da Bíblia:", data); // Log Para depuração
    renderBibleContent(data.verses);
  } catch (error) {
    console.error("Erro ao buscar conteúdo da Bíblia:", error);
  }
}

async function fetchVerses(version, book, chapter) {
  try {
    const response = await fetch(`${API_URL}/verses/${version}/${book}/${chapter}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const data = await response.json();

    // Verifica se o número de versículos está disponível
    if (data.chapter && data.chapter.verses) {
      const verses = Array.from({ length: data.chapter.verses }, (_, i) => i + 1); // Gera os números dos versículos

      // Renderiza os versículos na matriz
      const verseGrid = document.getElementById('verse-grid');
      verseGrid.innerHTML = verses
        .map(
          (verse) =>
            `<button class="verse-item" data-verse="${verse}">${verse}</button>`
        )
        .join('');

      // Adiciona eventos de clique para cada versículo
      document.querySelectorAll('.verse-item').forEach((button) => {
        button.addEventListener('click', (event) => {
          versoAtual = event.target.dataset.verse; // Obtém o versículo selecionado
          scrollToVerse(versoAtual); // Rola para o versículo correspondente
          closeDialog(verseDialog); // Fecha o diálogo de versículos
          saveCurrentState(); // Salva o estado atual
        });
      });
    } else {
      console.error("Formato inesperado da resposta da API:", data);
      const verseGrid = document.getElementById('verse-grid');
      verseGrid.innerHTML = '<p>Nenhum versículo encontrado</p>';
    }
  } catch (error) {
    console.error("Erro ao buscar versículos:", error);
    const verseGrid = document.getElementById('verse-grid');
    verseGrid.innerHTML = '<p>Erro ao carregar versículos</p>';
  }
}

function renderBibleContent(verses) {
  // Limpa o conteúdo anterior
  bibleContentEl.innerHTML = '';

  // Adiciona cada versículo ao conteúdo
  verses.forEach((verse) => {
    const verseElement = document.createElement('p');
    verseElement.id = `verse-${verse.number}`;
    verseElement.textContent = `${verse.number}. ${verse.text}`;
    bibleContentEl.appendChild(verseElement);
  });
}

// Rolar para o versículo específico
function scrollToVerse(verseNumber) {
  const verseElement = document.getElementById(`verse-${verseNumber}`);
  if (verseElement) {
    verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Auxiliar para abrir o diálogo
function openDialog(dialog) {
  dialog.classList.add('open');
  overlay.classList.add('open');
}

// Auxiliar para fechar o diálogo
function closeDialog(dialog) {
  dialog.classList.remove('open');
  overlay.classList.remove('open');
}

// Fechar todos os diálogos
function closeAllDialogs() {
  closeDialog(versionDialog);
  closeDialog(bookDialog);
  closeDialog(chapterDialog);
  closeDialog(verseDialog);
}

// Configurar ouvintes de eventos
function setupEventListeners() {
  // seletor de versão click
  if (versionSelector) {
    versionSelector.addEventListener('click', () => {
      openDialog(versionDialog);
    });
  }

  // Seletor de livro click
  if (chapterSelector) {
    chapterSelector.addEventListener('click', () => {
      openDialog(bookDialog);
    });
  }

  // Adicione um evento para os botões de livros
  const bookItems = document.querySelectorAll('.book-item');
  if (bookItems.length > 0) {
    bookItems.forEach((button) => {
      button.addEventListener('click', (event) => {
        livroAtual = event.target.dataset.book; // Obtém o valor do atributo data-book
        fetchChapters(livroAtual); // Busca os capítulos do livro selecionado
        closeDialog(bookDialog); // Fecha o diálogo de livros
        openDialog(chapterDialog); // Abre o diálogo de capítulos
      });
    });
  }

  // Fechar botões
  if (closeButtons.length > 0) {
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        closeAllDialogs();
      });
    });
  }

  // Close when clicking on overlay
  if (overlay) {
    overlay.addEventListener('click', closeAllDialogs);
  }

  // Close when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDialogs();
    }
  });
}

/* Salvar o estado atual quando a página for recarregada ou fechada I
isso garante que o estado seja salvo antes de sair da página */
window.addEventListener('beforeunload', saveCurrentState);

// Inicializa o app quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadInitialState(); // Carrega o estado inicial
});