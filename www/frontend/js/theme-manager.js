// www/frontend/js/theme-manager.js
const themeManager = {
    async saveTheme(theme) {
        try {
            await localforage.setItem('userTheme', theme);
            console.log('Tema salvo:', theme);
        } catch (err) {
            console.error('Erro ao salvar o tema:', err);
        }
    },

    async getTheme() {
        try {
            return await localforage.getItem('userTheme') || 'light-mode'; // Padrão é light-mode
        } catch (err) {
            console.error('Erro ao obter o tema:', err);
            return 'light-mode';
        }
    },

    applyTheme(theme) {
        document.body.className = ''; // Limpa classes existentes
        document.body.classList.add(theme);
        console.log('Tema aplicado:', theme);
    },

    async init() {
        const savedTheme = await this.getTheme();
        this.applyTheme(savedTheme);
    }
};

// Anexa ao objeto window para ser acessível globalmente
window.themeManager = themeManager;

// Inicializa o tema assim que o script for carregado
window.themeManager.init();