const API_CONFIG = {
    development: "http://localhost:3000", // URL do seu backend local
    production: "https://biblestudyjourney.onrender.com" // Substitua pela URL do seu servidor Render
};

// Detecta se o aplicativo está rodando em um ambiente Capacitor
const isCapacitor = window.Capacitor !== undefined;

// Define a URL da API com base no ambiente
const API_URL = isCapacitor ? API_CONFIG.production : API_CONFIG.development;

// Função para inicializar o aplicativo após o DOM estar pronto
function initApp() {
    console.log("API URL utilizada: " + API_URL);
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("google-login").addEventListener("click", handleGoogleLogin);

    document.getElementById("signup-link").addEventListener("click", function () {
        // Ajuste o caminho se necessário, dependendo da sua estrutura de pastas no Capacitor
        window.location.href = "html/cadastro.html"; 
    });
}

// Evento que o Capacitor dispara quando está pronto (equivalente ao deviceready do Cordova)
// ou quando o DOM está completamente carregado no navegador
document.addEventListener("DOMContentLoaded", function () {
    if (isCapacitor) {
        // Se estiver no Capacitor, aguarda o evento 'appReady' ou 'deviceready' (para compatibilidade)
        // Nota: Capacitor não tem um evento 'deviceready' direto como Cordova.
        // A inicialização pode ser feita após o DOMContentLoaded ou usando o App.addListener("ready")
        console.log("Capacitor detectado. Inicializando app.");
        initApp();
    } else {
        // Se estiver no navegador, inicializa diretamente após DOMContentLoaded
        console.log("Navegador detectado. Inicializando app.");
        initApp();
    }
});

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // Usar a API_URL definida para todas as requisições
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha: password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login bem-sucedido!");
            localStorage.setItem("token", data.token);
            // Ajuste o caminho se necessário
            window.location.href = "html/home.html";
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error("Erro ao fazer login:", err);
        alert("Erro ao conectar ao servidor. Tente novamente mais tarde.");
    }
}

function handleGoogleLogin() {
    console.log("Google login clicked");
    // Implementar lógica de login com Google usando plugins do Capacitor se necessário
    // Ex: Se usar @capacitor/google-auth, você faria algo como:
    // if (isCapacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) {
    //     const { GoogleAuth } = window.Capacitor.Plugins;
    //     GoogleAuth.signIn();
    // } else {
    //     // Fallback para web ou outra autenticação
    //     alert("Login com Google não disponível neste ambiente.");
    // }
}
