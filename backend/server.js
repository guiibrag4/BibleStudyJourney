require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const fetch = require('node-fetch');
const path = require("path");

// --- ARQUIVOS DE ROTAS ---
const authRoutes = require("./routes/auth/auth.js");
const verifyToken = require("./routes/auth/authMiddleware.js");
const progressRoutes = require("./routes/progressRoutes.js");

// NOVO: Importar as rotas de saves
const highlightsRoutes = require("./routes/highlightsRoutes.js");
const chaptersRoutes = require("./routes/chaptersRoutes.js");
const notesRoutes = require("./routes/notesRoutes.js");

const app = express();

// --- CONFIGURAÇÕES DO SERVIDOR ---
const allowedOrigins = [
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost:3000",
    "https://localhost",
    
    // Origens de produção
    "https://biblestudyjourney-v2.onrender.com",
    "https://biblestudyjourney.duckdns.org",
];

// --- CONFIGURAÇÃO DE SEGURANÇA (CSP) ---
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      
      "frame-src": ["'self'", "https://www.youtube.com"],
      
      "script-src": [
        "'self'", 
        "https://www.youtube.com", 
        "https://s.ytimg.com", 
        "https://cdnjs.cloudflare.com", 
        "'unsafe-inline'"
      ],
      
      "connect-src": [
        "'self'", 
        "https://www.google-analytics.com", 
        "https://biblestudyjourney-v2.onrender.com",
        "https://biblestudyjourney.duckdns.org",
        "https://www.abibliadigital.com.br",
        "https://www.googleapis.com"
      ],

      "img-src": ["'self'", "data:", "https://img.youtube.com", "https://i.ytimg.com"],
    },
  })
);

// --- CONFIGURAÇÃO DE PERMISSÕES DA PÁGINA ---
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'autoplay=(self "https://www.youtube.com"), fullscreen=(self "https://www.youtube.com"), picture-in-picture=(self "https://www.youtube.com")');
  next();
});

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
// IMPORTANTE: Todas as rotas abaixo usam o middleware 'verifyToken'
// Qualquer requisição para '/api/user/*' será primeiro validada

// Progresso de vídeos
app.use("/api/user/progress", verifyToken, progressRoutes);

// NOVO: Rotas de saves (grifos, capítulos, notas)
app.use("/api/user/highlights", verifyToken, highlightsRoutes);
app.use("/api/user/chapters", verifyToken, chaptersRoutes);
app.use("/api/user/notes", verifyToken, notesRoutes);

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

