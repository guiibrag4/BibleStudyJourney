// Arquivo: www/js/home2.js

document.addEventListener('DOMContentLoaded', function() {
  // --- LÓGICA DOS CARDS DA JORNADA ---
  const journeyContainer = document.querySelector('.cartoes-jornada');

  // Função para criar um card da jornada
  function createJourneyCard(videoProgress) {
    // Evita erro se a duração for zero
    if (!videoProgress.duration) return null; 
    
    const percentage = Math.floor((videoProgress.currentTime / videoProgress.duration) * 100);
    
    if (percentage >= 95) return null;

    const card = document.createElement('article');
    card.className = 'cartao-jornada';
    card.dataset.videoId = videoProgress.id;
    card.dataset.videoType = encodeURIComponent(videoProgress.topic);

    const thumbnailUrl = `https://img.youtube.com/vi/${videoProgress.id}/mqdefault.jpg`;

    card.innerHTML = `
      <img src="${thumbnailUrl}" alt="${videoProgress.title}" />
      <div class="legenda-cartao">${videoProgress.topic} - ${percentage}%</div>
    `;

    card.addEventListener('click', function( ) {
      const videoId = this.dataset.videoId;
      const type = this.dataset.videoType;
      // Navega para a página do player com os dados corretos
      window.location.href = `tl2-teologia.html?videoId=${videoId}&type=${type}`;
    });

    return card;
  }

  // Função para carregar e exibir os cards
  async function loadJourney() {
    // Verifica se o progressManager e o container existem
    if (window.progressManager && journeyContainer) {
      const allProgress = await window.progressManager.getAllProgress();
      
      journeyContainer.innerHTML = ''; // Limpa os cards de exemplo

      const recentVideos = allProgress.slice(0, 5); // Pega os 5 mais recentes

      if (recentVideos.length === 0) {
        journeyContainer.innerHTML = '<p class="jornada-vazia">Comece uma aula na trilha para ver seu progresso aqui!</p>';
        return;
      }

      let cardsAdded = 0;
      recentVideos.forEach(video => {
        const card = createJourneyCard(video);
        if (card) {
          journeyContainer.appendChild(card);
          cardsAdded++;
        }
      });

      // Mensagem caso todos os vídeos assistidos já estejam concluídos
      if (cardsAdded === 0) {
        journeyContainer.innerHTML = '<p class="jornada-vazia">Parabéns! Você concluiu seus vídeos recentes.</p>';
      }

    } else if (journeyContainer) {
      // Mensagem de erro se o progressManager não carregar
      journeyContainer.innerHTML = '<p class="jornada-vazia">Erro ao carregar progresso.</p>';
    }
  }

  // Chama a função para carregar a jornada
  loadJourney();


  // --- LÓGICA DOS BOTÕES (COPIAR/COMPARTILHAR) ---
  const botaoCopiar = document.getElementById('botao-copiar-versiculo');
  const botaoCompartilhar = document.getElementById('botao-compartilhar-versiculo');
  const textoVersiculoElement = document.querySelector('.texto-versiculo');

  if (textoVersiculoElement) {
    const textoVersiculo = textoVersiculoElement.innerText.trim();
    const referencia = document.querySelector('.referencia-versiculo').innerText.trim();
    const textoCompleto = `${textoVersiculo}\n\n${referencia}`;

    if (botaoCopiar) {
      botaoCopiar.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(textoCompleto);
          // Feedback visual para o usuário (opcional)
        } catch (e) {
          alert('Não foi possível copiar.');
        }
      });
    }

    if (botaoCompartilhar) {
      botaoCompartilhar.addEventListener('click', async () => {
        if (navigator.share) {
          await navigator.share({ title: 'Versículo do dia', text: textoCompleto });
        } else {
          alert('Compartilhamento não suportado neste navegador.');
        }
      });
    }
  }
});
