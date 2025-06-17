// www/frontend/js/premium-features.js
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle-premium');
    if (!themeToggleButton) return;

    // Simulação: Verifique se o usuário é premium.
    // No futuro, isso viria da sua lógica de autenticação.
    const isPremiumUser = () => {
        // Por agora, vamos usar um item no localStorage para simular.
        // Para testar, abra o console do navegador e digite: localStorage.setItem('isPremium', 'true');
        return localStorage.getItem('isPremium') === 'true';
    };

    if (isPremiumUser()) {
        themeToggleButton.style.display = 'block'; // Mostra o botão para usuários premium

        themeToggleButton.addEventListener('click', async () => {
            const currentTheme = await themeManager.getTheme();
            const newTheme = currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';

            themeManager.applyTheme(newTheme);
            await themeManager.saveTheme(newTheme);
        });
    } else {
        themeToggleButton.style.display = 'none'; // Esconde o botão se não for premium
    }
});