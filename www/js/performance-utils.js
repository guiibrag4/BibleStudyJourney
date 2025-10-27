/**
 * ⚡ Performance Utils - Utilitários de Otimização
 * 
 * Funções auxiliares para melhorar a performance da aplicação:
 * - Debounce: Atrasa execução de função até parar de ser chamada
 * - Throttle: Limita frequência de execução de função
 * - RequestAnimationFrame wrapper: Otimiza animações
 */

// ===== DEBOUNCE =====
/**
 * Debounce: Executa a função apenas após N milissegundos de inatividade.
 * Útil para: inputs de busca, resize, eventos de digitação.
 * 
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms (padrão: 300ms)
 * @returns {Function} - Função debounced
 * 
 * @example
 * const searchAPI = debounce((query) => {
 *   fetch(`/api/search?q=${query}`);
 * }, 300);
 * 
 * input.addEventListener('input', (e) => searchAPI(e.target.value));
 */
function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const context = this;
        
        // Cancela o timeout anterior
        clearTimeout(timeout);
        
        // Cria novo timeout
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// ===== THROTTLE =====
/**
 * Throttle: Executa a função no máximo 1 vez a cada N milissegundos.
 * Útil para: scroll, mousemove, resize.
 * 
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Intervalo mínimo em ms (padrão: 100ms)
 * @returns {Function} - Função throttled
 * 
 * @example
 * const handleScroll = throttle(() => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100);
 * 
 * window.addEventListener('scroll', handleScroll);
 */
function throttle(func, limit = 100) {
    let inThrottle;
    let lastResult;
    
    return function executedFunction(...args) {
        const context = this;
        
        if (!inThrottle) {
            lastResult = func.apply(context, args);
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
        
        return lastResult;
    };
}

// ===== REQUEST ANIMATION FRAME THROTTLE =====
/**
 * Throttle usando requestAnimationFrame (60fps).
 * Mais eficiente para animações e scroll handlers.
 * 
 * @param {Function} func - Função a ser executada
 * @returns {Function} - Função throttled com rAF
 * 
 * @example
 * const animateOnScroll = rafThrottle(() => {
 *   element.style.transform = `translateY(${window.scrollY}px)`;
 * });
 * 
 * window.addEventListener('scroll', animateOnScroll);
 */
function rafThrottle(func) {
    let rafId = null;
    
    return function executedFunction(...args) {
        const context = this;
        
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                func.apply(context, args);
                rafId = null;
            });
        }
    };
}

// ===== LEADING + TRAILING THROTTLE =====
/**
 * Throttle avançado com controle de leading e trailing.
 * 
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Intervalo em ms
 * @param {Object} options - { leading: boolean, trailing: boolean }
 * @returns {Function} - Função throttled
 */
function advancedThrottle(func, wait = 100, options = {}) {
    let timeout;
    let previous = 0;
    
    const { leading = true, trailing = true } = options;
    
    return function executedFunction(...args) {
        const context = this;
        const now = Date.now();
        
        if (!previous && !leading) previous = now;
        
        const remaining = wait - (now - previous);
        
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            
            previous = now;
            func.apply(context, args);
        } else if (!timeout && trailing) {
            timeout = setTimeout(() => {
                previous = leading ? Date.now() : 0;
                timeout = null;
                func.apply(context, args);
            }, remaining);
        }
    };
}

// ===== BATCH DOM UPDATES =====
/**
 * Agrupa múltiplas atualizações do DOM em uma única operação.
 * Usa DocumentFragment para minimizar reflows.
 * 
 * @param {HTMLElement} container - Elemento pai onde inserir
 * @param {Array<HTMLElement>} elements - Array de elementos a inserir
 * 
 * @example
 * const items = verses.map(verse => {
 *   const p = document.createElement('p');
 *   p.textContent = verse.text;
 *   return p;
 * });
 * 
 * batchDOMUpdate(bibleContentEl, items);
 */
function batchDOMUpdate(container, elements) {
    const fragment = document.createDocumentFragment();
    
    elements.forEach(element => {
        fragment.appendChild(element);
    });
    
    // Uma única operação de DOM
    container.appendChild(fragment);
}

// ===== MEMOIZATION =====
/**
 * Cache de resultados de função para evitar recálculos.
 * Útil para funções puras e custosas.
 * 
 * @param {Function} func - Função a ser memoizada
 * @returns {Function} - Função memoizada
 * 
 * @example
 * const expensiveCalculation = memoize((n) => {
 *   return n * n * n;
 * });
 */
function memoize(func) {
    const cache = new Map();
    
    return function memoized(...args) {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = func.apply(this, args);
        cache.set(key, result);
        
        return result;
    };
}

// ===== IDLE CALLBACK =====
/**
 * Executa função quando o navegador estiver ocioso.
 * Útil para tarefas não urgentes.
 * 
 * @param {Function} func - Função a executar
 * @param {Object} options - { timeout: number }
 */
function runWhenIdle(func, options = {}) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(func, options);
    } else {
        // Fallback para navegadores sem suporte
        setTimeout(func, 1);
    }
}

// ===== PERFORMANCE MONITOR =====
/**
 * Mede o tempo de execução de uma função.
 * 
 * @param {Function} func - Função a medir
 * @param {string} label - Label para o log
 * @returns {Function} - Função instrumentada
 */
function measurePerformance(func, label = 'Function') {
    return function measured(...args) {
        const start = performance.now();
        const result = func.apply(this, args);
        const duration = performance.now() - start;
        
        console.log(`⏱️ [Performance] ${label} took ${duration.toFixed(2)}ms`);
        
        return result;
    };
}

// ===== LAZY LOAD IMAGES =====
/**
 * Observa elementos para lazy loading de imagens.
 * 
 * @param {string} selector - Seletor CSS dos elementos
 * @param {Object} options - Opções do IntersectionObserver
 */
function lazyLoadImages(selector = 'img[data-src]', options = {}) {
    const defaultOptions = {
        root: null,
        rootMargin: '50px', // Carrega 50px antes de aparecer
        threshold: 0.01
    };
    
    const config = { ...defaultOptions, ...options };
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, config);
    
    // Observa todas as imagens
    document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
    });
    
    return imageObserver;
}

// ===== EXPORTAÇÃO =====
// Se usar módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        rafThrottle,
        advancedThrottle,
        batchDOMUpdate,
        memoize,
        runWhenIdle,
        measurePerformance,
        lazyLoadImages
    };
}

// Disponibiliza globalmente para uso em scripts não-modulares
if (typeof window !== 'undefined') {
    window.PerformanceUtils = {
        debounce,
        throttle,
        rafThrottle,
        advancedThrottle,
        batchDOMUpdate,
        memoize,
        runWhenIdle,
        measurePerformance,
        lazyLoadImages
    };
}
