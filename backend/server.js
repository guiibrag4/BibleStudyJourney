require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth/auth.js");
const cors = require("cors");
const fetch = require('node-fetch');
const path = require("path");

const app = express();

// Origens permitidas (sem alterações aqui)
const allowedOrigins = [
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8100",
    "https://localhost",
    "https://localhost:8100",
    "http://192.168.1.100:8100",
    "https://biblestudyjourney-v2.onrender.com"
];

/* Configuração CORS (sem alterações aqui, esse CORS é para todas as rotas, em ambiente de desenvolvimento */

// app.use(cors({
//     origin: true,
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

/* Configuração CORS aprimorada para permitir apenas origens específicas, garantindo segurança em produção */
const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (como apps mobile ou Postman) e as origens da sua lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

// Middleware para processar requisições JSON
app.use(bodyParser.json());

// Servir os arquivos estáticos do frontend (Capacitor)
app.use(express.static(path.join(__dirname, "../www")));

// --- NOVO CÓDIGO: Rota da API do YouTube ---
// Coloque esta rota antes das suas rotas de autenticação e de arquivos HTML.
// Isso garante que requisições para '/api/...' sejam tratadas aqui.

function parseYoutubeDuration(duration) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return 0;

    const hours = parseInt(matches[1] || 0);
    const minutes = parseInt(matches[2] || 0);
    const seconds = parseInt(matches[3] || 0);

    return (hours * 3600) + (minutes * 60) + seconds;
}

app.get('/api/video-info', async (req, res) => {
    const videoId = req.query.videoId;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Pega a chave do arquivo .env

    if (!videoId) {
        return res.status(400).json({ error: 'O ID do vídeo é obrigatório.' });
    }
    if (!YOUTUBE_API_KEY) {
        console.error("Chave da API do YouTube não encontrada. Verifique o arquivo .env");
        return res.status(500).json({ error: 'A chave da API do servidor não está configurada.' });
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails`;

    try {
        const youtubeResponse = await fetch(url);
        const data = await youtubeResponse.json();

        // TRECHO CORRIGIDO
        if (data.items && data.items.length > 0) {
            const item = data.items[0]; // Precisamos do 'item' completo
            const snippet = item.snippet;
            const durationFromAPI = item.contentDetails.duration; // Pegamos a duração aqui

            res.json({
                title: snippet.title,
                description: snippet.description,
                durationInSeconds: parseYoutubeDuration(durationFromAPI) // Usamos a variável correta
            });
        } else {
            // Se a API do YouTube não retornar o vídeo, pode ser um ID inválido
            res.status(404).json({ error: 'Vídeo não encontrado na API do YouTube.' });
        }
    } catch (error) {
        console.error('Erro ao buscar dados do YouTube:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao contatar a API do YouTube.' });
    }
});
// --- FIM DO CÓDIGO PARA API ---


// Rotas de Autenticação
app.use("/auth", authRoutes);

// Rotas para servir as páginas de frontend (HTML)
app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/html/cadastro2.html"));
});

app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "../www/html/biblia.html"));
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

// Iniciar o servidor (sem alterações aqui)
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
