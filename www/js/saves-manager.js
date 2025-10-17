// Arquivo: www/js/saves-manager.js
/**
 * Gerenciador Unificado de Saves (Grifos, Capítulos e Notas)
 * Alterna entre API (usuário logado) e localStorage (anônimo)
 * Padrão similar ao gerenciador-de-progresso.js
 */

(function () {
  'use strict';

  /* =========================
     CONFIGURAÇÃO / CONSTANTES
     ========================= */
  const STORAGE_KEY = 'bibleStudySaves';

  // Detecção automática de ambiente
  function getApiBaseUrl() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    if (hostname.includes('onrender.com')) {
      return 'https://biblestudyjourney-v2.onrender.com';
    }
    
    if (hostname.includes('duckdns.org')) {
      return 'https://biblestudyjourney.duckdns.org';
    }
    
    return window.location.origin;
  }

  const API_BASE_URL = getApiBaseUrl();
  const API_ENDPOINTS = {
    highlights: `${API_BASE_URL}/api/user/highlights`,
    chapters: `${API_BASE_URL}/api/user/chapters`,
    notes: `${API_BASE_URL}/api/user/notes`
  };

  const DEBUG = true;

  console.log('[saves-manager] API Base URL detectada:', API_BASE_URL);

  /* =========================
     UTILITÁRIOS INTERNOS
     ========================= */
  function debugLog(...args) {
    if (DEBUG) console.log('[saves-manager]', ...args);
  }

  async function isUserLoggedIn() {
    if (window.AuthManager && typeof window.AuthManager.isAuthenticated === 'function') {
      return await window.AuthManager.isAuthenticated();
    }
    return false;
  }

  async function getAuthToken() {
    if (window.AuthManager && typeof window.AuthManager.getToken === 'function') {
      return await window.AuthManager.getToken();
    }
    return null;
  }

  /* =========================
     OPERAÇÕES DE STORAGE
     ========================= */

  // Ler do localStorage
  function readLocalStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { versiculos: [], capitulos: [], notas: [] };
    } catch (error) {
      console.error('Erro ao ler localStorage:', error);
      return { versiculos: [], capitulos: [], notas: [] };
    }
  }

  // Salvar no localStorage
  function writeLocalStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  }

  /* =========================
     GERENCIADOR DE GRIFOS
     ========================= */
  const highlightsManager = {
    async getAll() {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Buscando grifos da API');
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(API_ENDPOINTS.highlights, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          
          const data = await response.json();
          // Converter objeto para array
          return Object.values(data.highlights || {});
        } else {
          debugLog('Buscando grifos do localStorage');
          const data = readLocalStorage();
          return data.versiculos || [];
        }
      } catch (error) {
        console.error('Erro ao buscar grifos:', error);
        return [];
      }
    },

    async save(highlight) {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Salvando grifo na API', highlight.reference);
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(API_ENDPOINTS.highlights, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(highlight)
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          return await response.json();
        } else {
          debugLog('Salvando grifo no localStorage', highlight.reference);
          const data = readLocalStorage();
          if (!data.versiculos) data.versiculos = [];
          
          // Remover grifo existente com mesma referência
          data.versiculos = data.versiculos.filter(v => v.reference !== highlight.reference);
          
          // Adicionar novo grifo
          data.versiculos.push({
            id: highlight.id || `v${Date.now()}`,
            reference: highlight.reference,
            version: highlight.version,
            text: highlight.text,
            color: highlight.color,
            date: highlight.date || new Date().toLocaleDateString('pt-BR')
          });
          
          return writeLocalStorage(data);
        }
      } catch (error) {
        console.error('Erro ao salvar grifo:', error);
        return false;
      }
    },

    async remove(reference) {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Removendo grifo da API', reference);
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(`${API_ENDPOINTS.highlights}/${reference}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          return true;
        } else {
          debugLog('Removendo grifo do localStorage', reference);
          const data = readLocalStorage();
          if (data.versiculos) {
            data.versiculos = data.versiculos.filter(v => v.reference !== reference);
            return writeLocalStorage(data);
          }
          return false;
        }
      } catch (error) {
        console.error('Erro ao remover grifo:', error);
        return false;
      }
    }
  };

  /* =========================
     GERENCIADOR DE CAPÍTULOS
     ========================= */
  const chaptersManager = {
    async getAll() {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Buscando capítulos da API');
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(API_ENDPOINTS.chapters, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          
          const data = await response.json();
          return Object.values(data.chapters || {});
        } else {
          debugLog('Buscando capítulos do localStorage');
          const data = readLocalStorage();
          return data.capitulos || [];
        }
      } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        return [];
      }
    },

    async save(chapter) {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Salvando capítulo na API', chapter.title);
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(API_ENDPOINTS.chapters, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(chapter)
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          return await response.json();
        } else {
          debugLog('Salvando capítulo no localStorage', chapter.title);
          const data = readLocalStorage();
          if (!data.capitulos) data.capitulos = [];
          
          // Verificar se já existe
          const exists = data.capitulos.find(c => c.title === chapter.title);
          if (exists) {
            return { success: false, message: 'Capítulo já salvo' };
          }
          
          data.capitulos.push({
            id: chapter.id || `c${Date.now()}`,
            title: chapter.title,
            subtitle: chapter.subtitle,
            verseCount: chapter.verseCount || 0,
            date: chapter.date || new Date().toLocaleDateString('pt-BR'),
            livro: chapter.livro,
            capitulo: chapter.capitulo,
            versao: chapter.versao
          });
          
          return writeLocalStorage(data) ? { success: true } : { success: false };
        }
      } catch (error) {
        console.error('Erro ao salvar capítulo:', error);
        return { success: false, error: error.message };
      }
    },

    async remove(id) {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Removendo capítulo da API', id);
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(`${API_ENDPOINTS.chapters}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          return true;
        } else {
          debugLog('Removendo capítulo do localStorage', id);
          const data = readLocalStorage();
          if (data.capitulos) {
            data.capitulos = data.capitulos.filter(c => c.id !== id);
            return writeLocalStorage(data);
          }
          return false;
        }
      } catch (error) {
        console.error('Erro ao remover capítulo:', error);
        return false;
      }
    }
  };

  /* =========================
     GERENCIADOR DE NOTAS
     ========================= */
  const notesManager = {
    async getAll() {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Buscando notas da API');
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(API_ENDPOINTS.notes, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          
          const data = await response.json();
          return Object.values(data.notes || {});
        } else {
          debugLog('Buscando notas do localStorage');
          const data = readLocalStorage();
          return data.notas || [];
        }
      } catch (error) {
        console.error('Erro ao buscar notas:', error);
        return [];
      }
    },

    async save(note) {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Salvando nota na API', note.reference);
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(API_ENDPOINTS.notes, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(note)
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          return await response.json();
        } else {
          debugLog('Salvando nota no localStorage', note.reference);
          const data = readLocalStorage();
          if (!data.notas) data.notas = [];
          
          // Remover nota existente com mesma referência
          data.notas = data.notas.filter(n => n.reference !== note.reference);
          
          // Adicionar nova nota (se não estiver vazia)
          if (note.text && note.text.trim()) {
            data.notas.push({
              id: note.id || `n${Date.now()}`,
              reference: note.reference,
              version: note.version,
              text: note.text,
              date: note.date || new Date().toLocaleDateString('pt-BR')
            });
          }
          
          return writeLocalStorage(data);
        }
      } catch (error) {
        console.error('Erro ao salvar nota:', error);
        return false;
      }
    },

    async remove(reference) {
      try {
        if (await isUserLoggedIn()) {
          debugLog('Removendo nota da API', reference);
          const token = await getAuthToken();
          if (!token) throw new Error('Token não encontrado');

          const response = await fetch(`${API_ENDPOINTS.notes}/${reference}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
          return true;
        } else {
          debugLog('Removendo nota do localStorage', reference);
          const data = readLocalStorage();
          if (data.notas) {
            data.notas = data.notas.filter(n => n.reference !== reference);
            return writeLocalStorage(data);
          }
          return false;
        }
      } catch (error) {
        console.error('Erro ao remover nota:', error);
        return false;
      }
    },

    async getByReference(reference) {
      try {
        const allNotes = await this.getAll();
        return allNotes.find(n => n.reference === reference);
      } catch (error) {
        console.error('Erro ao buscar nota por referência:', error);
        return null;
      }
    }
  };

  /* =========================
     EXPORTAÇÃO GLOBAL
     ========================= */
  document.addEventListener("DOMContentLoaded", function () {
    try {
      window.savesManager = Object.freeze({
        highlights: highlightsManager,
        chapters: chaptersManager,
        notes: notesManager
      });
      debugLog('savesManager inicializado e exposto após DOMContentLoaded.');
    } catch (err) {
      window.savesManager = {
        highlights: highlightsManager,
        chapters: chaptersManager,
        notes: notesManager
      };
      console.warn('Não foi possível congelar savesManager:', err);
    }
  });

})(); // Fim da IIFE

