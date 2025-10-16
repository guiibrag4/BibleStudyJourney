// Arquivo: www/js/video-player.js (VERSÃO FINAL OTIMIZADA)

document.addEventListener('DOMContentLoaded', function () {

  // Listener já passivo, como na versão anterior.
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.history.back();
    }, { passive: true });
  }

  // --- SEÇÃO 1: Carregar a API do Iframe do YouTube ---
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script' )[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // --- LÓGICA DE DETECÇÃO DE AMBIENTE ---
  const isProduction = window.location.hostname.includes('onrender.com') || window.location.hostname.includes('duckdns.org');
  
  function getApiBaseUrl() {
    if (isProduction) {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  }

  const API_BASE_URL = getApiBaseUrl( );
  console.log(`[video-player] Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}. API URL: ${API_BASE_URL}`);

  // --- SEÇÃO 2: Referências do DOM e Variáveis Globais ---
  const videoTypeTitleEl = document.getElementById('videoTypeTitle');
  const videoLessonTitleEl = document.getElementById('videoLessonTitle');
  const videoDescriptionTextEl = document.getElementById('videoDescriptionText');
  const readMoreButton = document.getElementById('readMoreButton');

  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('videoId');
  const typeTitleFromUrl = urlParams.get('type');

  let player;
  let progressTimer;
  let lastSavedTime = -1;

  // --- SEÇÃO 3: Callback da API do YouTube ---
  window.onYouTubeIframeAPIReady = function () {
    if (videoId) {
      initializePage();
    } else {
      handleError("ID do vídeo não fornecido na URL.");
    }
  };

  // --- SEÇÃO 4: Lógica Principal de Inicialização ---
  function initializePage() {
    if (typeTitleFromUrl && videoTypeTitleEl) {
      videoTypeTitleEl.textContent = decodeURIComponent(typeTitleFromUrl);
    }
    fetchVideoInfo();
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
      createPlayer(startTime);
    });
  }

  // --- SEÇÃO 5: Funções do Player e Rastreamento ---

  function createPlayer(startTime) {
    const playerVars = {
      autoplay: 1,
      rel: 0,
      modestbranding: 1,
      start: startTime,
      playsinline: 1,
    };

    if (isProduction) {
      playerVars.origin = window.location.origin;
    }

    player = new YT.Player('videoFrame', {
      host: 'https://www.youtube-nocookie.com',
      videoId: videoId,
      playerVars: playerVars,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange,
        'onError': onPlayerError
      }
    });
  }

  function onPlayerError(event) {
    console.error("Erro do Player do YouTube:", event.data);
    handleError("Não foi possível reproduzir este vídeo. Tente recarregar a página.");
  }

  function onPlayerReady(event) {
    event.target.playVideo();
    startProgressTracking();
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      saveCurrentProgress();
    }
  }

  function startProgressTracking() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      if (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === YT.PlayerState.PLAYING) {
        saveCurrentProgress();
      }
    }, 5000);
  }

  function saveCurrentProgress() {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    
    const currentTime = player.getCurrentTime();
    if (Math.abs(currentTime - lastSavedTime) < 1) {
      return;
    }
    lastSavedTime = currentTime;

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

  window.addEventListener('beforeunload', () => {
    if (progressTimer) clearInterval(progressTimer);
    if (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === YT.PlayerState.PLAYING) {
      saveCurrentProgress();
    }
  });

  // --- SEÇÃO 6: Funções Auxiliares ---

  function fetchVideoInfo() {
    const apiUrl = `${API_BASE_URL}/api/video-info?videoId=${videoId}`;
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Falha ao buscar dados do vídeo: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        videoLessonTitleEl.textContent = data.title || "Título não encontrado";
        const formattedDescription = data.description ? data.description.replace(/\n/g, ' ') : "Descrição não disponível.";
        videoDescriptionTextEl.innerHTML = `<p>${formattedDescription}</p>`;
        window.videoDuration = data.durationInSeconds || 3600;

        // **SOLUÇÃO DEFINITIVA PARA O 'setTimeout'**
        // Usa ResizeObserver para mostrar o botão "Ler mais" de forma eficiente.
        const observer = new ResizeObserver(entries => {
          for (let entry of entries) {
            const contentEl = entry.target;
            if (contentEl.scrollHeight > contentEl.clientHeight) {
              readMoreButton.style.display = 'inline-block';
            } else {
              readMoreButton.style.display = 'none';
            }
          }
          // Uma vez que o botão é mostrado, não precisamos mais observar.
          observer.disconnect();
        });
        
        // Começa a observar o elemento da descrição.
        observer.observe(videoDescriptionTextEl);
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

  if (readMoreButton) {
    readMoreButton.addEventListener('click', function () {
      videoDescriptionTextEl.classList.toggle('expanded');
      this.textContent = videoDescriptionTextEl.classList.contains('expanded') ? 'Ler menos' : 'Ler mais...';
      videoDescriptionTextEl.style.maxHeight = videoDescriptionTextEl.classList.contains('expanded') ? videoDescriptionTextEl.scrollHeight + 'px' : '100px';
    }, { passive: true });
  }
});
