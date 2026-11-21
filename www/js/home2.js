// =============================================================================
// GERENCIAMENTO DO DEVOCIONAL DIÁRIO COM IA E GAMIFICAÇÃO
// =============================================================================
const DevotionalManager = {
  elements: {},
  devotionalData: null,
  streakData: null,

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.loadDevotional();
    this.loadStreakData();
  },

  cacheElements() {
    // Preview
    this.elements = {
      previewVerseText: document.getElementById('preview-verse-text'),
      previewVerseRef: document.getElementById('preview-verse-ref'),
      previewStudyText: document.getElementById('preview-study-text'),
      streakCount: document.getElementById('streak-count'),
      btnAbrirModal: document.getElementById('btn-abrir-devocional'),
      btnCompartilhar: document.getElementById('btn-compartilhar-devocional'),
      btnCopiar: document.getElementById('btn-copiar-devocional'),
      
      // Modal
      modal: document.getElementById('modal-devocional'),
      btnFecharModal: document.getElementById('btn-fechar-modal'),
      btnConcluir: document.getElementById('btn-concluir-devocional'),
      modalData: document.getElementById('modal-data'),
      modalVerseText: document.getElementById('modal-verse-text'),
      modalVerseRef: document.getElementById('modal-verse-ref'),
      modalStudyText: document.getElementById('modal-study-text'),
      modalReflectionText: document.getElementById('modal-reflection-text'),
      modalApplicationText: document.getElementById('modal-application-text'),
      modalStreakCount: document.getElementById('modal-streak-count')
    };
  },

  setupEventListeners() {
    if (this.elements.btnAbrirModal) {
      this.elements.btnAbrirModal.addEventListener('click', () => this.openModal());
    }
    if (this.elements.btnFecharModal) {
      this.elements.btnFecharModal.addEventListener('click', () => this.closeModal());
    }
    if (this.elements.btnConcluir) {
      this.elements.btnConcluir.addEventListener('click', () => this.markAsComplete());
    }
    if (this.elements.btnCompartilhar) {
      this.elements.btnCompartilhar.addEventListener('click', () => this.shareDevotional());
    }
    if (this.elements.btnCopiar) {
      this.elements.btnCopiar.addEventListener('click', () => this.copyDevotional());
    }
    
    // Fecha modal com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.elements.modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });
  },

  async loadDevotional() {
    try {
      const token = window.AuthManager ? await window.AuthManager.getToken() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${CONFIG.BIBLE_API_URL}/devotional/daily`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
      const data = await response.json();
      
      this.devotionalData = data;
      this.displayPreview(data);
      
      if (data.cached) {
        console.log('✅ Devocional carregado do cache (sem custo de IA)');
      } else {
        console.log('🚀 Devocional gerado agora (primeira requisição do dia)');
      }
    } catch (error) {
      console.error('Erro ao buscar devocional:', error);
      this.showError();
    }
  },

  displayPreview(data) {
    if (!data.verse) return;
    
    // Atualiza preview
    this.elements.previewVerseText.textContent = data.verse.text || 'Versículo não disponível';
    this.elements.previewVerseRef.textContent = data.verse.reference || '';
    this.elements.previewStudyText.textContent = data.estudo || 'Estudo não disponível';
    
    // Atualiza data no header (preview e modal)
    const hoje = new Date().toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long' 
    });
    const dataFormatada = hoje.charAt(0).toUpperCase() + hoje.slice(1);
    
    const dataEl = document.querySelector('.devocional-data');
    if (dataEl) dataEl.textContent = dataFormatada;
    
    if (this.elements.modalData) {
      this.elements.modalData.textContent = `❤️‍🔥 ${dataFormatada}`;
    }
  },

  async loadStreakData() {
    try {
      const token = window.AuthManager ? await window.AuthManager.getToken() : null;
      if (!token) return;
      
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${CONFIG.BIBLE_API_URL}/devotional/stats`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
      const data = await response.json();
      
      this.streakData = data;
      this.updateStreakDisplay(data.currentStreak);
      
      // Atualiza estado do botão se já leu hoje
      if (data.readToday && this.elements.btnConcluir) {
        this.elements.btnConcluir.classList.add('concluido');
        this.elements.btnConcluir.textContent = '✅ Devocional Concluído Hoje';
        this.elements.btnConcluir.disabled = true;
      }
    } catch (error) {
      console.error('Erro ao buscar streak:', error);
    }
  },

  updateStreakDisplay(streak) {
    if (this.elements.streakCount) {
      this.elements.streakCount.textContent = streak;
    }
    if (this.elements.modalStreakCount) {
      this.elements.modalStreakCount.textContent = streak;
    }
  },

  openModal() {
    if (!this.devotionalData) return;
    
    // Preenche modal com dados completos
    this.elements.modalVerseText.textContent = this.devotionalData.verse?.text || '';
    this.elements.modalVerseRef.textContent = this.devotionalData.verse?.reference || '';
    this.elements.modalStudyText.textContent = this.devotionalData.estudo || '';
    this.elements.modalReflectionText.textContent = this.devotionalData.reflexao || '';
    this.elements.modalApplicationText.textContent = this.devotionalData.aplicacao || '';
    
    // Mostra modal
    this.elements.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    console.log('📖 Modal devocional aberto');
  },

  closeModal() {
    this.elements.modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  },

  async markAsComplete() {
    if (this.elements.btnConcluir.disabled) return;
    
    try {
      this.elements.btnConcluir.disabled = true;
      this.elements.btnConcluir.textContent = '⏳ Processando...';
      
      const token = window.AuthManager ? await window.AuthManager.getToken() : null;
      if (!token) {
        alert('Você precisa estar logado para marcar o devocional como concluído');
        this.elements.btnConcluir.disabled = false;
        this.elements.btnConcluir.textContent = '✅ Concluir Devocional';
        return;
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${CONFIG.BIBLE_API_URL}/devotional/mark-read`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
      const data = await response.json();
      
      this.updateStreakDisplay(data.currentStreak);
      
      // Anima streak
      const streakEls = document.querySelectorAll('.devocional-streak, .modal-streak');
      streakEls.forEach(el => {
        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 600);
      });
      
      this.showConfetti();
      
      if (data.newBadges && data.newBadges.length > 0) {
        setTimeout(() => {
          data.newBadges.forEach((badge, index) => {
            setTimeout(() => this.showBadgeUnlocked(badge), index * 500);
          });
        }, 1000);
      }
      
      this.elements.btnConcluir.classList.add('concluido');
      this.elements.btnConcluir.textContent = '✅ Devocional Concluído Hoje';
      
      setTimeout(() => this.closeModal(), 2000);
      
      console.log('🎉 Devocional marcado como concluído!', data);
      
    } catch (error) {
      console.error('Erro ao marcar devocional como concluído:', error);
      alert('Erro ao processar. Tente novamente.');
      this.elements.btnConcluir.disabled = false;
      this.elements.btnConcluir.textContent = '✅ Concluir Devocional';
    }
  },

  showConfetti() {
    if (typeof confetti === 'undefined') return;
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#667eea', '#764ba2', '#10B981', '#FFD700']
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#667eea', '#764ba2', '#10B981']
      });
    }, 200);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#667eea', '#764ba2', '#10B981']
      });
    }, 400);
  },

  showBadgeUnlocked(badge) {
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML = `
      <div class="badge-toast-content">
        <span class="badge-emoji">${badge.emoji}</span>
        <div>
          <strong>🏆 Conquista Desbloqueada!</strong>
          <p>${badge.title}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  async shareDevotional() {
    if (!this.devotionalData?.verse) return;
    
    const text = `� Devocional do Dia\n\n"${this.devotionalData.verse.text}"\n\n${this.devotionalData.verse.reference}\n\n💡 ${this.devotionalData.estudo.substring(0, 100)}...\n\n#DevocionalDiário #BibleStudy`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      await this.copyDevotional();
      alert('Texto copiado! Cole onde desejar.');
    }
  },

  async copyDevotional() {
    if (!this.devotionalData?.verse) return;
    
    const text = `📖 Devocional do Dia\n\n"${this.devotionalData.verse.text}"\n\n${this.devotionalData.verse.reference}`;
    
    try {
      await navigator.clipboard.writeText(text);
      
      const btn = this.elements.btnCopiar;
      const originalText = btn.textContent;
      btn.textContent = '✅ Copiado!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  },

  showError() {
    this.elements.previewVerseText.textContent = 'Não foi possível carregar o devocional.';
    this.elements.previewStudyText.textContent = 'Tente novamente mais tarde.';
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
// ⚠️ NOTA: A configuração de API agora está centralizada em config.js
// Aqui apenas definimos constantes específicas da página home

const HOME_CONFIG = {
  COMPLETION_THRESHOLD: 95, // Porcentagem para considerar vídeo completo
  MAX_RECENT_VIDEOS: 5,     // Máximo de vídeos recentes a exibir
  THUMBNAIL_QUALITY: 'mqdefault' // Qualidade da thumbnail do YouTube
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
    if (percentage >= HOME_CONFIG.COMPLETION_THRESHOLD) return null;

    // Criação do elemento
    const card = document.createElement('article');
    card.className = 'cartao-jornada';
    card.dataset.videoId = videoProgress.id;
    card.dataset.videoType = encodeURIComponent(videoProgress.topic);
    card.style.animationDelay = `${this.container.childElementCount * 0.1}s`; // Adiciona delay de animação dinâmico

    // Conteúdo do card (usando a estrutura do seu CSS extra)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoProgress.id}/${HOME_CONFIG.THUMBNAIL_QUALITY}.jpg`;


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

      const recentVideos = allProgress.slice(0, HOME_CONFIG.MAX_RECENT_VIDEOS);

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
    const bookNames = { gn: "Gênesis", ex: "Êxodo", lv: "Levítico", nm: "Números", dt: "Deuteronômio", js: "Josué", jz: "Juízes", rt: "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel", "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas", ed: "Esdras", ne: "Neemias", et: "Ester", jó: "Jó", sl: "Salmos", pv: "Provérbios", ec: "Eclesiastes", ct: "Cantares", is: "Isaías", jr: "Jeremias", lm: "Lamentações", ez: "Ezequiel", dn: "Daniel", os: "Oséias", jl: "Joel", am: "Amós", ob: "Obadias", jn: "Jonas", mq: "Miquéias", na: "Naum", hc: "Habacuque", sf: "Sofonias", ag: "Ageu", zc: "Zacarias", ml: "Malaquias", mt: "Mateus", mc: "Marcos", lc: "Lucas", jo: "João", at: "Atos", rm: "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios", gl: "Gálatas", ef: "Efésios", fp: "Filipenses", cl: "Colossenses", "1ts": "1 Tessalonicenses", "2ts": "2 Tessalonicenses", "1tm": "1 Timóteo", "2tm": "2 Timóteo", tt: "Tito", fl: "Filemom", hb: "Hebreus", tg: "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro", "1jo": "1 João", "2jo": "2 João", "3jo": "3 João", jd: "Judas", ap: "Apocalipse" };
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

    // Versão padrão do versículo do dia (Bíblia Livre, licença aberta)
    const version = 'blivre';

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