// ...existing code...
/**
 * cadastro.js
 * - Organização por seções: constantes, utilitários, cache DOM, UI helpers,
 *   validação, chamadas API, handlers e inicialização.
 * - Mantém comportamento existente, apenas estrutura mais clara.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     1) CONSTANTES E CONFIG
     ========================= */
  const API_CONFIG = {
    development: "http://localhost:3000",
    production: "https://biblestudyjourney.duckdns.org",
    production_render: "https://biblestudyjourney-v2.onrender.com"
  };

  const isCapacitor = window.Capacitor !== undefined;
  // Força uso do servidor de produção (mantido do código original)
  // const API_URL = API_CONFIG.production;
  const API_URL = API_CONFIG.development;


  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  /* =========================
     2) CACHE DO DOM
     ========================= */
  const DOM = {
    form: document.getElementById('registrationForm'),
    name: document.getElementById('name'),
    sobrenome: document.getElementById('sobrenome'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    submitButton: document.getElementById('submitButton'),

    // Erros / mensagens
    nameError: document.getElementById('nameError'),
    sobrenomeError: document.getElementById('sobrenomeError'),
    emailError: document.getElementById('emailError'),
    passwordError: document.getElementById('passwordError'),
    errorContainer: document.getElementById('errorContainer'),
    errorMessage: document.getElementById('errorMessage'),

    // Sucesso / containers
    registrationContainer: document.getElementById('registrationContainer'),
    successContainer: document.getElementById('successContainer'),
    iniciarSessaoBtn: document.querySelector('.iniciar-sessao'),
    goToLoginButton: document.getElementById('goToLoginButton')
  };

  /* =========================
     3) UTILITÁRIOS
     ========================= */
  function isCordova() {
    return typeof window.cordova !== 'undefined';
  }

  function log(...args) {
    // pequeno wrapper para facilitar debug (remover se desejar)
    console.log('[cadastro]', ...args);
  }

  /* =========================
     4) UI HELPERS
     ========================= */
  function clearFieldErrors() {
    if (!DOM.nameError) return;
    DOM.nameError.textContent = '';
    DOM.sobrenomeError.textContent = '';
    DOM.emailError.textContent = '';
    DOM.passwordError.textContent = '';
    if (DOM.errorContainer) DOM.errorContainer.style.display = 'none';
  }

  function showBackendError(message) {
    if (!DOM.errorContainer) return;
    DOM.errorMessage.textContent = message || 'Erro ao cadastrar usuário';
    DOM.errorContainer.style.display = 'block';
  }

  function setSubmitting(isSubmitting) {
    if (!DOM.submitButton) return;
    DOM.submitButton.disabled = isSubmitting;
    DOM.submitButton.textContent = isSubmitting ? 'Enviando...' : 'Cadastrar';
    if (isSubmitting) {
      DOM.submitButton.setAttribute('aria-busy', 'true');
    } else {
      DOM.submitButton.removeAttribute('aria-busy');
    }
  }

  function showSuccessAndRedirect() {
    if (DOM.registrationContainer) DOM.registrationContainer.style.display = 'none';
    if (DOM.successContainer) {
      DOM.successContainer.style.display = 'flex';
    }
    if (DOM.goToLoginButton) DOM.goToLoginButton.focus();
  }

  /* =========================
     5) VALIDAÇÃO DO FORMULÁRIO
     ========================= */
  function validateForm() {
    clearFieldErrors();
    let isValid = true;

    if (!DOM.name.value.trim()) {
      DOM.nameError.textContent = 'Nome é obrigatório';
      isValid = false;
    }

    if (!DOM.sobrenome.value.trim()) {
      DOM.sobrenomeError.textContent = 'Sobrenome é obrigatório';
      isValid = false;
    }

    if (!DOM.email.value.trim()) {
      DOM.emailError.textContent = 'Email é obrigatório';
      isValid = false;
    } else if (!emailRegex.test(DOM.email.value)) {
      DOM.emailError.textContent = 'Email inválido';
      isValid = false;
    }

    if (!DOM.password.value) {
      DOM.passwordError.textContent = 'Senha é obrigatória';
      isValid = false;
    } else if (DOM.password.value.length < 6) {
      DOM.passwordError.textContent = 'Senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    return isValid;
  }

  /* =========================
     6) CHAMADAS À API
     ========================= */
  async function registerUser(payload) {
    const url = `${API_URL}/auth/register`;
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  /* =========================
     7) HANDLERS DE EVENTOS
     ========================= */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    const formData = {
      nome: DOM.name.value.trim(),
      sobrenome: DOM.sobrenome.value.trim(),
      email: DOM.email.value.trim(),
      senha: DOM.password.value
    };

    try {
      const result = await registerUser(formData);

      if (result.ok) {
        showSuccessAndRedirect();
      } else {
        const message = (result.data && result.data.error) || `Erro (${result.status}) ao cadastrar`;
        showBackendError(message);
      }
    } catch (err) {
      log('Erro ao conectar ao servidor:', err);
      showBackendError('Erro ao conectar ao servidor. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  }

  function bindEvents() {
    if (DOM.form) DOM.form.addEventListener('submit', handleSubmit);
    if (DOM.iniciarSessaoBtn) {
      DOM.iniciarSessaoBtn.addEventListener('click', () => {
        window.location.href = 'login2.html';
      });
    }
  }
  if (DOM.goToLoginButton) {
    DOM.goToLoginButton.addEventListener('click', () => {
      window.location.href = 'login2.html';
    });
  }

  /* =========================
     8) INICIALIZAÇÃO
     ========================= */
  function init() {
    log('API URL utilizada no cadastro:', API_URL);

    if (!DOM.form) {
      log('Formulário não encontrado: registrationForm');
      return;
    }

    bindEvents();

    if (isCordova()) {
      document.addEventListener('deviceready', () => log('Cordova initialized'), false);
    } else {
      log('Running in browser environment');
    }
  }

  init();

});