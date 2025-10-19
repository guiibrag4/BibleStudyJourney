// Salve como: js/reading-settings-manager.js

const ReadingSettingsManager = {
    SETTINGS_KEY: 'readingSettings',
    defaults: {
        fontSize: 1.0, // Multiplicador base (1.0 = 16px)
        lineHeight: 1.6,
        brightness: 1.0
    },

    async init() {
        // Garante que o DOM esteja pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._initialize());
        } else {
            this._initialize();
        }
    },

    async _initialize() {
        this.cacheElements();
        const settings = await this.load();
        this.apply(settings);
        this.updateUI(settings);
        this.setupEventListeners();
    },

    cacheElements() {
        this.elements = {
            // Elementos do Modal
            decreaseFont: document.getElementById('decrease-font'),
            increaseFont: document.getElementById('increase-font'),
            preview: document.getElementById('font-size-preview'),
            lineHeight: document.getElementById('line-height-slider'),
            brightness: document.getElementById('brightness-slider'),
            // Botão para abrir o modal na tela da Bíblia
            fontSizeButton: document.querySelector('.font-size-button')
        };
    },

    setupEventListeners() {
        this.elements.decreaseFont?.addEventListener('click', () => this.changeFontSize(-0.1));
        this.elements.increaseFont?.addEventListener('click', () => this.changeFontSize(0.1));
        this.elements.lineHeight?.addEventListener('input', (e) => this.changeLineHeight(e.target.value));
        this.elements.brightness?.addEventListener('input', (e) => this.changeBrightness(e.target.value));

        // Listener para o botão na tela da Bíblia
        this.elements.fontSizeButton?.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('reading-settings-modal');
            const overlay = document.getElementById('overlay');
            if (modal) modal.classList.add('open');
            if (overlay) overlay.classList.add('open');
        });
    },

    async load() {
        const saved = await localforage.getItem(this.SETTINGS_KEY);
        return { ...this.defaults, ...saved };
    },

    async save(settings) {
        await localforage.setItem(this.SETTINGS_KEY, settings);
    },

    apply(settings) {
        document.documentElement.style.setProperty('--global-font-size', `${16 * settings.fontSize}px`);
        document.documentElement.style.setProperty('--global-line-height', settings.lineHeight);
        document.body.style.filter = `brightness(${settings.brightness})`;
    },

    updateUI(settings) {
        if (this.elements.preview) {
            this.elements.preview.style.fontSize = `${18 * settings.fontSize}px`;
        }
        if (this.elements.lineHeight) this.elements.lineHeight.value = settings.lineHeight;
        if (this.elements.brightness) this.elements.brightness.value = settings.brightness;
    },

    async changeFontSize(delta) {
        const settings = await this.load();
        // Limites: 0.8 (aprox 13px) a 1.5 (24px)
        settings.fontSize = Math.max(0.8, Math.min(1.5, settings.fontSize + delta));
        this.apply(settings);
        this.updateUI(settings);
        this.save(settings);
    },

    async changeLineHeight(value) {
        const settings = await this.load();
        settings.lineHeight = parseFloat(value);
        this.apply(settings);
        this.save(settings);
    },

    async changeBrightness(value) {
        const settings = await this.load();
        settings.brightness = parseFloat(value);
        this.apply(settings);
        this.save(settings);
    }
};

// Inicializa o gerenciador
ReadingSettingsManager.init();
