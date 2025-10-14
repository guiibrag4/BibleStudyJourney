/**
 * auth-guard.js (VERSÃO FINAL E ROBUSTA)
 * Usa Capacitor/Preferences para persistência nativa e localStorage como fallback.
 */

// Pega o plugin do Capacitor, se disponível
const { Preferences } = window.Capacitor?.Plugins ?? {};

const AuthManager = {
    // Agora as funções são assíncronas (async) pois o armazenamento nativo é
    async saveToken(token) {
        if (Preferences) {
            await Preferences.set({
                key: 'token-jwt',
                value: token,
            });
            console.log("Token salvo no armazenamento nativo (Capacitor).");
        } else {
            localStorage.setItem("token-jwt", token);
            console.log("Token salvo no localStorage (fallback de navegador).");
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

    // A verificação de autenticação também precisa ser assíncrona
    async isAuthenticated() {
        const token = await this.getToken();
        return !!token;
    },

    async redirectToLogin() {
        console.warn("Usuário não autenticado. Redirecionando...");
        await this.clearAuthData();
        window.location.href = 'html/login2.html';
    }
};

// A função de proteção também se torna assíncrona
async function protectPage() {
    const publicPages = ['login2.html', 'cadastro2.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop();

    const isUserAuthenticated = await AuthManager.isAuthenticated();

    if (!publicPages.includes(currentPage) && !isUserAuthenticated) {
        AuthManager.redirectToLogin();
    }
}

// Executa a proteção
protectPage();