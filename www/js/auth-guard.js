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

    async isAuthenticated() {
        const token = await this.getToken();
        console.log('AuthManager.isAuthenticated chamado. Token encontrado:', token ? 'Sim' : 'Não');
        return !!token;
    },

    async redirectToLogin() {
        console.warn("Usuário não autenticado. Redirecionando...");
        await this.clearAuthData();
        window.location.href = 'html/login2.html';
    }
};

// A lógica do DOMContentLoaded pode permanecer, pois ainda é uma boa prática.
document.addEventListener("DOMContentLoaded", function() {
    async function protectPage() {
        const publicPages = ['login2.html', 'cadastro2.html', 'index.html'];
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
