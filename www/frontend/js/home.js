const API_URL = "https://www.abibliadigital.com.br/api";
const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJXZWQgQXByIDE2IDIwMjUgMTQ6MjU6MjkgR01UKzAwMDAuNjdmZmIwZWI1ZDA2ZjYwMDI4MzczZjlmIiwiaWF0IjoxNzQ0ODEzNTI5fQ.4SyoatsJ2L0lWPalu_2PsOA6-Somv-gDdDHSHR2OyfA";

// Versão atual, livro, capítulo e versículo
let versaoAtual = "nvi";
let livroAtual = "Gênesis"; // Gênesis como padrão
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
    chapterSelector.textContent = `${capitalizeBookName(livroAtual)} ${capituloAtual}`;
    updateChapterSelectorStyle(); // Atualiza o estilo do seletor de capítulo
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
    // Pentateuco
    gn: "Gênesis",
    ex: "Êxodo",
    lv: "Levítico",
    nm: "Números",
    dt: "Deuteronômio",

    // Livros históricos
    js: "Josué",
    jz: "Juízes",
    rt: "Rute",
    "1sm": "1 Samuel",
    "2sm": "2 Samuel",
    "1rs": "1 Reis",
    "2rs": "2 Reis",
    "1cr": "1 Crônicas",
    "2cr": "2 Crônicas",
    ed: "Esdras",
    ne: "Neemias",
    et: "Ester",

    // Livros poéticos
    jó: "Jó",
    sl: "Salmos",
    pv: "Provérbios",
    ec: "Eclesiastes",
    ct: "Cantares",

    is: "Isaías",
    jr: "Jeremias",
    lm: "Lamentações",
    ez: "Ezequiel",
    dn: "Daniel",

    // Profetas menores
    os: "Oséias",
    jl: "Joel",
    am: "Amós",
    ob: "Obadias",
    jn: "Jonas",
    mq: "Miquéias",
    na: "Naum",
    hb: "Habacuque",
    sf: "Sofonias",
    ag: "Ageu",
    zc: "Zacarias",
    ml: "Malaquias",

    // Evangelhos
    mt: "Mateus",
    mc: "Marcos",
    lc: "Lucas",
    jo: "João",

    // Histórico do Nt   
    at: "Atos",

    //Cartas de Paulo
    rm: "Romanos",
    "1co": "1 Coríntios",
    "2co": "2 Coríntios",
    gl: "Gálatas",
    ef: "Efésios",
    fp: "Filipenses",
    cl: "Colossenses",
    "1ts": "1 Tessalonicenses",
    "2ts": "2 Tessalonicenses",
    "1tm": "1 Timóteo",
    "2tm": "2 Timóteo",
    tt: "Tito",
    fl: "Filemom",

    // Outras cartas
    hb: "Hebreus",
    tg: "Tiago",
    "1pe": "1 Pedro",
    "2pe": "2 Pedro",
    "1jo": "1 João",
    "2jo": "2 João",
    "3jo": "3 João",
    jd: "Judas",

    // Escatológico/revelação
    ap: "Apocalipse",
  };
  return bookNames[book] || book;
}

// Atualiza o texto do chapter-selector
function updateChapterSelector() {
  chapterSelector.textContent = `${capitalizeBookName(livroAtual)} ${capituloAtual}`;
}

// Atualiza o texto do version-selector
function updateVersionSelector() {
  versionSelector.textContent = versaoAtual.toUpperCase();
}

// Adiciona evento para atualizar a versão ao selecionar uma nova
if (versionSelect) {
  versionSelect.addEventListener('change', async (event) => {
    versaoAtual = event.target.value.toLowerCase(); // Atualiza a versão atual
    updateVersionSelector(); // Atualiza o texto do version-selector
    await fetchBibleContent(versaoAtual, livroAtual, capituloAtual); // Recarrega o conteúdo da Bíblia
    saveCurrentState(); // Salva o estado atual
  });
}

// Adiciona evento para atualizar o livro ao selecionar um novo
const bookItems = document.querySelectorAll('.book-item');
if (bookItems.length > 0) {
  bookItems.forEach((button) => {
    button.addEventListener('click', async (event) => {
      livroAtual = event.target.dataset.book; // Atualiza o livro atual
      capituloAtual = 1; // Reseta para o primeiro capítulo
      updateChapterSelector(); // Atualiza o texto do chapter-selector
      await fetchChapters(livroAtual); // Carrega os capítulos do novo livro
      await fetchBibleContent(versaoAtual, livroAtual, capituloAtual); // Recarrega o conteúdo da Bíblia
      saveCurrentState(); // Salva o estado atual
    });
  });
}

// Adiciona evento para atualizar o capítulo ao selecionar um novo
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('chapter-item')) {
    capituloAtual = event.target.dataset.chapter; // Atualiza o capítulo atual
    updateChapterSelector(); // Atualiza o texto do chapter-selector
    fetchBibleContent(versaoAtual, livroAtual, capituloAtual); // Recarrega o conteúdo da Bíblia
    saveCurrentState(); // Salva o estado atual
    closeDialog(chapterDialog); // Fecha o diálogo de capítulos
  }
});

// Só para aumentar o tamanho da caixa de capítulo para esse livro específico
function updateChapterSelectorStyle() {
  if (livroAtual === "1ts" || livroAtual === "2ts") {
    chapterSelector.classList.add("tessalonicenses"); // Adiciona a classe especial
  } else {
    chapterSelector.classList.remove("tessalonicenses"); // Remove a classe especial
  }
}

// Função para destacar o versículo selecionado
function highlightVerse(verseNumber) {
  const verseElement = document.getElementById(`verse-${verseNumber}`);
  if (verseElement) {
    verseElement.classList.add('highlight'); // Adiciona a classe de destaque

    // Adiciona a classe fade-out após um curto atraso
    setTimeout(() => {
      verseElement.classList.add('fade-out');
    }, 1000); // Espera 500ms antes de iniciar o desaparecimento

    // Remove ambas as classes após a transição
    setTimeout(() => {
      verseElement.classList.remove('highlight', 'fade-out');
    }, 1600); // Tempo total da transição (500ms + 800ms)
  }
}

// Adiciona eventos de clique para os versículos
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('verse-item')) {
    versoAtual = event.target.dataset.verse; // Obtém o versículo selecionado
    scrollToVerse(versoAtual); // Rola para o versículo correspondente
    highlightVerse(versoAtual); // Destaca o versículo selecionado
    closeDialog(verseDialog); // Fecha o diálogo de versículos
    saveCurrentState(); // Salva o estado atual
  }
});

// Chame essa função sempre que o livro for atualizado
chapterSelector.addEventListener('click', () => {
  updateChapterSelectorStyle();
});


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
    // verseElement.textContent = `${verse.number}. ${verse.text}`;
    verseElement.innerHTML = `<span style="color: blue;">${verse.number}</span> ${verse.text}`;
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

// ... todo o código existente de home.js ...

// ---- LÓGICA DE SELEÇÃO DE TEMA ----
document.addEventListener('DOMContentLoaded', () => {
    const themeOptions = document.getElementById('theme-options');
    if (themeOptions) {
        themeOptions.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('theme-option-btn')) {
                const selectedTheme = target.dataset.theme;

                // Usa o themeManager para aplicar e salvar
                if (window.themeManager) {
                    window.themeManager.applyTheme(selectedTheme);
                    window.themeManager.saveTheme(selectedTheme);
                }

                // Fecha o modal
                const themeModal = document.getElementById('theme-modal');
                const menuOverlay = document.getElementById('menuOverlay');
                if (themeModal) themeModal.classList.remove('open');
                if (menuOverlay) menuOverlay.classList.remove('ativa');
            }
        });
    }
});