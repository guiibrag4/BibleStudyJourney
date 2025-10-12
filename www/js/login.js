/**
 * Módulo de autenticação e login
 * Gerencia login tradicional e login com Google
 */

// =============================================================================
// CONFIGURAÇÕES E CONSTANTES
// =============================================================================
const API_CONFIG = {
    development: "http://localhost:3000", // URL do backend local
    production: "https://biblestudyjourney.duckdns.org"  // URL do servidor de produção
};

const CONFIG = {
    REDIRECT_PAGE: "biblia.html",
    SIGNUP_PAGE: "html/cadastro.html"
};

// =============================================================================
// DETECÇÃO DE AMBIENTE
// =============================================================================
const Environment = {
    /**
     * Verifica se está rodando no Capacitor
     */
    isCapacitor: window.Capacitor !== undefined,

    /**
     * Define a URL da API baseada no ambiente
     */
    getApiUrl() {
        // Força o uso do servidor de produção
        return API_CONFIG.production;
        // return this.isCapacitor ? API_CONFIG.production : API_CONFIG.development;
    }
};

// URL da API utilizada
const API_URL = Environment.getApiUrl();

// =============================================================================
// GERENCIADOR DE AUTENTICAÇÃO
// =============================================================================
const AuthManager = {
    /**
     * Realiza o login tradicional com email e senha
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     */
    async login(email, password) {
        console.log("Tentando fazer login com:", { email, API_URL });

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, senha: password })
            });

            console.log("Resposta recebida:", response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Dados recebidos:", data);

            return { success: true, data };

        } catch (error) {
            console.error("Erro detalhado ao fazer login:", error);
            return { success: false, error: this.formatError(error) };
        }
    },

    /**
     * Realiza login com Google
     */
    async loginWithGoogle() {
        console.log("Google login clicked");
        
        // TODO: Implementar lógica de login com Google
        if (Environment.isCapacitor && window.Capacitor.Plugins?.GoogleAuth) {
            try {
                const { GoogleAuth } = window.Capacitor.Plugins;
                const result = await GoogleAuth.signIn();
                return { success: true, data: result };
            } catch (error) {
                return { success: false, error: "Erro no login com Google" };
            }
        } else {
            return { success: false, error: "Login com Google não disponível neste ambiente." };
        }
    },

    /**
     * Salva o token de autenticação
     * @param {string} token - Token JWT
     */
    saveToken(token) {
        localStorage.setItem("token", token);
    },

    /**
     * Formata mensagens de erro para o usuário
     * @param {Error} error - Erro capturado
     * @returns {string} - Mensagem formatada
     */
    formatError(error) {
        if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
            return "Erro de conexão: Verifique sua internet ou tente novamente.";
        } else if (error.message.includes("HTTP")) {
            return `Erro do servidor: ${error.message}`;
        }
        return "Erro ao conectar ao servidor.";
    }
};

// =============================================================================
// GERENCIADOR DE UI
// =============================================================================
const UIManager = {
    elements: {},

    /**
     * Inicializa e faz cache dos elementos DOM
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
    },

    /**
     * Faz cache dos elementos DOM necessários
     */
    cacheElements() {
        this.elements = {
            loginForm: document.getElementById("login-form"),
            googleLoginBtn: document.getElementById("google-login"),
            signupLink: document.getElementById("signup-link"),
            emailInput: document.getElementById("email"),
            passwordInput: document.getElementById("password")
        };
    },

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener("submit", this.handleLoginSubmit.bind(this));
        }

        if (this.elements.googleLoginBtn) {
            this.elements.googleLoginBtn.addEventListener("click", this.handleGoogleLogin.bind(this));
        }

        if (this.elements.signupLink) {
            this.elements.signupLink.addEventListener("click", this.handleSignupRedirect.bind(this));
        }
    },

    /**
     * Manipula o envio do formulário de login
     * @param {Event} event - Evento de submit
     */
    async handleLoginSubmit(event) {
        event.preventDefault();

        const email = this.elements.emailInput.value;
        const password = this.elements.passwordInput.value;

        if (!this.validateInputs(email, password)) {
            return;
        }

        const result = await AuthManager.login(email, password);

        if (result.success) {
            this.showSuccess("Login bem-sucedido!");
            AuthManager.saveToken(result.data.token);
            this.redirectTo(CONFIG.REDIRECT_PAGE);
        } else {
            this.showError(result.error);
        }
    },

    /**
     * Manipula o login com Google
     */
    async handleGoogleLogin() {
        const result = await AuthManager.loginWithGoogle();

        if (result.success) {
            this.showSuccess("Login com Google realizado!");
            // Processar dados do Google login
        } else {
            this.showError(result.error);
        }
    },

    /**
     * Manipula redirecionamento para cadastro
     */
    handleSignupRedirect() {
        this.redirectTo(CONFIG.SIGNUP_PAGE);
    },

    /**
     * Valida os campos de entrada
     * @param {string} email - Email digitado
     * @param {string} password - Senha digitada
     * @returns {boolean} - Se os campos são válidos
     */
    validateInputs(email, password) {
        if (!email || !password) {
            this.showError("Por favor, preencha todos os campos.");
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError("Por favor, digite um email válido.");
            return false;
        }

        return true;
    },

    /**
     * Valida formato do email
     * @param {string} email - Email a ser validado
     * @returns {boolean} - Se o email é válido
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Exibe mensagem de sucesso
     * @param {string} message - Mensagem de sucesso
     */
    showSuccess(message) {
        alert(message); // TODO: Substituir por toast/modal mais elegante
    },

    /**
     * Exibe mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    showError(message) {
        alert(message); // TODO: Substituir por toast/modal mais elegante
    },

    /**
     * Redireciona para uma página
     * @param {string} page - Página de destino
     */
    redirectTo(page) {
        window.location.href = page;
    }
};

// =============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================================================
const App = {
    /**
     * Inicializa a aplicação
     */
    init() {
        console.log(`API URL utilizada: ${API_URL}`);
        console.log(`Ambiente: ${Environment.isCapacitor ? 'Capacitor' : 'Navegador'}`);
        
        UIManager.init();
    }
};

// =============================================================================
// BOOTSTRAP DA APLICAÇÃO
// =============================================================================
document.addEventListener("DOMContentLoaded", function() {
    if (Environment.isCapacitor) {
        console.log("Capacitor detectado. Inicializando app.");
    } else {
        console.log("Navegador detectado. Inicializando app.");
    }
    
    App.init();
});