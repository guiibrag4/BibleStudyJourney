const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth/auth.js');
const cors = require('cors');   
const path = require('path'); // Para lidar com caminhos de arquivos

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); 

// Servir os arquivos estáticos do frontend (Cordova)
app.use(express.static(path.join(__dirname, '../www')));

// Servir os arquivos estáticos do Cordova
app.use(express.static(path.join(__dirname, '../platforms/browser/www')));

// Rotas
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../www/index.html')); // Serve o index.html para qualquer rota não definida
});

// Rota para servir a página de cadastro
app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../www/frontend/html/cadastro.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
