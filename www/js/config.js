/**
 * ============================================================================
 * CONFIGURAÇÃO CENTRALIZADA DE API - BibleStudyJourney
 * ============================================================================
 * 
 * Este arquivo centraliza TODA a configuração de URLs de API do projeto.
 * 
 * BENEFÍCIOS:
 * - ✅ Função getApiBaseUrl() em 1 único lugar (antes estava em 7+ arquivos)
 * - ✅ Troca de ambiente (localhost/DuckDNS) em 1 linha
 * - ✅ Suporte automático para Capacitor (Android/iOS)
 * - ✅ Configuração consistente em todo o projeto
 * 
 * USO EM OUTROS ARQUIVOS:
 * ```javascript
 * // Basta usar o objeto CONFIG global:
 * fetch(`${CONFIG.API_URL}/endpoint`, { ... });
 * fetch(`${CONFIG.BIBLE_API_URL}/verses`, { ... });
 * ```
 * 
 * TROCA DE AMBIENTE:
 * Para mudar entre ambientes, edite apenas a constante FORCE_ENVIRONMENT:
 * - 'auto': Detecta automaticamente (recomendado)
 * - 'production': Força DuckDNS (produção)
 * - 'development': Força localhost
 * 
 * ============================================================================
 */

(function() {
  'use strict';

  // ========================================================================
  // CONFIGURAÇÃO DE AMBIENTE
  // ========================================================================
  
  /**
   * Define o ambiente de execução.
   * 
   * OPÇÕES:
   * - 'auto': Detecta automaticamente baseado no hostname/Capacitor (RECOMENDADO)
   * - 'production': Força uso do DuckDNS (https://biblestudyjourney.duckdns.org)
   * - 'development': Força uso do localhost (http://localhost:3000)
   */
  const FORCE_ENVIRONMENT = 'auto';

  // ========================================================================
  // URLS DOS SERVIDORES
  // ========================================================================
  
  const SERVERS = {
    production: 'https://biblestudyjourney.duckdns.org',
    development: 'http://localhost:3000'
  };

  // ========================================================================
  // FUNÇÃO DE DETECÇÃO AUTOMÁTICA DE AMBIENTE
  // ========================================================================
  
  /**
   * Detecta automaticamente o ambiente de execução.
   * 
   * LÓGICA:
   * 1. Se for app nativo (Capacitor), sempre usa produção (DuckDNS)
   * 2. Se for navegador web:
   *    - localhost/127.0.0.1 → development
   *    - duckdns.org → production
   *    - Fallback: usa window.location.origin
   * 
   * @returns {string} URL base da API
   */
  function getApiBaseUrl() {
    // AMBIENTE FORÇADO (para testes ou deploy)
    if (FORCE_ENVIRONMENT !== 'auto') {
      const forcedUrl = SERVERS[FORCE_ENVIRONMENT];
      console.log(`[CONFIG] 🔧 Ambiente forçado: ${FORCE_ENVIRONMENT} (${forcedUrl})`);
      return forcedUrl;
    }

    // DETECÇÃO AUTOMÁTICA
    
    // 1. CAPACITOR (App Nativo - Android/iOS)
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNativeApp) {
      console.log('[CONFIG] 📱 Detectado ambiente NATIVO (Capacitor) → Usando PRODUÇÃO (DuckDNS)');
      return SERVERS.production;
    }

    // 2. NAVEGADOR WEB
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    console.log(`[CONFIG] 🌐 Detectado navegador web: ${protocol}//${hostname}`);

    // 2.1 Desenvolvimento Local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('[CONFIG] 🛠️ Ambiente: DEVELOPMENT (localhost)');
      return SERVERS.development;
    }

    // 2.2 Produção (DuckDNS)
    if (hostname.includes('duckdns.org')) {
      console.log('[CONFIG] 🚀 Ambiente: PRODUCTION (DuckDNS)');
      return SERVERS.production;
    }

    // 2.3 Fallback - usa origem da página
    console.warn('[CONFIG] ⚠️ Hostname não reconhecido, usando window.location.origin:', window.location.origin);
    return window.location.origin;
  }

  // ========================================================================
  // OBJETO DE CONFIGURAÇÃO GLOBAL
  // ========================================================================
  
  const apiBaseUrl = getApiBaseUrl();

  /**
   * Objeto CONFIG global disponível em todo o projeto.
   * 
   * USO:
   * ```javascript
   * fetch(`${CONFIG.API_URL}/endpoint`);
   * fetch(`${CONFIG.BIBLE_API_URL}/verses/nvi/gn/1`);
   * fetch(`${CONFIG.AUTH_URL}/login`);
   * ```
   */
  window.CONFIG = {
    // URL base do servidor
    BASE_URL: apiBaseUrl,
    
    // URLs específicas de endpoints
    API_URL: `${apiBaseUrl}/api`,
    BIBLE_API_URL: `${apiBaseUrl}/api/bible`,
    AUTH_URL: `${apiBaseUrl}/auth`,
    USER_API_URL: `${apiBaseUrl}/api/user`,
    
    // Endpoints de progresso
    PROGRESS_API_URL: `${apiBaseUrl}/api/user/progress`,
    HIGHLIGHTS_API_URL: `${apiBaseUrl}/api/user/highlights`,
    CHAPTERS_API_URL: `${apiBaseUrl}/api/user/chapters`,
    NOTES_API_URL: `${apiBaseUrl}/api/user/notes`,
    STATS_API_URL: `${apiBaseUrl}/api/user/stats`,
    
    // Endpoints de devocional
    DEVOTIONAL_API_URL: `${apiBaseUrl}/api/bible/devotional`,
    
    // Informações de ambiente
    ENVIRONMENT: FORCE_ENVIRONMENT === 'auto' ? 'auto-detected' : FORCE_ENVIRONMENT,
    IS_NATIVE: window.Capacitor && window.Capacitor.isNativePlatform(),
    IS_DEVELOPMENT: apiBaseUrl === SERVERS.development,
    IS_PRODUCTION: apiBaseUrl === SERVERS.production,
    
    // Versão do app
    VERSION: '1.0.0',
    
    // Função auxiliar para debug
    debug() {
      console.log('=============== CONFIG DEBUG ===============');
      console.log('BASE_URL:', this.BASE_URL);
      console.log('ENVIRONMENT:', this.ENVIRONMENT);
      console.log('IS_NATIVE:', this.IS_NATIVE);
      console.log('IS_DEVELOPMENT:', this.IS_DEVELOPMENT);
      console.log('IS_PRODUCTION:', this.IS_PRODUCTION);
      console.log('============================================');
    }
  };

  // Log de inicialização
  console.log(`✅ [CONFIG] Configuração inicializada com sucesso!`);
  console.log(`📍 [CONFIG] BASE_URL: ${CONFIG.BASE_URL}`);
  console.log(`🔗 [CONFIG] BIBLE_API_URL: ${CONFIG.BIBLE_API_URL}`);
  
  // Disponibiliza também a função getApiBaseUrl para compatibilidade
  // (caso algum código antigo ainda tente chamar diretamente)
  window.getApiBaseUrl = getApiBaseUrl;

})();
