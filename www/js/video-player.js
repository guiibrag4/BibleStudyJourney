document.addEventListener('DOMContentLoaded', function() {
  // Referências aos elementos HTML que você criou na página video-player.html
  const iframePlayer = document.getElementById('videoFrame'); 
  const videoTypeTitleEl = document.getElementById('videoTypeTitle');
  const videoLessonTitleEl = document.getElementById('videoLessonTitle');
  const videoDescriptionTextEl = document.getElementById('videoDescriptionText');
  const readMoreButton = document.getElementById('readMoreButton');

  // Pega os parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('videoId');
  const lessonTitleFromUrl = urlParams.get('title'); 
  const typeTitleFromUrl = urlParams.get('type');

  if (videoId && iframePlayer) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    iframePlayer.src = embedUrl;

    // Preenche o título do TÓPICO (ex: "A Bíblia")
    if (typeTitleFromUrl && videoTypeTitleEl) {
      videoTypeTitleEl.textContent = decodeURIComponent(typeTitleFromUrl);
    } else if (videoTypeTitleEl) {
      // Pode deixar o valor padrão do HTML ou definir um aqui
      // videoTypeTitleEl.textContent = "Conteúdo Principal";
    }

    // Preenche o título da AULA (ex: "Aula 01 - Inspiração...")
    if (lessonTitleFromUrl && videoLessonTitleEl) {
      videoLessonTitleEl.textContent = decodeURIComponent(lessonTitleFromUrl);
    } else if (videoLessonTitleEl) {
      videoLessonTitleEl.textContent = "Vídeo"; // Título padrão
    }

    // --- Lógica para Descrição e "Ler mais..." ---
    // Esta é uma descrição de EXEMPLO. Idealmente, viria da API do YouTube ou seria mais específica.
    // Como estamos passando apenas o título da aula, podemos usar isso na descrição.
    const fullDescription = `Este é um estudo detalhado sobre "${decodeURIComponent(lessonTitleFromUrl || 'o tema selecionado')}". Explore os conceitos fundamentais e aprofunde seu conhecimento. Este material foi preparado para auxiliar em sua jornada de estudos bíblicos.`;

    if (videoDescriptionTextEl) {
      videoDescriptionTextEl.innerHTML = `<p>${fullDescription}</p>`;

      // Lógica para exibir o botão "Ler mais"
      // Verifica se o conteúdo de fato transborda a altura definida no CSS
      // Uma forma simples é verificar o scrollHeight vs clientHeight após um pequeno delay
      setTimeout(() => {
        if (videoDescriptionTextEl.scrollHeight > videoDescriptionTextEl.clientHeight) {
          readMoreButton.style.display = 'inline-block';
        } else {
          // Se não transbordar, não precisa do "Ler mais" e pode remover o efeito de fade (se houver um CSS para isso)
          videoDescriptionTextEl.classList.add('expanded'); // Garante que não fique truncado
          videoDescriptionTextEl.style.maxHeight = 'none';
        }
      }, 100); // Pequeno delay para garantir que o conteúdo foi renderizado
    }

    if (readMoreButton) {
      readMoreButton.addEventListener('click', function() {
        const isExpanded = videoDescriptionTextEl.classList.toggle('expanded');
        if (isExpanded) {
          videoDescriptionTextEl.style.maxHeight = videoDescriptionTextEl.scrollHeight + 'px';
          this.textContent = 'Ler menos';
        } else {
          // A altura truncada é definida pelo CSS em .description-text-content
          // Portanto, ao remover a classe 'expanded', ele volta para o maxHeight do CSS
          // Se você definiu maxHeight: 100px no CSS:
          videoDescriptionTextEl.style.maxHeight = '100px'; // Ou o valor que você usou no CSS
          this.textContent = 'Ler mais...';
        }
      });
    }

  } else {
    // Tratar erro: ID do vídeo não encontrado ou iframe não existe
    if (videoLessonTitleEl) videoLessonTitleEl.textContent = "Erro ao Carregar Vídeo";
    if (videoTypeTitleEl) videoTypeTitleEl.textContent = ""; // Limpa o título do tópico
    if (videoDescriptionTextEl) videoDescriptionTextEl.innerHTML = "<p>Não foi possível carregar as informações do vídeo. Por favor, volte e tente novamente.</p>";
    if (iframePlayer && iframePlayer.parentElement) {
        iframePlayer.parentElement.innerHTML = '<p style="color:red; text-align:center; padding: 20px;">Erro: ID do vídeo não fornecido ou player não pôde ser carregado.</p>';
    }
    console.error('ID do vídeo não fornecido na URL ou elementos HTML essenciais não encontrados.');
  }
});