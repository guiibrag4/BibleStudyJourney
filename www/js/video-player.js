// Arquivo: www/js/video-player.js

document.addEventListener('DOMContentLoaded', function () {
  // 1. Referências aos elementos do DOM (sem alterações)
  const iframePlayer = document.getElementById('videoFrame');
  const videoTypeTitleEl = document.getElementById('videoTypeTitle');
  const videoLessonTitleEl = document.getElementById('videoLessonTitle');
  const videoDescriptionTextEl = document.getElementById('videoDescriptionText');
  const readMoreButton = document.getElementById('readMoreButton');

  // 2. Parâmetros da URL (sem alterações)
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('videoId');
  const typeTitleFromUrl = urlParams.get('type');

  // 3. Variável para controlar o timer de progresso
  let progressTimer;

  // 4. Limpa o timer ao sair da página para evitar execuções indesejadas
  window.addEventListener('beforeunload', () => {
    if (progressTimer) {
      clearInterval(progressTimer);
    }
  });

  // 5. Função principal que executa se um videoId for encontrado
  if (videoId) {
    // Define o título do tópico (Ex: "Bíblia")
    if (typeTitleFromUrl && videoTypeTitleEl) {
      videoTypeTitleEl.textContent = decodeURIComponent(typeTitleFromUrl);
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;

    // --- LÓGICA DE "CONTINUAR ASSISTINDO" ---
    // Verifica se há progresso salvo para este vídeo
    window.progressManager?.getProgress(videoId ).then(savedProgress => {
      let finalEmbedUrl = embedUrl;
      let startTime = 0;

      // Se houver progresso salvo e não estiver quase no final...
      if (savedProgress && savedProgress.currentTime > 10) {
        const percentage = (savedProgress.currentTime / savedProgress.duration) * 100;
        if (percentage < 95) { // Só continua se o vídeo não estiver "concluído"
          if (confirm(`Deseja continuar assistindo de onde parou (${Math.floor(percentage)}%)?`)) {
            startTime = Math.floor(savedProgress.currentTime);
            finalEmbedUrl += `&start=${startTime}`;
          }
        }
      }
      
      // Define o src do iframe e inicia o rastreamento de progresso
      iframePlayer.src = finalEmbedUrl;
      startProgressTracking(startTime);
    });

    // --- BUSCA DE DADOS NA API (TÍTULO, DESCRIÇÃO E DURAÇÃO) ---
    const apiUrl = `http://localhost:3000/api/video-info?videoId=${videoId}`;
    fetch(apiUrl )
      .then(response => {
        if (!response.ok) throw new Error(`Falha ao buscar dados do vídeo. Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        // Preenche o título e a descrição com os dados da API
        videoLessonTitleEl.textContent = data.title || "Título não encontrado";
        const formattedDescription = data.description ? data.description.replace(/\n/g, ' ') : "Descrição não disponível.";
        videoDescriptionTextEl.innerHTML = `<p>${formattedDescription}</p>`;

        // Armazena a duração real do vídeo para usar no rastreamento
        window.videoDuration = data.durationInSeconds || 3600; // Padrão de 1h se a API falhar

        // Lógica do botão "Ler mais"
        setTimeout(() => {
          if (videoDescriptionTextEl.scrollHeight > videoDescriptionTextEl.clientHeight) {
            readMoreButton.style.display = 'inline-block';
          }
        }, 200);
      })
      .catch(error => {
        console.error('Erro ao carregar informações do vídeo:', error);
        videoLessonTitleEl.textContent = "Erro ao carregar título";
        videoDescriptionTextEl.innerHTML = "<p>Não foi possível carregar a descrição. Verifique o console para mais detalhes.</p>";
      });

    // --- FUNÇÃO PARA RASTREAR E SALVAR O PROGRESSO ---
    function startProgressTracking(startTime) {
      let currentTime = startTime;
      
      progressTimer = setInterval(() => {
        currentTime += 5; // Simula o avanço do tempo (a cada 5 segundos)

        if (window.progressManager && window.videoDuration) {
          window.progressManager.saveProgress({
            id: videoId,
            title: videoLessonTitleEl.textContent, // Pega o título já carregado
            topic: decodeURIComponent(typeTitleFromUrl),
            currentTime: currentTime,
            duration: window.videoDuration, // Usa a duração real vinda da API
          });
        }
      }, 5000); // Salva a cada 5 segundos
    }

    // Lógica do botão "Ler mais" (sem alterações)
    if (readMoreButton) {
      readMoreButton.addEventListener('click', function () {
        videoDescriptionTextEl.classList.toggle('expanded');
        if (videoDescriptionTextEl.classList.contains('expanded')) {
          videoDescriptionTextEl.style.maxHeight = videoDescriptionTextEl.scrollHeight + 'px';
          this.textContent = 'Ler menos';
        } else {
          videoDescriptionTextEl.style.maxHeight = '100px'; // Altura original definida no CSS
          this.textContent = 'Ler mais...';
        }
      });
    }

  } else {
    // Lógica de erro caso não haja videoId (sem alterações)
    videoLessonTitleEl.textContent = "Erro ao Carregar Vídeo";
    console.error('ID do vídeo não fornecido na URL.');
  }
});