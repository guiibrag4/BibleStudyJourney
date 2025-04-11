document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova está pronto e pode-se usar recursos do dispositivo
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    
    // Iniciar ações após o Cordova estar pronto
    initApp();
}

const API_URL = "http://localhost:3000"; // <-- Servidor Express

function initApp() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('google-login').addEventListener('click', handleGoogleLogin);

    document.getElementById('signup-link').addEventListener('click', function () {
        window.location.href = '/frontend/html/cadastro.html';
    });
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Enviar os dados de login para o backend
        const response = await fetch('http://localhost:3000/auth/login', { // URL do backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha: password }) // O backend espera "senha"
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login bem-sucedido!');
            localStorage.setItem('token', data.token); // Salvar o token para autenticação futura
            // Redirecionar para a página principal ou dashboard
            window.location.href = '/frontend/html/home.html';
        } else {
            alert(data.error); // Exibir mensagem de erro do backend
        }
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        alert('Erro ao conectar ao servidor. Tente novamente mais tarde.');
    }
}

function handleGoogleLogin() {
    console.log('Google login clicked');  
    // Aqui você pode implementar a lógica de login com Google
    // Por exemplo:
    // googleAuth.signIn();
}

// Se estiver testando no navegador e não no dispositivo,
// podemos simular o evento 'deviceready'
if (window.cordova === undefined) {
    console.log('Running in browser, simulating deviceready event');
    document.addEventListener('DOMContentLoaded', function() {
        onDeviceReady();
    });
}