document.addEventListener('DOMContentLoaded', function() {
  // Lógica dos Tópicos
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

    const videoItems = item.querySelectorAll('.video-item');
    videoItems.forEach(videoEl => {
      videoEl.addEventListener('click', function(event) {
        if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
          return;
        }

        const videoId = this.dataset.videoId;
        const lessonTitleElement = this.querySelector('.video-title');
        const lessonTitle = lessonTitleElement ? lessonTitleElement.textContent : "Título Padrão da Aula";
        const topicItemElement = this.closest('.topic-item');
        const typeTitleElement = topicItemElement ? topicItemElement.querySelector('.topic-title') : null;
        const typeTitle = typeTitleElement ? typeTitleElement.textContent : "Tópico Padrão";

        if (videoId) {
          let url = `tl2-teologia.html?videoId=${videoId}`;
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
      videoEl.style.cursor = 'pointer';
    });
  });

  // Lógica de Seleção de Tema
  const themeOptions = document.getElementById('theme-options');
  if (themeOptions) {
      themeOptions.addEventListener('click', (event) => {
          const target = event.target;
          if (target.classList.contains('theme-option-btn')) {
              const selectedTheme = target.dataset.theme;
              if (window.themeManager) {
                  window.themeManager.applyTheme(selectedTheme);
                  window.themeManager.saveTheme(selectedTheme);
              }
              const themeModal = document.getElementById('theme-modal');
              const menuOverlay = document.getElementById('menuOverlay');
              if (themeModal) themeModal.classList.remove('open');
              if (menuOverlay) menuOverlay.classList.remove('ativa');
          }
      });
  }
});