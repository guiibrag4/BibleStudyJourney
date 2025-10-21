document.addEventListener('DOMContentLoaded', async () => {
    const statsContent = document.getElementById('stats-content');

    // Mapeamento de abreviações para nomes completos
    const bookNames = {
        "Gênesis": "gn", "Êxodo": "ex", "Levítico": "lv", "Números": "nm", "Deuteronômio": "dt",
        "Josué": "js", "Juízes": "jz", "Rute": "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
        "1 Reis": "1rs", "2 Reis": "2rs", "1 Crônicas": "1cr", "2 Crônicas": "2cr",
        "Esdras": "ed", "Neemias": "ne", "Ester": "et", "Jó": "jó", "Salmos": "sl",
        "Provérbios": "pv", "Eclesiastes": "ec", "Cantares": "ct", "Isaías": "is",
        "Jeremias": "jr", "Lamentações": "lm", "Ezequiel": "ez", "Daniel": "dn",
        "Oséias": "os", "Joel": "jl", "Amós": "am", "Obadias": "ob", "Jonas": "jn",
        "Miquéias": "mq", "Naum": "na", "Habacuque": "hb", "Sofonias": "sf",
        "Ageu": "ag", "Zacarias": "zc", "Malaquias": "ml", "Mateus": "mt",
        "Marcos": "mc", "Lucas": "lc", "João": "jo", "Atos": "at", "Romanos": "rm",
        "1 Coríntios": "1co", "2 Coríntios": "2co", "Gálatas": "gl",
        "Efésios": "ef", "Filipenses": "fp", "Colossenses": "cl",
        "1 Tessalonicenses": "1ts", "2 Tessalonicenses": "2ts",
        "1 Timóteo": "1tm", "2 Timóteo": "2tm", "Tito": "tt", "Filemom": "fl",
        "Hebreus": "hb", "Tiago": "tg", "1 Pedro": "1pe", "2 Pedro": "2pe",
        "1 João": "1jo", "2 João": "2jo", "3 João": "3jo", "Judas": "jd",
        "Apocalipse": "ap"
    };

    async function fetchStats() {
        if (!window.AuthManager || !await window.AuthManager.isAuthenticated()) {
            statsContent.innerHTML = '<p>Você precisa estar logado para ver suas estatísticas.</p>';
            return;
        }

        try {
            const token = await window.AuthManager.getToken();
            const response = await fetch('/api/user/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Falha ao carregar estatísticas.');
            }

            const stats = await response.json();
            renderStats(stats);

        } catch (error) {
            statsContent.classList.remove('stats-loading');
            statsContent.innerHTML = `<p style="text-align: center;">${error.message}</p>`;
        }
    }

    function renderStats(stats) {
        statsContent.classList.remove('stats-loading');
        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h2>Tempo de Estudo</h2>
                    <p><span class="stat-value">${stats.studyHours}</span><span class="stat-unit">horas</span></p>
                </div>
                <div class="stat-card">
                    <h2>Itens Salvos</h2>
                    <p><span class="stat-value">${stats.totalSaves}</span><span class="stat-unit">total</span></p>
                </div>
                <div class="stat-card">
                    <h2>Livros Lidos</h2>
                    <p><span class="stat-value">${stats.readBooksCount}</span><span class="stat-unit">de 66</span></p>
                    <div class="read-books-list">
                        ${stats.readBooksList.map(abbr => `<span class="book-chip">${bookNames[abbr] || abbr}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    fetchStats();
});
