// Função para fechar modal ao clicar fora
function setupModalClickOutside() {
    const modals = document.querySelectorAll('.dialog');
    const overlay = document.getElementById('overlay');
    
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Se clicar no fundo do modal (não no conteúdo), fecha o modal
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Também fechar ao clicar no overlay
    if (overlay) {
        overlay.addEventListener('click', closeAllModals);
    }
}

// Função para fechar todos os modais
function closeAllModals() {
    const modals = document.querySelectorAll('.dialog');
    const overlay = document.getElementById('overlay');
    
    modals.forEach(modal => {
        modal.classList.remove('open');
    });
    
    if (overlay) {
        overlay.classList.remove('open');
    }
}

// Função para atualizar a versão da Bíblia e fechar modal
function setupVersionSelector() {
    const versionSelect = document.getElementById('version-select');
    const versionDialog = document.getElementById('version-dialog');
    
    if (versionSelect) {
        versionSelect.addEventListener('change', (e) => {
            const selectedVersion = e.target.value;
            
            // Atualizar o botão da versão
            const versionButton = document.getElementById('version-selector');
            if (versionButton) {
                versionButton.textContent = selectedVersion;
            }
            
            // Fechar o modal imediatamente
            closeAllModals();
            
            // Aqui você pode adicionar lógica para recarregar o conteúdo da Bíblia
            // loadBibleContent(selectedVersion);
            console.log(`Versão selecionada: ${selectedVersion}`);
        });
    }
}

// Configurar botões de fechar
function setupCloseButtons() {
    const closeButtons = document.querySelectorAll('.close-button');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
}

// Inicializar todas as funcionalidades
document.addEventListener('DOMContentLoaded', () => {
    setupModalClickOutside();
    setupVersionSelector();
    setupCloseButtons();
});

// Tecla ESC para fechar modais
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});