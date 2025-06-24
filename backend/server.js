const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth/auth.js");
const cors = require("cors");   
const path = require("path"); // Para lidar com caminhos de arquivos
const app = express();

// Origens permitidas para o CORS (Recursos de origem cruzada)
const allowedOrigins = [
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "http://localhost:3000", // Porta do servidor Express
    "http://localhost:8080", // Porta do comando serve
    "http://localhost:8100", // Porta padrão do Ionic/Capacitor serve
    "https://localhost",
    "https://localhost:8100",
    "http://192.168.1.100:8100",
    "https://https://biblestudyjourney-v2.onrender.com" // 
];

// Configuração CORS simplificada para desenvolvimento
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;

// Middleware para processar requisições JSON
app.use(bodyParser.json());

// Servir os arquivos estáticos do frontend (Capacitor)
app.use(express.static(path.join(__dirname, "../www")));

// Rotas
app.use("/auth", authRoutes);

// Rotas para servir as páginas de frontend (HTML)
app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/html/cadastro.html"));
});

app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/html/home.html"));
});

app.get("/saves", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/html/saves.html"));
});

app.get("/tl1-teologia", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/html/tl1-teologia.html"));
});

app.get("/tl2-teologia", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/html/tl2-teologia.html"));
});

// Iniciar o servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});