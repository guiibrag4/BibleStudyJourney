// Arquivo: www/js/home2.js (VERSÃO ATUALIZADA COM MELHORIAS)

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
// GERENCIAMENTO DE USUÁRIO
// =============================================================================
const UserManager = {
  /**
   * Inicializa o gerenciador de usuário
   */
  async init() {
    await this.updateGreeting();
  },

  /**
   * Atualiza a saudação com o nome do usuário
   */
  async updateGreeting() {
    const greetingElement = document.getElementById('saudacao-usuario');
    if (!greetingElement) return;

    try {
      // Verifica se o usuário está logado
      if (!window.AuthManager || !await window.AuthManager.isAuthenticated()) {
        greetingElement.textContent = 'Olá, Visitante';
        return;
      }

      // Busca informações do usuário (você pode implementar uma API para isso)
      // Por enquanto, vamos usar um nome genérico
      const userName = await this.getUserName();
      greetingElement.textContent = `Olá, ${userName}`;
    } catch (error) {
      console.error('Erro ao atualizar saudação:', error);
      greetingElement.textContent = 'Olá';
    }
  },

  /**
   * Obtém o nome do usuário
   * TODO: Implementar chamada à API para buscar dados reais do usuário
   */
  async getUserName() {
    // Por enquanto retorna um nome padrão
    // Você pode implementar uma chamada à API aqui para buscar o nome real
    return 'Estudante';
  }
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
    
    // Trunca o título se for muito longo
    const displayTitle = this.truncateTitle(videoProgress.title, 50);
    
    card.innerHTML = `
      <div class="card-thumbnail-wrapper">
        <img src="${thumbnailUrl}" alt="${videoProgress.title}" class="card-thumbnail" />
        <div class="card-progress-overlay">
          <div class="card-progress-bar" style="width: ${percentage}%"></div>
        </div>
      </div>
      <div class="legenda-cartao">
        <div class="card-topic">${videoProgress.topic}</div>
        <div class="card-title">${displayTitle}</div>
        <div class="card-percentage">${percentage}% completo</div>
      </div>
    `;

    // Event listener para navegação
    card.addEventListener('click', this.handleCardClick.bind(this));

    return card;
  },

  /**
   * Trunca o título se for muito longo
   * @param {string} title - Título original
   * @param {number} maxLength - Comprimento máximo
   * @returns {string} - Título truncado
   */
  truncateTitle(title, maxLength) {
    if (!title) return 'Sem título';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  },

  /**
   * Manipula o clique em um card
   * @param {Event} event - Evento de clique
   */
  handleCardClick(event) {
    const card = event.currentTarget;
    const videoId = card.dataset.videoId;
    const type = card.dataset.videoType;
    
    // Adiciona um efeito visual de clique
    card.style.transform = 'scale(0.95)';
    setTimeout(() => {
      card.style.transform = '';
      window.location.href = `tl2-teologia.html?videoId=${videoId}&type=${type}`;
    }, 150);
  },

  /**
   * Carrega e exibe os cards da jornada
   */
  async loadJourney() {
    if (!this.container) return;

    try {
      // Exibe estado de carregamento
      this.showLoading();

      // Aguarda o progressManager estar disponível
      if (!window.progressManager) {
        // Aguarda um pouco para o progressManager ser inicializado
        await this.waitForProgressManager();
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
        this.showEmptyState('Parabéns! Você concluiu seus vídeos recentes. 🎉');
      }

    } catch (error) {
      console.error('Erro ao carregar jornada:', error);
      this.showError('Erro ao carregar progresso. Tente novamente mais tarde.');
    }
  },

  /**
   * Aguarda o progressManager estar disponível
   * @returns {Promise<void>}
   */
  async waitForProgressManager() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.progressManager) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout após 5 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  },

  /**
   * Exibe estado de carregamento
   */
  showLoading() {
    this.container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Carregando seu progresso...</p>
      </div>
    `;
  },

  /**
   * Exibe mensagem de estado vazio
   * @param {string} message - Mensagem a ser exibida
   */
  showEmptyState(message) {
    this.container.innerHTML = `
      <div class="empty-state">
        <p class="jornada-vazia">${message}</p>
      </div>
    `;
  },

  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="error-state">
        <p class="jornada-erro">${message}</p>
      </div>
    `;
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
      this.showCopyFeedback();
    } catch (error) {
      console.error('Erro ao copiar:', error);
      alert('Não foi possível copiar.');
    }
  },

  /**
   * Exibe feedback visual de cópia bem-sucedida
   */
  showCopyFeedback() {
    const button = this.elements.copyButton;
    const originalHTML = button.innerHTML;
    
    button.innerHTML = '✓';
    button.style.backgroundColor = '#4CAF50';
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.backgroundColor = '';
    }, 2000);
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
        // Fallback: copia para área de transferência
        await this.copyVerse(text);
        alert('Versículo copiado! Cole onde desejar.');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }
};

// =============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('[home2.js] Inicializando aplicação...');
  
  // Inicializa todos os módulos
  await UserManager.init();
  JourneyManager.init();
  VerseManager.init();
  
  console.log('[home2.js] Aplicação inicializada com sucesso!');
});

