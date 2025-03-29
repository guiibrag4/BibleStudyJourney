document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova está pronto e pode-se usar recursos do dispositivo
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    
    // Iniciar ações após o Cordova estar pronto
    initApp();
}

function initApp() {
    // Adicionar event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('google-login').addEventListener('click', handleGoogleLogin);
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Login attempt with:', { email, password });
    
    // Aqui você pode implementar a lógica de autenticação
    // Por exemplo:
    // authenticateUser(email, password);
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