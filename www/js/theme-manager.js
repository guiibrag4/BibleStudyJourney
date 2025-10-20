const themeManager = {
    // Chave consistente para localStorage
    THEME_KEY: 'selectedTheme',

    // Salvar tema (síncrono)
    saveTheme(theme) {
        try {
            localStorage.setItem(this.THEME_KEY, theme);
            console.log('✅ Tema salvo:', theme);
        } catch (err) {
            console.error('❌ Erro ao salvar tema:', err);
        }
    },

    // Obter tema salvo
    getTheme() {
        try {
            return localStorage.getItem(this.THEME_KEY) || 'light-mode';
        } catch (err) {
            console.error('❌ Erro ao obter tema:', err);
            return 'light-mode';
        }
    },

    // Aplicar tema ao body
    applyTheme(theme) {
        // Remove todos os temas existentes
        document.body.classList.remove('light-mode', 'dark-mode', 'sepia-mode');
        
        // Adiciona o novo tema
        document.body.classList.add(theme);
        
        console.log('🎨 Tema aplicado:', theme);
    },

    // Trocar tema e salvar
    setTheme(theme) {
        this.applyTheme(theme);
        this.saveTheme(theme);
    },

    // Inicializar tema
    init() {
        const savedTheme = this.getTheme();
        this.applyTheme(savedTheme);
        
        // Configurar botões de tema
        this.setupThemeButtons();
    },

    // Configurar event listeners
    setupThemeButtons() {
        const themeButtons = document.querySelectorAll('[data-theme]');
        
        themeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const selectedTheme = e.target.dataset.theme;
                this.setTheme(selectedTheme);
                
                // Fechar modais se existirem
                this.closeModals();
            });
        });
    },

    // Fechar modais de tema
    closeModals() {
        const overlay = document.getElementById('overlay');
        const themeModal = document.getElementById('theme-modal');
        
        if (overlay) overlay.classList.remove('active');
        if (themeModal) themeModal.classList.remove('active');
    }
};

// Disponibiliza globalmente
window.themeManager = themeManager;

// Inicializa automaticamente
window.themeManager.init();