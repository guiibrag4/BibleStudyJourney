// Arquivo: www/js/video-player.js (COM RASTREAMENTO PRECISO)

document.addEventListener('DOMContentLoaded', function () {
  // --- SEÇÃO 1: Carregar a API do Iframe do YouTube ---
  // Este código cria uma tag <script> e a insere na página para carregar a API.
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script' )[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

   // --- NOVO: Adicionar a configuração da API aqui ---
  const API_CONFIG = {
      development: "http://localhost:3000",
      production: "https://biblestudyjourney.duckdns.org",
      production_render: "https://biblestudyjourney-v2.onrender.com"
  };

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

  const devOrigin = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

  function createPlayer(startTime) {
    player = new YT.Player('videoFrame', { // 'videoFrame' é o ID do seu <iframe>
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'rel': 0,
        'modestbranding': 1,
        'start': startTime,
        'origin': devOrigin
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }

  // Função chamada quando o player está pronto
  function onPlayerReady(event) {
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
      console.log(`Salvando progresso no tempo: ${Math.floor(currentTime)}s`);
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
    const apiUrl = `${API_CONFIG.production_render}/api/video-info?videoId=${videoId}`; // Usando a mesma lógica de ambiente
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
