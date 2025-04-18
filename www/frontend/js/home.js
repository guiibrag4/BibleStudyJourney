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

// Buscar livros pela API
async function fetchBooks() {
  try {
    const response = await fetch(`${API_URL}/books`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    const books = await response.json();
    bookSelect.innerHTML = books.map(
      (book) => `<option value="${book.abbrev.pt}">${book.name}</option>`
    ).join('');
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
    chapterSelect.innerHTML = chapters.map(
      (chapter) => `<option value="${chapter}">${chapter}</option>`
    ).join('');
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
      verseSelect.innerHTML = verses.map(
        (verse) => `<option value="${verse}">${verse}</option>`
      ).join('');
    } else {
      console.error("Formato inesperado da resposta da API:", data);
      verseSelect.innerHTML = '<option value="">Nenhum versículo encontrado</option>';
    }
  } catch (error) {
    console.error("Erro ao buscar versículos:", error);
    verseSelect.innerHTML = '<option value="">Erro ao carregar versículos</option>';
  }
}

// Renderizar conteúdo da Bíblia (capítulo inteiro)
function renderBibleContent(verses) {
  bibleContentEl.innerHTML = verses.map(
    (verse) => `<p id="verse-${verse.number}"><strong>${verse.number}</strong> ${verse.text}</p>`
  ).join('');
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
  versionSelector.addEventListener('click', () => {
    openDialog(versionDialog);
  });

  // Seletor de livro click
  chapterSelector.addEventListener('click', () => {
    fetchBooks();
    openDialog(bookDialog);
  });

  // Seletor de capítulo click
  bookSelect.addEventListener('change', () => {
    livroAtual = bookSelect.value;
    fetchChapters(livroAtual);
    closeDialog(bookDialog);
    openDialog(chapterDialog);
  });

  // Mudança no seletor de capítulo
  chapterSelect.addEventListener('change', () => {
    capituloAtual = chapterSelect.value;
    fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
    fetchVerses(versaoAtual, livroAtual, capituloAtual);
    closeDialog(chapterDialog);
    openDialog(verseDialog);
  });

  // Mudança no seletor de versículo
  verseSelect.addEventListener('change', () => {
    versoAtual = verseSelect.value;

    scrollToVerse(versoAtual);

    chapterSelector.textContent = `${livroAtual} ${capituloAtual}:${versoAtual}`;
    closeDialog(verseDialog);

  });

  // Fechar botões
  closeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      closeAllDialogs();
    });
  });

  // Close when clicking on overlay
  overlay.addEventListener('click', closeAllDialogs);

  // Close when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDialogs();
    }
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchBibleContent(versaoAtual, livroAtual, capituloAtual);
});