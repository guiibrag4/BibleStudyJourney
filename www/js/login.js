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

    // CORRIGIDO: Detecção automática de ambiente baseada no hostname
    function getApiBaseUrl() {
        // O Capacitor injeta o objeto global 'Capacitor' quando o app está rodando nativamente.
        // A propriedade 'isNativePlatform' nos diz se estamos no iOS ou Android.
        const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();

        // 1. Se for o aplicativo nativo (Android/iOS), SEMPRE use a API de produção (HTTPS).
        if (isNativeApp) {
            console.log('[getApiBaseUrl] Detectado ambiente nativo (Capacitor). Forçando API de produção.');
            // Escolha aqui o seu servidor de produção principal.
            return 'https://biblestudyjourney.duckdns.org';
            // Ou: return 'https://biblestudyjourney-v2.onrender.com';
        }

        // 2. Se não for nativo, é um navegador web. Use a lógica anterior.
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        console.log(`[getApiBaseUrl] Detectado ambiente web: ${protocol}//${hostname}`);

        // Ambiente de desenvolvimento local no navegador
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }

        // Ambiente de produção no navegador (Render, DuckDNS, etc. )
        if (protocol === 'https:') {
            if (hostname.includes('onrender.com')) {
                return 'https://biblestudyjourney-v2.onrender.com';
            }
            if (hostname.includes('duckdns.org')) {
                return 'https://biblestudyjourney.duckdns.org';
            }
        }

        // Fallback final: usa a origem da página.
        // Isso garante que se você acessar https://meusite.com, a API será https://meusite.com/api/...
        return window.location.origin;
    }

    const API_BASE_URL = getApiBaseUrl();
    console.log('[login.js] API Base URL detectada:', API_BASE_URL);

    const CONFIG = {
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
            this.elements.signupLink?.addEventListener("click", () => this.redirectTo(CONFIG.SIGNUP_PAGE));
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
                    this.redirectTo(CONFIG.REDIRECT_PAGE);
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

