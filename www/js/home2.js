// Arquivo: www/js/home2.js

/**
 * Módulo principal da página Home
 * Gerencia cards da jornada e funcionalidades dos versículos
 */

// =============================================================================
// CONSTANTES E CONFIGURAÇÕES
// =============================================================================
const CONFIG = {
  COMPLETION_THRESHOLD: 95, // Porcentagem para considerar vídeo completo
  MAX_RECENT_VIDEOS: 5,     // Máximo de vídeos recentes a exibir
  THUMBNAIL_QUALITY: 'mqdefault' // Qualidade da thumbnail do YouTube
};

// =============================================================================
// GERENCIAMENTO DOS CARDS DA JORNADA
// =============================================================================
const JourneyManager = {
  container: null,

  /**
   * Inicializa o gerenciador da jornada
   */
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
    if (!videoProgress.duration) return null;
    
    const percentage = Math.floor((videoProgress.currentTime / videoProgress.duration) * 100);
    
    // Não exibe vídeos já concluídos
    if (percentage >= CONFIG.COMPLETION_THRESHOLD) return null;

    // Criação do elemento
    const card = document.createElement('article');
    card.className = 'cartao-jornada';
    card.dataset.videoId = videoProgress.id;
    card.dataset.videoType = encodeURIComponent(videoProgress.topic);

    // Conteúdo do card
    const thumbnailUrl = `https://img.youtube.com/vi/${videoProgress.id}/${CONFIG.THUMBNAIL_QUALITY}.jpg`;
    card.innerHTML = `
      <img src="${thumbnailUrl}" alt="${videoProgress.title}" />
      <div class="legenda-cartao">${videoProgress.topic} - ${percentage}%</div>
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
// GERENCIAMENTO DOS VERSÍCULOS
// =============================================================================
const VerseManager = {
  elements: {},

  /**
   * Inicializa o gerenciador de versículos
   */
  init() {
    this.cacheElements();
    this.setupEventListeners();
  },

  /**
   * Faz cache dos elementos DOM necessários
   */
  cacheElements() {
    this.elements = {
      copyButton: document.getElementById('botao-copiar-versiculo'),
      shareButton: document.getElementById('botao-compartilhar-versiculo'),
      verseText: document.querySelector('.texto-versiculo'),
      verseReference: document.querySelector('.referencia-versiculo')
    };
  },

  /**
   * Configura os event listeners dos botões
   */
  setupEventListeners() {
    if (!this.elements.verseText) return;

    const fullText = this.getFullVerseText();

    if (this.elements.copyButton) {
      this.elements.copyButton.addEventListener('click', () => this.copyVerse(fullText));
    }

    if (this.elements.shareButton) {
      this.elements.shareButton.addEventListener('click', () => this.shareVerse(fullText));
    }
  },

  /**
   * Obtém o texto completo do versículo (texto + referência)
   * @returns {string} - Texto completo formatado
   */
  getFullVerseText() {
    const verseText = this.elements.verseText.innerText.trim();
    const reference = this.elements.verseReference?.innerText.trim() || '';
    return `${verseText}\n\n${reference}`;
  },

  /**
   * Copia o versículo para a área de transferência
   * @param {string} text - Texto a ser copiado
   */
  async copyVerse(text) {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Adicionar feedback visual de sucesso
    } catch (error) {
      console.error('Erro ao copiar:', error);
      alert('Não foi possível copiar.');
    }
  },

  /**
   * Compartilha o versículo usando a Web Share API
   * @param {string} text - Texto a ser compartilhado
   */
  async shareVerse(text) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Versículo do dia',
          text: text
        });
      } else {
        alert('Compartilhamento não suportado neste navegador.');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }
};

// =============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
  // Inicializa todos os módulos
  JourneyManager.init();
  VerseManager.init();
});