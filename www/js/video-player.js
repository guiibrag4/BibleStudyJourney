// Arquivo: www/js/video-player.js (COM RASTREAMENTO PRECISO E DETECÇÃO DE AMBIENTE)

document.addEventListener('DOMContentLoaded', function () {

  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.history.back();
    });
  }

  // --- SEÇÃO 1: Carregar a API do Iframe do YouTube ---
  // Este código cria uma tag <script> e a insere na página para carregar a API.
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // --- CORRIGIDO: Detecção automática de ambiente baseada no hostname ---
  function getApiBaseUrl() {
    const hostname = window.location.hostname;

    // Se estiver em localhost, usa a API local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    // Se estiver no domínio do Render, usa a API do Render
    if (hostname.includes('onrender.com')) {
      return 'https://biblestudyjourney-v2.onrender.com';
    }

    // Se estiver no domínio principal (duckdns.org), usa a API do domínio principal
    if (hostname.includes('duckdns.org')) {
      return 'https://biblestudyjourney.duckdns.org';
    }

    // Fallback: tenta usar o mesmo protocolo e host da página atual
    return window.location.origin;
  }

  const API_BASE_URL = getApiBaseUrl();
  console.log('API Base URL detectada:', API_BASE_URL);

  // --- SEÇÃO 2: Referências do DOM e Variáveis Globais ---
  const videoTypeTitleEl = document.getElementById('videoTypeTitle');
  const videoLessonTitleEl = document.getElementById('videoLessonTitle');
  const videoDescriptionTextEl = document.getElementById('videoDescriptionText');
  const readMoreButton = document.getElementById('readMoreButton');

  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('videoId');
  const typeTitleFromUrl = urlParams.get('type');

  let player; // Variável para guardar o objeto do player do YouTube
  let progressTimer; // Variável para o nosso setInterval
  let lastSavedTime = -1; // Para evitar salvamentos repetidos com o mesmo tempo

  // --- SEÇÃO 3: Função Global de Callback da API ---
  // A API do YouTube procurará por esta função global. Quando a API estiver pronta,
  // ela chamará esta função, que então criará nosso player.
  window.onYouTubeIframeAPIReady = function () {
    if (videoId) {
      initializePage();
    } else {
      handleError("ID do vídeo não fornecido na URL.");
    }
  };

  // --- SEÇÃO 4: Lógica Principal de Inicialização ---
  function initializePage() {
    // Preenche o título do tópico
    if (typeTitleFromUrl && videoTypeTitleEl) {
      videoTypeTitleEl.textContent = decodeURIComponent(typeTitleFromUrl);
    }

    // Busca os dados do nosso backend (título, descrição, etc.)
    fetchVideoInfo();

    // Lógica de "Continuar Assistindo"
    window.progressManager?.getProgress(videoId).then(savedProgress => {
      let startTime = 0;
      if (savedProgress && savedProgress.currentTime > 10) {
        const percentage = (savedProgress.currentTime / savedProgress.duration) * 100;
        if (percentage < 95) {
          if (confirm(`Deseja continuar assistindo de onde parou (${Math.floor(percentage)}%)?`)) {
            startTime = Math.floor(savedProgress.currentTime);
          }
        }
      }
      // Cria o player do YouTube com o tempo de início correto
      createPlayer(startTime);
    });
  }

  // --- SEÇÃO 5: Funções do Player e Rastreamento ---

  function createPlayer(startTime) {
    player = new YT.Player('videoFrame', { // 'videoFrame' é o ID do seu <iframe>
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        start: startTime,
        playsinline: 1, // Para iOS: toca no player embutido
        mute: 1, // Começa mudo para evitar bloqueios de autoplay
        origin: window.location.origin // Segurança adicional
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });
  }

  // Função chamada quando o player está pronto
  function onPlayerReady(event) {
    const iframe = player.getIframe();
    if (iframe) iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; web-share');

    // Inicia o timer para salvar o progresso periodicamente
    startProgressTracking();
  }

  // Função chamada sempre que o estado do player muda (play, pause, fim, etc.)
  function onPlayerStateChange(event) {
    // Se o vídeo for pausado (state 2) ou terminar (state 0),
    // fazemos um salvamento final para garantir que o último segundo seja registrado.
    if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      console.log("Vídeo pausado ou finalizado. Salvando progresso final.");
      saveCurrentProgress();
    }
  }

  // FUNÇÃO DE RASTREAMENTO CORRIGIDA
  function startProgressTracking() {
    // Limpa qualquer timer antigo para segurança
    if (progressTimer) clearInterval(progressTimer);

    progressTimer = setInterval(() => {
      // Só executa se o player existir e o vídeo estiver tocando (state 1)
      if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
        saveCurrentProgress();
      }
    }, 5000); // Verifica a cada 5 segundos
  }

  // FUNÇÃO DE SALVAMENTO CENTRALIZADA
  function saveCurrentProgress() {
    // Pega o tempo ATUAL e REAL do player
    const currentTime = player.getCurrentTime();

    // Condição para evitar salvamentos desnecessários se o tempo não mudou
    if (Math.abs(currentTime - lastSavedTime) < 1) {
      return;
    }

    lastSavedTime = currentTime; // Atualiza o último tempo salvo

    if (window.progressManager && window.videoDuration) {
      window.progressManager.saveProgress({
        id: videoId,
        title: videoLessonTitleEl.textContent,
        topic: decodeURIComponent(typeTitleFromUrl),
        currentTime: currentTime,
        duration: window.videoDuration,
      });
    }
  }

  // Limpa o timer ao sair da página
  window.addEventListener('beforeunload', () => {
    if (progressTimer) clearInterval(progressTimer);
    // Salva uma última vez ao fechar a aba/janela, se o vídeo estiver tocando
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
      saveCurrentProgress();
    }
  });

  // --- SEÇÃO 6: Funções Auxiliares (Busca de API, UI) ---

  function fetchVideoInfo() {
    // CORRIGIDO: Usa a URL base detectada automaticamente
    const apiUrl = `${API_BASE_URL}/api/video-info?videoId=${videoId}`;
    console.log('Buscando informações do vídeo em:', apiUrl);

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Falha ao buscar dados do vídeo. Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        videoLessonTitleEl.textContent = data.title || "Título não encontrado";
        const formattedDescription = data.description ? data.description.replace(/\n/g, ' ') : "Descrição não disponível.";
        videoDescriptionTextEl.innerHTML = `<p>${formattedDescription}</p>`;
        window.videoDuration = data.durationInSeconds || 3600;

        setTimeout(() => {
          if (videoDescriptionTextEl.scrollHeight > videoDescriptionTextEl.clientHeight) {
            readMoreButton.style.display = 'inline-block';
          }
        }, 200);
      })
      .catch(error => {
        handleError("Não foi possível carregar a descrição.", error);
      });
  }

  function handleError(message, error) {
    console.error(message, error || '');
    videoLessonTitleEl.textContent = "Erro ao Carregar Vídeo";
    videoDescriptionTextEl.innerHTML = `<p>${message}</p>`;
  }

  // Lógica do botão "Ler mais" (sem alterações)
  if (readMoreButton) {
    readMoreButton.addEventListener('click', function () {
      videoDescriptionTextEl.classList.toggle('expanded');
      this.textContent = videoDescriptionTextEl.classList.contains('expanded') ? 'Ler menos' : 'Ler mais...';
      videoDescriptionTextEl.style.maxHeight = videoDescriptionTextEl.classList.contains('expanded') ? videoDescriptionTextEl.scrollHeight + 'px' : '100px';
    });
  }
});

