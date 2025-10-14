/**
 * auth-guard.js
 * Guardião de autenticação do lado do cliente.
 * Gerencia o token e protege o acesso às páginas.
 * Deve ser incluído em TODAS as páginas que exigem login.
 */

// =============================================================================
// GERENCIADOR DE AUTENTICAÇÃO
// =============================================================================
const AuthManager = {
    saveToken(token) {
        localStorage.setItem("token-jwt", token);
    },

    getToken() {
        return localStorage.getItem("token-jwt");
    },

    clearAuthData() {
        localStorage.removeItem("token-jwt");
    },

    isAuthenticated() {
        // Por enquanto, a verificação mais simples é se o token existe.
        // Uma verificação de expiração seria um ótimo próximo passo.
        const token = this.getToken();
        return !!token; // Retorna true se o token existir, false caso contrário.
    },

    redirectToLogin() {
        console.warn("Usuário não autenticado. Redirecionando para /login2.html...");
        this.clearAuthData();
        // Altere para a sua página de login correta se for diferente
        window.location.href = 'login2.html';
    }
};

// =============================================================================
// LÓGICA DO GUARDIÃO
// =============================================================================
function protectPage() {
    // Lista de páginas que NÃO precisam de autenticação
    const publicPages = ['login2.html', 'cadastro2.html', 'index.html'];
    
    // Pega o nome do arquivo da URL atual
    const currentPage = window.location.pathname.split('/').pop();

    // Se a página atual NÃO está na lista de páginas públicas E o usuário não está autenticado...
    if (!publicPages.includes(currentPage) && !AuthManager.isAuthenticated()) {
        AuthManager.redirectToLogin();
    }
}

// Executa a proteção imediatamente
protectPage();