require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet"); // NOVO: Importa o helmet
const cors = require("cors");
const fetch = require('node-fetch');
const path = require("path");

// --- ARQUIVOS DE ROTAS ---
const authRoutes = require("./routes/auth/auth.js");
const verifyToken = require("./routes/auth/authMiddleware.js");
const progressRoutes = require("./routes/progressRoutes.js"); // NOVO: Importa as rotas de progresso

const app = express();

// --- CONFIGURAÇÕES DO SERVIDOR ---
const allowedOrigins = [
    "capacitor://localhost",
    "ionic://localhost",

    "http://localhost:3000",

    // Origens de produção
    "https://biblestudyjourney-v2.onrender.com",
    "https://biblestudyjourney.duckdns.org",
];

// --- NOVO: CONFIGURAÇÃO DE SEGURANÇA (CSP) ---
// Coloque isso antes das suas rotas.
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-src": ["'self'", "https://www.youtube.com"], // Permite iframes do YouTube
            "script-src": ["'self'", "https://www.youtube.com", "https://s.ytimg.com", "'unsafe-inline"], // Permite scripts do YouTube
            "connect-src": ["'self'", "https://www.google-analytics.com", "https://biblestudyjourney-v2.onrender.com"], // Permite conexões com sua própria API
        },
    })
);
// -------------------------------------------

const corsOptions = {
    origin: function (origin, callback) {
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
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// --- ROTAS DA API ---

// Rota pública para informações de vídeo (não requer login)
app.get('/api/video-info', async (req, res) => {
    // ... (seu código da API do YouTube permanece inalterado aqui)
    const videoId = req.query.videoId;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const snippet = item.snippet;
            const durationFromAPI = item.contentDetails.duration;

            // Função para converter a duração do YouTube para segundos
            function parseYoutubeDuration(duration) {
                const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
                const matches = duration.match(regex);
                if (!matches) return 0;
                const hours = parseInt(matches[1] || 0);
                const minutes = parseInt(matches[2] || 0);
                const seconds = parseInt(matches[3] || 0);
                return (hours * 3600) + (minutes * 60) + seconds;
            }

            res.json({
                title: snippet.title,
                description: snippet.description,
                durationInSeconds: parseYoutubeDuration(durationFromAPI)
            });
        } else {
            res.status(404).json({ error: 'Vídeo não encontrado na API do YouTube.' });
        }
    } catch (error) {
        console.error('Erro ao buscar dados do YouTube:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao contatar a API do YouTube.' });
    }
});

// Rotas públicas de autenticação (não requerem login)
app.use("/auth", authRoutes);

// --- ROTAS PROTEGIDAS ---
// ALTERADO: Todas as rotas abaixo desta linha usarão o middleware 'verifyToken'.
// Qualquer requisição para '/api/user/*' será primeiro validada.
app.use("/api/user/progress", verifyToken, progressRoutes);
// NOVO: Quando você criar as rotas para notas, versículos, etc., elas virão aqui:
// app.use("/api/user/notes", verifyToken, notesRoutes);
// app.use("/api/user/verses", verifyToken, versesRoutes);


// --- SERVIR ARQUIVOS ESTÁTICOS E PÁGINAS HTML (deve vir por último) ---
app.use(express.static(path.join(__dirname, "../www")));

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

// --- INICIAR O SERVIDOR ---
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
