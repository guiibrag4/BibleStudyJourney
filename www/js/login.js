/**
 * Módulo da página de login (CORRIGIDO COM DETECÇÃO DE AMBIENTE)
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

    // ========================================================================
    // CONFIGURAÇÃO DE API (Usa config.js centralizado)
    // ========================================================================
    const API_BASE_URL = CONFIG.BASE_URL;
    console.log('[login.js] API Base URL detectada:', API_BASE_URL);

    const LOGIN_CONFIG = {
        REDIRECT_PAGE: "biblia.html",
        SIGNUP_PAGE: "cadastro2.html"
    };

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
            this.elements.signupLink?.addEventListener("click", () => this.redirectTo(LOGIN_CONFIG.SIGNUP_PAGE));
        },

        async handleLoginSubmit(event) {
            event.preventDefault();

            const email = this.elements.emailInput.value.trim();
            const password = this.elements.passwordInput.value;

            if (!this.validateInputs(email, password)) return;

            this.showLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha: password })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    await AuthManager.saveToken(data.token);
                    if (DEBUG) console.log("Login bem-sucedido! Token salvo.");
                    this.redirectTo(LOGIN_CONFIG.REDIRECT_PAGE);
                } else {
                    this.showError(data.error || "Erro ao fazer login. Verifique suas credenciais.");
                }
            } catch (error) {
                console.error("Erro na requisição de login:", error);
                this.showError("Erro de conexão. Tente novamente mais tarde.");
            } finally {
                this.showLoading(false);
            }
        },

        validateInputs(email, password) {
            if (!email || !password) {
                this.showError("Por favor, preencha todos os campos.");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showError("Por favor, insira um e-mail válido.");
                return false;
            }
            return true;
        },

        showError(message) {
            alert(message);
        },

        showLoading(isLoading) {
            const submitBtn = this.elements.loginForm?.querySelector("button[type='submit']");
            if (submitBtn) {
                submitBtn.disabled = isLoading;
                submitBtn.textContent = isLoading ? "Entrando..." : "Entrar";
            }
        },

        redirectTo(page) {
            window.location.href = page;
        }
    };

    UIManager.init();
});

