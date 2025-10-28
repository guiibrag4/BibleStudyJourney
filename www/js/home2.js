// =============================================================================
// GERENCIAMENTO DO DEVOCIONAL DIÁRIO COM IA
// =============================================================================
const DevotionalManager = {
  elements: {},

  init() {
    this.cacheElements();
    // 🎯 CACHE GLOBAL: Carrega imediatamente o devocional do dia (independente do versículo)
    this.loadDevotionalFromVerse();
  },

  cacheElements() {
    this.elements = {
      verseText: document.querySelector('.devocional-texto-versiculo'),
      verseReference: document.querySelector('.devocional-referencia'),
      estudo: document.querySelector('.devocional-texto-estudo'),
      reflexao: document.querySelector('.devocional-texto-reflexao'),
      aplicacao: document.querySelector('.devocional-texto-aplicacao'),
    };
  },



  async loadDevotionalFromVerse() {
    if (!this.elements.verseText || !this.elements.estudo || !this.elements.reflexao || !this.elements.aplicacao) return;

    // 🎯 CACHE GLOBAL: Não envia versículo, apenas busca o devocional do dia
    // Mostra placeholders enquanto carrega
    this.elements.verseText.textContent = 'Carregando versículo do dia...';
    this.elements.verseReference.textContent = '';
    this.elements.estudo.textContent = 'Carregando estudo exegético...';
    this.elements.reflexao.textContent = 'Carregando reflexão...';
    this.elements.aplicacao.textContent = 'Carregando aplicação prática...';

    try {
      const token = window.AuthManager ? await window.AuthManager.getToken() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // 🚀 USA GET: Busca o devocional global do dia (mesmo para todos)
      const response = await fetch(`${CONFIG.BIBLE_API_URL}/devotional/daily`, {
        method: 'GET',
        headers
      });
      if (!response.ok) throw new Error('Falha ao buscar devocional diário');
      const data = await response.json();

      this.elements.verseText.textContent = data.verse?.text || 'Versículo não disponível';
      this.elements.verseReference.textContent = data.verse?.reference || '';
      this.elements.estudo.textContent = data.estudo || 'Não foi possível gerar o estudo.';
      this.elements.reflexao.textContent = data.reflexao || 'Não foi possível gerar a reflexão.';
      this.elements.aplicacao.textContent = data.aplicacao || 'Não foi possível gerar a aplicação prática.';
      
      // Log para debug
      if (data.cached) {
        console.log('✅ Devocional carregado do cache (sem custo de IA)');
      } else {
        console.log('🚀 Devocional gerado agora (primeira requisição do dia)');
      }
    } catch (error) {
      console.error('Erro ao buscar devocional diário:', error);
      this.elements.estudo.textContent = 'Não foi possível gerar o estudo agora.';
      this.elements.reflexao.textContent = 'Não foi possível gerar a reflexão agora.';
      this.elements.aplicacao.textContent = 'Tente novamente mais tarde.';
    }
  }
};
// Arquivo: www/js/home2.js

/**
 * Módulo principal da página Home
 * Gerencia cards da jornada e funcionalidades dos versículos
 */

// =============================================================================
// CONSTANTES E CONFIGURAÇÕES
// =============================================================================
 // FUNÇÃO CORRIGIDA: getApiBaseUrl
  function getApiBaseUrl() {
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();

    // 1. Se for o aplicativo nativo (Android/iOS), SEMPRE use a API de produção (HTTPS).
    if (isNativeApp) {
      console.log('[getApiBaseUrl] Detectado ambiente nativo (Capacitor). Forçando API de produção.');
      // Escolha aqui o seu servidor de produção principal.
      return 'https://biblestudyjourney.duckdns.org';
      // Ou: return 'https://biblestudyjourney-v2.onrender.com';
    }

    // 2. Se não for nativo, é um navegador web. Use a lógica anterior.
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    console.log(`[getApiBaseUrl] Detectado ambiente web: ${protocol}//${hostname}`);

    // Ambiente de desenvolvimento local no navegador
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    // Ambiente de produção no navegador (Render, DuckDNS, etc. )
    if (protocol === 'https:') {
      if (hostname.includes('onrender.com')) {
        return 'https://biblestudyjourney-v2.onrender.com';
      }
      if (hostname.includes('duckdns.org')) {
        return 'https://biblestudyjourney.duckdns.org';
      }
    }

    // Fallback final: usa a origem da página.
    // Isso garante que se você acessar https://meusite.com, a API será https://meusite.com/api/...
    return window.location.origin;
  }

  // const API_BASE_URL = getApiBaseUrl();

const CONFIG = {
  COMPLETION_THRESHOLD: 95, // Porcentagem para considerar vídeo completo
  MAX_RECENT_VIDEOS: 5,     // Máximo de vídeos recentes a exibir
  THUMBNAIL_QUALITY: 'mqdefault', // Qualidade da thumbnail do YouTube
  BIBLE_API_URL: `${getApiBaseUrl()}/api/bible`
};

/**
 * Decodifica um token JWT para extrair o payload sem verificar a assinatura.
 * @param {string} token - O token JWT.
 * @returns {Object|null} - O payload decodificado ou null se o token for inválido.
 */
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Erro ao decodificar o token JWT:", e);
    return null;
  }
}

/**
 * Módulo para gerenciar a saudação do usuário
 */
const UserManager = {
  greetingElement: null,

  init() {
    this.greetingElement = document.getElementById('saudacao-usuario');
    this.setGreeting();
  },

  async setGreeting() {
    if (!this.greetingElement) return;

    // Verifica se o AuthManager está disponível
    if (window.AuthManager && await window.AuthManager.isAuthenticated()) {
      const token = await window.AuthManager.getToken();
      const userData = decodeJwt(token);

      // O seu token JWT tem o campo 'nome'? Se não, ajuste aqui.
      // Supondo que o payload do token tenha { id_usuario, nome, email }
      const userName = userData?.nome || 'Usuário';

      this.greetingElement.textContent = `Olá, ${userName}!`;
    } else {
      this.greetingElement.textContent = 'Olá!';
    }
  }
};

// =============================================================================
// GERENCIAMENTO DOS CARDS DA JORNADA
// =============================================================================
const JourneyManager = {
  container: null,
  init() {
    this.container = document.querySelector('.cartoes-jornada');
    this.loadJourney();
  },

  /**
   * Cria um card individual da jornada
   * @param {Object} videoProgress - Dados do progresso do vídeo
   * @returns {HTMLElement|null} - Elemento do card ou null se não deve ser exibido
   */
  createCard(videoProgress) {
    // Validações básicas
    if (!videoProgress.duration || !videoProgress.id) return null;

    const percentage = Math.floor((videoProgress.currentTime / videoProgress.duration) * 100);

    // Não exibe vídeos já concluídos
    if (percentage >= CONFIG.COMPLETION_THRESHOLD) return null;

    // Criação do elemento
    const card = document.createElement('article');
    card.className = 'cartao-jornada';
    card.dataset.videoId = videoProgress.id;
    card.dataset.videoType = encodeURIComponent(videoProgress.topic);
    card.style.animationDelay = `${this.container.childElementCount * 0.1}s`; // Adiciona delay de animação dinâmico

    // Conteúdo do card (usando a estrutura do seu CSS extra)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoProgress.id}/${CONFIG.THUMBNAIL_QUALITY}.jpg`;

    card.innerHTML = `
      <div class="card-thumbnail-wrapper">
        <img src="${thumbnailUrl}" alt="Capa do vídeo ${videoProgress.title}" class="card-thumbnail">
        <div class="card-progress-overlay">
          <div class="card-progress-bar" style="width: ${percentage}%;"></div>
        </div>
      </div>
      <div class="legenda-cartao">
        <h4 class="card-title">${videoProgress.title}</h4>
        <span class="card-percentage">${percentage}% concluído</span>
      </div>
    `;

    // Event listener para navegação
    card.addEventListener('click', this.handleCardClick.bind(this));

    return card;
  },


  /**
   * Manipula o clique em um card
   * @param {Event} event - Evento de clique
   */
  handleCardClick(event) {
    const videoId = event.currentTarget.dataset.videoId;
    const type = event.currentTarget.dataset.videoType;
    window.location.href = `tl2-teologia.html?videoId=${videoId}&type=${type}`;
  },

  /**
   * Carrega e exibe os cards da jornada
   */
  async loadJourney() {
    if (!this.container) return;

    try {
      // Verifica se o progressManager está disponível
      if (!window.progressManager) {
        this.showError('Erro ao carregar progresso.');
        return;
      }

      const allProgress = await window.progressManager.getAllProgress();
      this.container.innerHTML = ''; // Limpa conteúdo anterior

      const recentVideos = allProgress.slice(0, CONFIG.MAX_RECENT_VIDEOS);

      // Verifica se há vídeos para exibir
      if (recentVideos.length === 0) {
        this.showEmptyState('Comece uma aula na trilha para ver seu progresso aqui!');
        return;
      }

      // Cria e adiciona os cards
      let cardsAdded = 0;
      recentVideos.forEach(video => {
        const card = this.createCard(video);
        if (card) {
          this.container.appendChild(card);
          cardsAdded++;
        }
      });

      // Verifica se algum card foi adicionado
      if (cardsAdded === 0) {
        this.showEmptyState('Parabéns! Você concluiu seus vídeos recentes.');
      }

    } catch (error) {
      console.error('Erro ao carregar jornada:', error);
      this.showError('Erro ao carregar progresso.');
    }
  },

  /**
   * Exibe mensagem de estado vazio
   * @param {string} message - Mensagem a ser exibida
   */
  showEmptyState(message) {
    this.container.innerHTML = `<p class="jornada-vazia">${message}</p>`;
  },

  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  showError(message) {
    this.container.innerHTML = `<p class="jornada-vazia">${message}</p>`;
  }
};

// =============================================================================
// NOVO: GERENCIAMENTO DA LEITURA CONTÍNUA
// =============================================================================
const ReadingManager = {
  continueButton: null,
  readingInfoText: null,

  init() {
    this.continueButton = document.getElementById('botao-continuar-leitura');
    this.readingInfoText = document.querySelector('.cartao-leitura .texto-suave');
    this.setupContinueButton();
  },

  async setupContinueButton() {
    if (!this.continueButton || !this.readingInfoText) return;

    try {
      const lastReadingState = await localforage.getItem('bibleAppState');

      if (lastReadingState && lastReadingState.book && lastReadingState.chapter) {
        const bookName = this.capitalizeBookName(lastReadingState.book);
        this.readingInfoText.innerHTML = `Você parou em <strong>${bookName} ${lastReadingState.chapter}</strong>`;

        // AÇÃO PRINCIPAL: Apenas redireciona.
        this.continueButton.addEventListener('click', () => {
          window.location.href = 'biblia.html';
        });
      } else {
        // ... (código para quando não há nada salvo)
        this.readingInfoText.innerHTML = 'Comece a ler na <strong>Bíblia</strong> para continuar de onde parou.';
        this.continueButton.textContent = 'Começar a Ler';
        this.continueButton.addEventListener('click', () => {
          window.location.href = 'biblia.html';
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estado de leitura:", error);
    }
  },

  // Função auxiliar para capitalizar o nome do livro (pode ser movida para um arquivo de utils)
  capitalizeBookName(bookAbbrev) {
    const bookNames = { gn: "Gênesis", ex: "Êxodo", lv: "Levítico", nm: "Números", dt: "Deuteronômio", js: "Josué", jz: "Juízes", rt: "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel", "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas", ed: "Esdras", ne: "Neemias", et: "Ester", jó: "Jó", sl: "Salmos", pv: "Provérbios", ec: "Eclesiastes", ct: "Cantares", is: "Isaías", jr: "Jeremias", lm: "Lamentações", ez: "Ezequiel", dn: "Daniel", os: "Oséias", jl: "Joel", am: "Amós", ob: "Obadias", jn: "Jonas", mq: "Miquéias", na: "Naum", hb: "Habacuque", sf: "Sofonias", ag: "Ageu", zc: "Zacarias", ml: "Malaquias", mt: "Mateus", mc: "Marcos", lc: "Lucas", jo: "João", at: "Atos", rm: "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios", gl: "Gálatas", ef: "Efésios", fp: "Filipenses", cl: "Colossenses", "1ts": "1 Tessalonicenses", "2ts": "2 Tessalonicenses", "1tm": "1 Timóteo", "2tm": "2 Timóteo", tt: "Tito", fl: "Filemom", hb: "Hebreus", tg: "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro", "1jo": "1 João", "2jo": "2 João", "3jo": "3 João", jd: "Judas", ap: "Apocalipse" };
    return bookNames[bookAbbrev] || bookAbbrev;
  }
};

// =============================================================================
// GERENCIAMENTO DO VERSÍCULO DO DIA
// =============================================================================
const VerseManager = {
  elements: {},

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadDailyVerse(); // Carrega o versículo ao iniciar
  },

  cacheElements() {
    this.elements = {
      copyButton: document.getElementById('botao-copiar-versiculo'),
      shareButton: document.getElementById('botao-compartilhar-versiculo'),
      verseText: document.querySelector('.texto-versiculo'),
      verseReference: document.querySelector('.referencia-versiculo')
    };
  },

  async fetchWithAuth(url) {
    const token = await window.AuthManager.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    return fetch(url, { headers });
  },

  async loadDailyVerse() {
    if (!this.elements.verseText || !this.elements.verseReference) return;

    // Define uma versão padrão, por exemplo 'nvi'
    const version = 'nvi';

    try {
      const response = await this.fetchWithAuth(`${CONFIG.BIBLE_API_URL}/verses/${version}/random`);
      if (!response.ok) throw new Error('Falha na requisição à API');

      const data = await response.json();

      // Atualiza os elementos na tela com os dados recebidos
      let verseText = data.text;
      verseText = verseText.replace(/^["']+/, '');
      verseText = verseText.replace(/["']+$/, '');
      verseText = verseText.charAt(0).toUpperCase() + verseText.slice(1);

      this.elements.verseText.innerHTML = `<span class="verse-number-inline">${data.number}</span> ${data.text}`;
      this.elements.verseReference.textContent = `${data.book.name} ${data.chapter}:${data.number}`;

      // Reconfigura os event listeners com o novo texto
      this.setupEventListeners();

      // Dispara evento para que outros módulos (ex.: DevotionalManager) possam usar o versículo carregado
      try {
        const versePayload = {
          text: data.text,
          reference: `${data.book.name} ${data.chapter}:${data.number}`
        };
        window.dispatchEvent(new CustomEvent('verse:loaded', { detail: versePayload }));
      } catch (e) {
        console.warn('Falha ao disparar evento verse:loaded:', e);
      }

    } catch (error) {
      console.error("Erro ao buscar versículo do dia:", error);
      this.elements.verseText.textContent = 'Não foi possível carregar o versículo do dia. Tente novamente mais tarde.';
      this.elements.verseReference.textContent = '';
    }
  },

  setupEventListeners() {
    if (!this.elements.verseText) return;

    // Remove listeners antigos para evitar duplicação
    this.elements.copyButton.replaceWith(this.elements.copyButton.cloneNode(true));
    this.elements.shareButton.replaceWith(this.elements.shareButton.cloneNode(true));
    this.cacheElements(); // Recarregar elementos clonados

    const fullText = this.getFullVerseText();

    if (this.elements.copyButton) {
      this.elements.copyButton.addEventListener('click', () => this.copyVerse(fullText));
    }

    if (this.elements.shareButton) {
      this.elements.shareButton.addEventListener('click', () => this.shareVerse(fullText));
    }
  },

  getFullVerseText() {
    const verseText = this.elements.verseText.textContent.trim();
    const fullReference = this.elements.verseReference?.textContent.trim() || '';

    const verseNumber = fullReference.split(':').pop();

    const formattedText = `${verseNumber} ${verseText}`;

    return `${formattedText}\n\n- ${fullReference}`;
  },

  async copyVerse(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert('Versículo copiado!'); // Feedback simples
    } catch (error) {
      console.error('Erro ao copiar:', error);
      alert('Não foi possível copiar.');
    }
  },

  async shareVerse(text) {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Versículo do Dia', text: text });
      } else {
        this.copyVerse(text); // Como fallback, copia o texto
        alert('Compartilhamento não suportado. O versículo foi copiado para a área de transferência.');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }
};

// =============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================================================
document.addEventListener('DOMContentLoaded', function () {
  // Inicializa todos os módulos
  UserManager.init();
  JourneyManager.init();
  ReadingManager.init();
  VerseManager.init();
  DevotionalManager.init();
});