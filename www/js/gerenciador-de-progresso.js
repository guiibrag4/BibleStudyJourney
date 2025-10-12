// ...existing code...
/**
 * gerenciador-de-progresso.js
 * Gerencia progresso de vídeos usando localForage.
 * API pública: saveProgress, getProgress, getAllProgress, removeProgress, clearAll, getRawStorage
 */

(function () {
  'use strict';

  /* =========================
     CONFIGURAÇÃO / CONSTANTES
     ========================= */
  const PROGRESS_KEY = 'videoProgress';
  const DEBUG = false;

  /* =========================
     UTILITÁRIOS INTERNOS
     ========================= */
  function debugLog(...args) {
    if (DEBUG) console.debug('[progress-manager]', ...args);
  }

  function isLocalForageAvailable() {
    return typeof localforage !== 'undefined' && localforage !== null;
  }

  function safeTimestamp(value) {
    return typeof value === 'number' && !Number.isNaN(value) ? value : Date.now();
  }

  function normalizeVideoData(videoData) {
    // Mantém apenas campos esperados e garante lastWatched
    return {
      id: String(videoData.id || videoData.videoId || '').trim(),
      title: videoData.title || '',
      topic: videoData.topic || '',
      currentTime: Number(videoData.currentTime || 0),
      duration: Number(videoData.duration || 0),
      lastWatched: safeTimestamp(videoData.lastWatched)
    };
  }

  /* =========================
     OPERAÇÕES ASSÍNCRONAS
     ========================= */
  async function readStorage() {
    if (!isLocalForageAvailable()) {
      throw new Error('localForage não está disponível');
    }
    const data = (await localforage.getItem(PROGRESS_KEY)) || {};
    return data;
  }

  async function writeStorage(obj) {
    if (!isLocalForageAvailable()) {
      throw new Error('localForage não está disponível');
    }
    await localforage.setItem(PROGRESS_KEY, obj);
    return obj;
  }

  /* =========================
     API PÚBLICA
     ========================= */
  const progressManager = {
    /**
     * Salva/atualiza o progresso de um vídeo.
     * videoData deve conter pelo menos { id, currentTime, duration }.
     */
    async saveProgress(videoData = {}) {
      try {
        if (!isLocalForageAvailable()) {
          console.error('localForage não está carregado. Progresso não salvo.');
          return false;
        }

        const normalized = normalizeVideoData(videoData);
        if (!normalized.id) {
          console.warn('saveProgress: id do vídeo ausente, progresso ignorado.');
          return false;
        }

        const all = await readStorage();
        const prev = all[normalized.id] || {};
        // Mescla mantendo campos antigos quando apropriado
        all[normalized.id] = {
          ...prev,
          ...normalized,
          lastWatched: Date.now()
        };

        await writeStorage(all);
        debugLog('Progresso salvo', normalized.id, all[normalized.id]);
        return true;
      } catch (err) {
        console.error('Erro ao salvar o progresso:', err);
        return false;
      }
    },

    /**
     * Retorna o progresso de um vídeo ou undefined se não existir.
     */
    async getProgress(videoId) {
      try {
        if (!videoId) return undefined;
        const all = await readStorage();
        return all[String(videoId)] || undefined;
      } catch (err) {
        console.error('Erro ao obter progresso:', err);
        return undefined;
      }
    },

    /**
     * Retorna array com todos os itens de progresso, ordenados por lastWatched (desc).
     */
    async getAllProgress() {
      try {
        const all = await readStorage();
        const arr = Object.values(all || {});
        arr.sort((a, b) => (b.lastWatched || 0) - (a.lastWatched || 0));
        return arr;
      } catch (err) {
        console.error('Erro ao obter todo o progresso:', err);
        return [];
      }
    },

    /**
     * Remove o progresso de um vídeo específico.
     */
    async removeProgress(videoId) {
      try {
        if (!videoId) return false;
        const all = await readStorage();
        if (!Object.prototype.hasOwnProperty.call(all, videoId)) return false;
        delete all[videoId];
        await writeStorage(all);
        debugLog('Progresso removido', videoId);
        return true;
      } catch (err) {
        console.error('Erro ao remover progresso:', err);
        return false;
      }
    },

    /**
     * Limpa todo o progresso salvo.
     */
    async clearAll() {
      try {
        if (!isLocalForageAvailable()) {
          console.error('localForage não está carregado. Clear ignorado.');
          return false;
        }
        await localforage.removeItem(PROGRESS_KEY);
        debugLog('Progresso limpo');
        return true;
      } catch (err) {
        console.error('Erro ao limpar progresso:', err);
        return false;
      }
    },

    /**
     * Retorna o objeto bruto armazenado (útil para debug).
     */
    async getRawStorage() {
      try {
        return await readStorage();
      } catch (err) {
        return {};
      }
    }
  };

  /* =========================
     EXPORTAÇÃO GLOBAL
     ========================= */
  // Congela a API para evitar sobrescritas acidentais
  try {
    window.progressManager = Object.freeze(progressManager);
    debugLog('progressManager inicializado');
  } catch (err) {
    // fallback simples
    window.progressManager = progressManager;
    console.warn('Não foi possível congelar progressManager:', err);
  }
})();