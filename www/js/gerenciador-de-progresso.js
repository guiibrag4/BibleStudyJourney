// Arquivo: www/js/progress-manager.js

(function() {
  const PROGRESS_KEY = 'videoProgress';

  // Garante que o localForage está disponível
  if (typeof localforage === 'undefined') {
    console.error('localForage não está carregado. O progresso não será salvo.');
    return;
  }

  const progressManager = {
    /**
     * Salva o progresso de um vídeo.
     * videoData deve conter: id, title, topic, currentTime, duration, lastWatched (timestamp)
     */
    async saveProgress(videoData) {
      try {
        const allProgress = await localforage.getItem(PROGRESS_KEY) || {};
        // Atualiza o registro do vídeo com os novos dados
        allProgress[videoData.id] = {
          ...allProgress[videoData.id], // Mantém dados antigos se houver
          ...videoData,
          lastWatched: Date.now() // Atualiza sempre com o momento do salvamento
        };
        await localforage.setItem(PROGRESS_KEY, allProgress);
        console.log('Progresso salvo para o vídeo:', videoData.id);
      } catch (err) {
        console.error('Erro ao salvar o progresso:', err);
      }
    },

    /**
     * Obtém o progresso de um vídeo específico.
     */
    async getProgress(videoId) {
      try {
        const allProgress = await localforage.getItem(PROGRESS_KEY) || {};
        return allProgress[videoId];
      } catch (err) {
        console.error('Erro ao obter progresso:', err);
        return null;
      }
    },

    /**
     * Obtém todos os vídeos com progresso, ordenados pelo mais recente.
     */
    async getAllProgress() {
      try {
        const allProgress = await localforage.getItem(PROGRESS_KEY) || {};
        // Converte o objeto em um array e ordena
        const sortedProgress = Object.values(allProgress)
          .sort((a, b) => b.lastWatched - a.lastWatched); // Do mais novo para o mais antigo
        return sortedProgress;
      } catch (err) {
        console.error('Erro ao obter todo o progresso:', err);
        return [];
      }
    }
  };

  // Torna o gerenciador acessível globalmente
  window.progressManager = progressManager;
})();
