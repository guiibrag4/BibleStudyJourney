/**
 * Módulo da página de login (CORRIGIDO)
 * Captura o token JWT do backend e o salva usando o AuthManager.
 * Depende de 'auth-guard.js' para as funções do AuthManager.
 */

document.addEventListener("DOMContentLoaded", function () {
    // Verifica se o auth-guard.js foi carregado primeiro
    if (typeof AuthManager === 'undefined') {
        console.error("ERRO CRÍTICO: auth-guard.js deve ser incluído ANTES de login.js no seu HTML.");
        alert("Erro crítico na inicialização. Verifique o console.");
        return;
    }

    // Configurações e constantes
    const API_CONFIG = {
        development: "http://localhost:3000",
        production: "https://biblestudyjourney.duckdns.org"
    };
    const CONFIG = {
        REDIRECT_PAGE: "biblia.html",
        SIGNUP_PAGE: "cadastro2.html"
    };
    // const API_URL = API_CONFIG.production;
    const API_URL = API_CONFIG.development;
    
    const DEBUG = false; // Ative para logs detalhados (não em produção)

    const UIManager = {
        elements: {},
        init() {
            this.cacheElements();
            this.setupEventListeners();
        },
        cacheElements() {
            this.elements = {
                loginForm: document.getElementById("login-form"),
                emailInput: document.getElementById("email"),
                passwordInput: document.getElementById("password"),
                signupLink: document.getElementById("signup-link"),
                googleLoginBtn: document.getElementById("google-login")
            };
        },
        setupEventListeners() {
            this.elements.loginForm?.addEventListener("submit", this.handleLoginSubmit.bind(this));
            this.elements.signupLink?.addEventListener("click", () => this.redirectTo(CONFIG.SIGNUP_PAGE));
        },

                async handleLoginSubmit(event) {
            event.preventDefault();
            if (DEBUG) console.log("Formulário de login enviado.");

            const email = this.elements.emailInput.value;
            const password = this.elements.passwordInput.value;

            if (!this.validateInputs(email, password)) return;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify({ email, senha: password })
                });

                const data = await response.json();
                if (DEBUG) console.log("Resposta do backend recebida (sem imprimir token).");

                // A MÁGICA ACONTECE AQUI
                if (response.ok && data.token) {
                    AuthManager.saveToken(data.token);
                    const savedToken = AuthManager.getToken();

                    // Nunca logar o token em produção
                    if (DEBUG) console.log("Token foi salvo com sucesso?", Boolean(savedToken));

                    if (savedToken) {
                        this.showSuccess("Login bem-sucedido!");
                        this.redirectTo(CONFIG.REDIRECT_PAGE);
                    } else {
                        this.showError("Erro: O token foi recebido mas não pôde ser salvo.");
                    }
                } else {
                    // Se a resposta não for OK ou não tiver token
                    throw new Error(data.error || "Credenciais inválidas.");
                }

            } catch (error) {
                if (DEBUG) console.error("Erro no processo de login:", error);
                this.showError(error.message);
            }
        },

        validateInputs(email, password) {
            if (!email || !password) { this.showError("Preencha todos os campos."); return false; }
            return true;
        },
        showSuccess(message) { alert(message); },
        showError(message) { alert(message); },
        redirectTo(page) { window.location.href = page; }
    };

    UIManager.init();
});