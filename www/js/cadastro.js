/**
 * cadastro.js (CORRIGIDO COM DETECÇÃO DE AMBIENTE)
 * - Organização por seções: constantes, utilitários, cache DOM, UI helpers,
 *   validação, chamadas API, handlers e inicialização.
 * - Mantém comportamento existente, apenas estrutura mais clara.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     1) CONSTANTES E CONFIG
     ========================= */
  // ========================================================================
  // CONFIGURAÇÃO DE API (Usa config.js centralizado)
  // ========================================================================
  const API_BASE_URL = CONFIG.BASE_URL;
  console.log('[cadastro.js] API Base URL detectada:', API_BASE_URL);

  const isCapacitor = window.Capacitor !== undefined;
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
  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = message ? 'block' : 'none';
    }
  }

  function clearErrors() {
    showError(DOM.nameError, '');
    showError(DOM.sobrenomeError, '');
    showError(DOM.emailError, '');
    showError(DOM.passwordError, '');
    if (DOM.errorContainer) DOM.errorContainer.style.display = 'none';
  }

  function displayGeneralError(message) {
    if (DOM.errorMessage) DOM.errorMessage.textContent = message;
    if (DOM.errorContainer) DOM.errorContainer.style.display = 'block';
  }

  function setLoading(isLoading) {
    if (DOM.submitButton) {
      DOM.submitButton.disabled = isLoading;
      DOM.submitButton.textContent = isLoading ? 'Cadastrando...' : 'Cadastrar';
    }
  }

  /* =========================
     4) VALIDAÇÃO
     ========================= */
  function validateForm() {
    clearErrors();
    let isValid = true;

    const name = DOM.name.value.trim();
    const sobrenome = DOM.sobrenome.value.trim();
    const email = DOM.email.value.trim();
    const password = DOM.password.value;

    if (!name) {
      showError(DOM.nameError, 'Por favor, insira seu nome.');
      isValid = false;
    }

    if (!sobrenome) {
      showError(DOM.sobrenomeError, 'Por favor, insira seu sobrenome.');
      isValid = false;
    }

    if (!email) {
      showError(DOM.emailError, 'Por favor, insira seu e-mail.');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showError(DOM.emailError, 'Por favor, insira um e-mail válido.');
      isValid = false;
    }

    if (!password) {
      showError(DOM.passwordError, 'Por favor, insira uma senha.');
      isValid = false;
    } else if (password.length < 6) {
      showError(DOM.passwordError, 'A senha deve ter pelo menos 6 caracteres.');
      isValid = false;
    }

    return isValid;
  }

  /* =========================
     5) CHAMADAS API
     ========================= */
  async function registerUser(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao cadastrar usuário.');
    }

    return data;
  }

  // Realiza login imediatamente após o cadastro para evitar redirecionamento pelo AuthGuard
  async function loginAfterRegister(email, senha) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        console.warn('[cadastro.js] Login pós-cadastro falhou:', data?.error || 'sem token');
        return false;
      }

      // Salva o token usando o AuthManager global (auth-guard.js)
      if (window.AuthManager && typeof window.AuthManager.saveToken === 'function') {
        await window.AuthManager.saveToken(data.token);
      } else {
        // Fallback muito defensivo
        localStorage.setItem('token-jwt', data.token);
      }

      return true;
    } catch (e) {
      console.error('[cadastro.js] Erro no login pós-cadastro:', e);
      return false;
    }
  }

  /* =========================
     6) HANDLERS
     ========================= */
  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const userData = {
      nome: DOM.name.value.trim(),
      sobrenome: DOM.sobrenome.value.trim(),
      email: DOM.email.value.trim(),
      senha: DOM.password.value
    };

    setLoading(true);

    try {
      await registerUser(userData);

      // Tenta logar automaticamente após cadastro
      const logged = await loginAfterRegister(userData.email, userData.senha);
      if (logged) {
        // Redireciona imediatamente para home já autenticado
        window.location.href = 'home2.html';
        return;
      }

      // Fallback: mostra tela de sucesso para o usuário continuar manualmente
      if (DOM.registrationContainer) DOM.registrationContainer.style.display = 'none';
      if (DOM.successContainer) DOM.successContainer.style.display = 'block';

    } catch (error) {
      console.error('Erro no cadastro:', error);
      displayGeneralError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleIniciarSessao() {
    window.location.href = 'login2.html';
  }

  function handleGoToHome() {
    window.location.href = 'home2.html'; // caminho absoluto
  }

  /* =========================
     7) INICIALIZAÇÃO
     ========================= */
  if (DOM.form) {
    DOM.form.addEventListener('submit', handleSubmit);
  }

  if (DOM.iniciarSessaoBtn) {
    DOM.iniciarSessaoBtn.addEventListener('click', handleIniciarSessao);
  }

  if (DOM.goToLoginButton) {
    DOM.goToLoginButton.addEventListener('click', handleGoToHome); // ADICIONADO
  }


});

