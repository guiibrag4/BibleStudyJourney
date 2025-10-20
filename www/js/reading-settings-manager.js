// Salve como: js/reading-settings-manager.js (Versão Atualizada)

const ReadingSettingsManager = {
    SETTINGS_KEY: 'userReadingSettings',
    defaults: {
        fontSize: 1.0,
        lineHeight: 1.8, // Novo padrão
    },

    async init() {
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
            
            // Elementos para abrir/fechar o modal
            modal: document.getElementById('reading-settings-modal'),
            openButton: document.querySelector('.font-size-button'), // Botão na tela da Bíblia
            closeButton: document.querySelector('#reading-settings-modal .close-button'),
            overlay: document.getElementById('overlay'),

            // Onde o texto será afetado
            bibleContent: document.getElementById('bible-content')
        };
    },

    setupEventListeners() {
        // Listeners dos controles de configuração
        this.elements.decreaseFont?.addEventListener('click', () => this.changeFontSize(-0.1));
        this.elements.increaseFont?.addEventListener('click', () => this.changeFontSize(0.1));
        this.elements.lineHeight?.addEventListener('input', (e) => this.changeLineHeight(e.target.value));

        // --- NOVA LÓGICA PARA ABRIR E FECHAR O MODAL ---
        this.elements.openButton?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });

        this.elements.closeButton?.addEventListener('click', () => this.closeModal());
        this.elements.overlay?.addEventListener('click', () => this.closeModal());
    },

    // --- NOVAS FUNÇÕES PARA CONTROLAR O MODAL ---
    openModal() {
        if (this.elements.modal) this.elements.modal.classList.add('open');
        if (this.elements.overlay) this.elements.overlay.classList.add('open');
    },

    closeModal() {
        if (this.elements.modal) this.elements.modal.classList.remove('open');
        // Apenas remove a classe 'open' do overlay se nenhum outro modal estiver aberto
        if (!document.querySelector('.dialog.open')) {
            if (this.elements.overlay) this.elements.overlay.classList.remove('open');
        }
    },

    async load() {
        const saved = await localforage.getItem(this.SETTINGS_KEY);
        return { ...this.defaults, ...saved };
    },

    async save(settings) {
        await localforage.setItem(this.SETTINGS_KEY, settings);
    },

    apply(settings) {
        document.documentElement.style.setProperty('--reading-font-size-multiplier', settings.fontSize);
        document.documentElement.style.setProperty('--reading-line-height', settings.lineHeight);
    },

    updateUI(settings) {
        if (this.elements.preview) {
            this.elements.preview.style.fontSize = `${20 * settings.fontSize}px`;
        }
        if (this.elements.lineHeight) {
            this.elements.lineHeight.value = settings.lineHeight;
        }
    },

    async changeFontSize(delta) {
        const settings = await this.load();
        settings.fontSize = Math.max(0.8, Math.min(1.8, settings.fontSize + delta));
        this.apply(settings);
        this.updateUI(settings);
        this.save(settings);
    },

    async changeLineHeight(value) {
        const settings = await this.load();
        settings.lineHeight = parseFloat(value);
        this.apply(settings);
        this.save(settings);
    }
};

ReadingSettingsManager.init();
