// Arquivo: www/js/gerenciador-de-progresso.js (VERSÃO CORRIGIDA COM DETECÇÃO DE AMBIENTE)
/**
 * Gerencia progresso de vídeos, alternando entre API (usuário logado) e localForage (anônimo).
 * API pública: saveProgress, getProgress, getAllProgress, removeProgress, clearAll
 */

(function () {
  'use strict';

  /* =========================
     CONFIGURAÇÃO / CONSTANTES
     ========================= */
  const PROGRESS_KEY_LOCAL = 'videoProgress';

  // CORRIGIDO: Detecção automática de ambiente baseada no hostname
  function getApiBaseUrl() {
    // O Capacitor injeta o objeto global 'Capacitor' quando o app está rodando nativamente.
    // A propriedade 'isNativePlatform' nos diz se estamos no iOS ou Android.
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();

    // 1. Se for o aplicativo nativo (Android/iOS), SEMPRE use a API de produção (HTTPS).
    if (isNativeApp) {
      console.log('[getApiBaseUrl] Detectado ambiente nativo (Capacitor). Forçando API de produção.');
      // Escolha aqui o seu servidor de produção principal.
      return 'https://biblestudyjourney.duckdns.org';
      // Ou: return 'https://biblestudyjourney-v2.onrender.com';
    }

    // 2. Se não for nativo, é um navegador web. Use a lógica anterior.
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    console.log(`[getApiBaseUrl] Detectado ambiente web: ${protocol}//${hostname}`);

    // Ambiente de desenvolvimento local no navegador
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    // Ambiente de produção no navegador (Render, DuckDNS, etc. )
    if (protocol === 'https:') {
      if (hostname.includes('onrender.com')) {
        return 'https://biblestudyjourney-v2.onrender.com';
      }
      if (hostname.includes('duckdns.org')) {
        return 'https://biblestudyjourney.duckdns.org';
      }
    }

    // Fallback final: usa a origem da página.
    // Isso garante que se você acessar https://meusite.com, a API será https://meusite.com/api/...
    return window.location.origin;
  }

  const API_BASE_URL = getApiBaseUrl();
  const API_ENDPOINT = `${API_BASE_URL}/api/user/progress`;

  const DEBUG = true;

  console.log('[progress-manager] API Base URL detectada:', API_BASE_URL);

  /* =========================
     UTILITÁRIOS INTERNOS
     ========================= */
  function debugLog(...args) {
    if (DEBUG) console.log('[progress-manager]', ...args);
  }

  // ALTERADO: Funções agora usam o AuthManager global e são assíncronas
  async function isUserLoggedIn() {
    console.log('Verificando login. AuthManager existe?', !!window.AuthManager);
    // Verifica se o AuthManager existe e chama a função assíncrona corretamente
    if (window.AuthManager && typeof window.AuthManager.isAuthenticated === 'function') {
      const loggedIn = await window.AuthManager.isAuthenticated();
      // NOVO LOG: Qual o resultado da verificação?
      console.log('Resultado de isAuthenticated:', loggedIn);
      return loggedIn;
    }
    console.log('AuthManager não encontrado ou não é uma função.'); // NOVO LOG
    return false;
  }

  async function getAuthToken() {
    if (window.AuthManager && typeof window.AuthManager.getToken === 'function') {
      return await window.AuthManager.getToken();
    }
    return null;
  }

  // Funções de normalização e verificação (sem alterações)
  function isLocalForageAvailable() {
    return typeof localforage !== 'undefined' && localforage !== null;
  }

  function safeTimestamp(value) {
    return typeof value === 'number' && !Number.isNaN(value) ? value : Date.now();
  }

  function normalizeVideoData(videoData) {
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
     OPERAÇÕES DE DADOS (ABSTRATAS)
     ========================= */

  // ALTERADO: Agora usa 'await' para verificar o login
  async function readStorage() {
    if (await isUserLoggedIn()) { // <-- MUDANÇA CRÍTICA
      debugLog('Lendo do STORAGE (API)');
      const token = await getAuthToken();
      if (!token) throw new Error('Usuário logado mas sem token.');

      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Falha ao buscar progresso da API: ${response.statusText}`);

      const data = await response.json();
      return data.progress || {};
    } else {
      debugLog('Lendo do STORAGE (Local)');
      if (!isLocalForageAvailable()) throw new Error('localForage não está disponível');
      return (await localforage.getItem(PROGRESS_KEY_LOCAL)) || {};
    }
  }

  // ALTERADO: Agora usa 'await' para verificar o login
  async function writeStorage(videoId, videoData) {
    if (await isUserLoggedIn()) { // <-- MUDANÇA CRÍTICA
      debugLog('Escrevendo no STORAGE (API)', videoId);
      const token = await getAuthToken();
      if (!token) throw new Error('Usuário logado mas sem token.');

      const response = await fetch(`${API_ENDPOINT}/${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoData)
      });

      if (!response.ok) throw new Error(`Falha ao salvar progresso na API: ${response.statusText}`);
      return await response.json();
    } else {
      debugLog('Escrevendo no STORAGE (Local)', videoId);
      if (!isLocalForageAvailable()) throw new Error('localForage não está disponível');

      const all = (await localforage.getItem(PROGRESS_KEY_LOCAL)) || {};
      all[videoId] = videoData;
      await localforage.setItem(PROGRESS_KEY_LOCAL, all);
    }
  }

  // ALTERADO: Agora usa 'await' para verificar o login
  async function deleteFromStorage(videoId) {
    if (await isUserLoggedIn()) { // <-- MUDANÇA CRÍTICA
      debugLog('Removendo do STORAGE (API)', videoId);
      const token = await getAuthToken();
      if (!token) throw new Error('Usuário logado mas sem token.');

      const response = await fetch(`${API_ENDPOINT}/${videoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Falha ao remover progresso da API: ${response.statusText}`);
    } else {
      debugLog('Removendo do STORAGE (Local)', videoId);
      if (!isLocalForageAvailable()) throw new Error('localForage não está disponível');

      const all = (await localforage.getItem(PROGRESS_KEY_LOCAL)) || {};
      if (all[videoId]) {
        delete all[videoId];
        await localforage.setItem(PROGRESS_KEY_LOCAL, all);
      }
    }
  }

  /* =========================
     API PÚBLICA (Sem alterações na sua estrutura, mas agora totalmente assíncrona)
     ========================= */
  const progressManager = {
    async saveProgress(videoData = {}) {
      try {
        const normalized = normalizeVideoData(videoData);
        if (!normalized.id) {
          console.warn('saveProgress: id do vídeo ausente, progresso ignorado.');
          return false;
        }

        const currentProgress = await this.getProgress(normalized.id) || {};
        const dataToSave = {
          ...currentProgress,
          ...normalized,
          lastWatched: Date.now()
        };

        await writeStorage(normalized.id, dataToSave);
        return true;
      } catch (err) {
        console.error('Erro ao salvar o progresso:', err);
        return false;
      }
    },

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

    async removeProgress(videoId) {
      try {
        if (!videoId) return false;
        await deleteFromStorage(videoId);
        debugLog('Progresso removido', videoId);
        return true;
      } catch (err) {
        console.error('Erro ao remover progresso:', err);
        return false;
      }
    },

    async clearAll() {
      try {
        if (await isUserLoggedIn()) { // <-- MUDANÇA CRÍTICA
          console.warn("clearAll não é suportado para usuários logados por segurança.");
          return false;
        }
        if (!isLocalForageAvailable()) return false;
        await localforage.removeItem(PROGRESS_KEY_LOCAL);
        debugLog('Progresso local limpo');
        return true;
      } catch (err) {
        console.error('Erro ao limpar progresso:', err);
        return false;
      }
    },
  };

  /* =========================
      EXPORTAÇÃO GLOBAL (ALTERADA)
      ========================= */
  // NOVO: Espera o DOM carregar antes de expor o progressManager globalmente.
  document.addEventListener("DOMContentLoaded", function () {
    try {
      // Agora, quando o video-player.js (que também espera o DOM) for executado,
      // o window.progressManager garantidamente existirá.
      window.progressManager = Object.freeze(progressManager);
      debugLog('progressManager inicializado e exposto após DOMContentLoaded.');
    } catch (err) {
      window.progressManager = progressManager;
      console.warn('Não foi possível congelar progressManager:', err);
    }
  });

})(); // Fim da IIFE

