// Arquivo: js/opcoes.js (substitua o arquivo inteiro)

document.addEventListener('DOMContentLoaded', () => {

    // --- Decodificador de JWT ---
    function decodeJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Erro ao decodificar JWT:", e);
            return null;
        }
    }

    // --- Gerenciador de Perfil ---
    const UserProfileManager = {
        async init() {
            const nameEl = document.getElementById('user-name');
            const emailEl = document.getElementById('user-email');
            if (!nameEl || !emailEl) return;

            if (window.AuthManager && await window.AuthManager.isAuthenticated()) {
                const token = await window.AuthManager.getToken();
                const userData = decodeJwt(token);
                if (userData) {
                    nameEl.textContent = userData.nome || 'Usuário';
                    emailEl.textContent = userData.email || 'E-mail não disponível';
                }
            } else {
                nameEl.textContent = 'Visitante';
                emailEl.textContent = 'Faça login para salvar seu progresso';
            }
        }
    };

    // --- Gerenciador de Modais e Ações ---
    const ModalManager = {
        init() {
            this.overlay = document.getElementById('overlay');
            this.setupModal('theme-changer-button', 'theme-modal');
            this.setupModal('reading-settings-button', 'reading-settings-modal');
            this.setupLogout();
            this.setupThemeOptions();
        },

        setupModal(buttonId, modalId) {
            const openButton = document.getElementById(buttonId);
            const modal = document.getElementById(modalId);
            if (!openButton || !modal) return;

            const closeButton = modal.querySelector('.close-button');

            openButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.open(modal);
            });

            closeButton?.addEventListener('click', () => this.close(modal));
            this.overlay?.addEventListener('click', () => this.close(document.querySelectorAll('.dialog.open')));
        },

        open(modal) {
            if (this.overlay) this.overlay.classList.add('open');
            if (modal) modal.classList.add('open');
        },

        close(modalOrModals) {
            if (this.overlay) this.overlay.classList.remove('open');
            const modals = NodeList.prototype.isPrototypeOf(modalOrModals) ? modalOrModals : [modalOrModals];
            modals.forEach(m => m?.classList.remove('open'));
        },

        setupLogout() {
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', async () => {
                    if (confirm('Tem certeza que deseja sair?')) {
                        if (window.AuthManager) {
                            await window.AuthManager.redirectToLogin();
                        } else {
                            console.error("AuthManager não encontrado!");
                        }
                    }
                });
            }
        },

        setupThemeOptions() {
            const themeOptions = document.getElementById('theme-options');
            if (themeOptions) {
                themeOptions.addEventListener('click', (event) => {
                    if (event.target.classList.contains('theme-option-btn')) {
                        const selectedTheme = event.target.dataset.theme;
                        if (window.themeManager) {
                            window.themeManager.applyTheme(selectedTheme);
                            window.themeManager.saveTheme(selectedTheme);
                        }
                        this.close(document.getElementById('theme-modal'));
                    }
                });
            }
        }
    };

    // Inicializar os módulos
    UserProfileManager.init();
    ModalManager.init();
});
