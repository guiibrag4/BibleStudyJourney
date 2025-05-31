document.addEventListener('DOMContentLoaded', function() {
  const topicItems = document.querySelectorAll('.topic-item');
  topicItems.forEach(function(item) {
    const header = item.querySelector('.topic-header');
    header.addEventListener('click', function(e) {
      item.classList.toggle('expanded');
      const chevron = item.querySelector('.chevron-container img');
      chevron.style.transform = item.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
      item.setAttribute('aria-expanded', item.classList.contains('expanded').toString());
    });

    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-expanded', 'false');

    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
    // Adicionar event listeners para os vídeos DENTRO de cada topic-item
    const videoItems = item.querySelectorAll('.video-item');
    videoItems.forEach(videoEl => { // Renomeei para videoEl para clareza
      videoEl.addEventListener('click', function(event) { // Adicionei 'event' aqui
        // Impede que o clique no checkbox dispare a navegação, se houver um
        if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
          return;
        }

        const videoId = this.dataset.videoId; // Pega o ID do vídeo do atributo data-video-id

        // ---- INÍCIO DAS MODIFICAÇÕES ----
        const lessonTitleElement = this.querySelector('.video-title');
        const lessonTitle = lessonTitleElement ? lessonTitleElement.textContent : "Título Padrão da Aula";

        const topicItemElement = this.closest('.topic-item');
        const typeTitleElement = topicItemElement ? topicItemElement.querySelector('.topic-title') : null;
        const typeTitle = typeTitleElement ? typeTitleElement.textContent : "Tópico Padrão";
        // ---- FIM DAS MODIFICAÇÕES ----

        if (videoId) {
          // Redireciona para a página do player com o ID do vídeo como parâmetro
          // E AGORA COM OS TÍTULOS
          let url = `tl2-teologia.html?videoId=${videoId}`; // Assumindo que sua página do player é video-player.html
          if (lessonTitle) {
            url += `&title=${encodeURIComponent(lessonTitle)}`;
          }
          if (typeTitle) {
            url += `&type=${encodeURIComponent(typeTitle)}`;
          }
          window.location.href = url;

        } else {
          console.error('Video ID não encontrado para:', this);
        }
      });
      // Adicionar estilo de cursor para indicar que é clicável
      videoEl.style.cursor = 'pointer';
    });
  });
});