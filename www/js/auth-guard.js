/**
 * auth-guard.js
 */

// Pega o plugin do Capacitor, se disponível
const { Preferences } = window.Capacitor?.Plugins ?? {};

// ALTERAÇÃO CRÍTICA: Atribui diretamente a 'window.AuthManager'
// Isso garante que ele seja um objeto global que outros scripts podem ver.
window.AuthManager = {
    async saveToken(token) {
        if (Preferences) {
            await Preferences.set({ key: 'token-jwt', value: token });
        } else {
            localStorage.setItem("token-jwt", token);
        }
    },

    async getToken() {
        if (Preferences) {
            const { value } = await Preferences.get({ key: 'token-jwt' });
            return value;
        } else {
            return localStorage.getItem("token-jwt");
        }
    },

    async clearAuthData() {
        if (Preferences) {
            await Preferences.remove({ key: 'token-jwt' });
        } else {
            localStorage.removeItem("token-jwt");
        }
    },

    async isAuthenticated() {
        const token = await this.getToken();
        return !!token;
    },

    async redirectToLogin() {
        await this.clearAuthData();
        // sempre volta para a raiz corretamente
        window.location.replace('/index.html');
    }
};

// Páginas que funcionam sem login
const PUBLIC_PAGES = ['login2.html', 'cadastro2.html', 'index.html', 'paginainicial.html', 'biblia.html', 'privacidade.html'];

/**
 * Sessão vencida ou inválida (token expirado, ou JWT_SECRET trocado no servidor):
 * se a API responder 401 a uma requisição que levou token, apaga o token.
 * Nas páginas públicas a pessoa segue como visitante; nas outras, vai para o login.
 */
(function watchExpiredSession() {
    const originalFetch = window.fetch.bind(window);
    let handled = false;

    window.fetch = async function (input, init) {
        const response = await originalFetch(input, init);
        if (response.status !== 401 || handled) return response;

        const url = typeof input === 'string' ? input : input?.url || '';
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        const token = (headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        // /auth/ trata os próprios erros (ex.: exclusão de conta)
        if (!token || token === 'null' || token === 'undefined' || url.includes('/auth/')) return response;

        handled = true;
        await window.AuthManager.clearAuthData();
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (!PUBLIC_PAGES.includes(currentPage)) {
            window.location.replace('/html/login2.html?sessao=expirada');
        }
        return response;
    };
})();

// A lógica do DOMContentLoaded pode permanecer, pois ainda é uma boa prática.
document.addEventListener("DOMContentLoaded", function() {
    async function protectPage() {
        const publicPages = PUBLIC_PAGES;
        const currentPage = window.location.pathname.split('/').pop();

        // Agora ele usa o window.AuthManager que acabamos de definir.
        const isUserAuthenticated = await window.AuthManager.isAuthenticated();

        if (!publicPages.includes(currentPage) && !isUserAuthenticated) {
            window.AuthManager.redirectToLogin();
        }
    }

    protectPage();
    console.log("auth-guard.js executado após DOMContentLoaded.");
});
