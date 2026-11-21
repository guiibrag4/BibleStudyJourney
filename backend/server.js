require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");
const fetch = require('node-fetch');
const path = require("path");
const compression = require('compression');
const { runMigration } = require('./db-migration');
const devotional = require('./services/devotional/devotional');

// --- ARQUIVOS DE ROTAS ---
const authRoutes = require("./routes/auth/auth.js");
const verifyToken = require("./routes/auth/authMiddleware.js");
const progressRoutes = require("./routes/progressRoutes.js");
const highlightsRoutes = require("./routes/highlightsRoutes.js");
const chaptersRoutes = require("./routes/chaptersRoutes.js");
const notesRoutes = require("./routes/notesRoutes.js");
const statsRoutes = require("./routes/statsRoutes.js");
const bibleRoutes = require("./routes/bibleRoutes.js");

const app = express();

// ============================================================================
// ENVIRONMENT & CONFIGURATION
// ============================================================================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

console.log(`🚀 [Server] Iniciando em modo: ${NODE_ENV}`);

// --- CONFIGURAÇÕES DO SERVIDOR ---
const allowedOrigins = [
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost:3000",
    "https://localhost",
    "https://biblestudyjourney.duckdns.org",
];

// ============================================================================
// MIDDLEWARES - Ordem otimizada para performance
// ============================================================================

// 1. Compressão (deve vir antes de outras respostas)
// (será adicionado após CORS)

// 2. Security Headers

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-src": ["'self'", "https://www.youtube.com"],
      "script-src": ["'self'", "https://www.youtube.com", "https://s.ytimg.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      "connect-src": ["'self'", "https://www.google-analytics.com", "https://biblestudyjourney.duckdns.org", "https://www.googleapis.com"],
      "img-src": ["'self'", "data:", "https://img.youtube.com", "https://i.ytimg.com"],
    },
  } )
);

app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'autoplay=(self "https://www.youtube.com" ), fullscreen=(self "https://www.youtube.com" ), picture-in-picture=(self "https://www.youtube.com" )');
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

// ============================================================================
// OTIMIZAÇÃO 1: COMPRESSÃO GZIP (Reduz 70% do tamanho das respostas)
// ============================================================================
app.use(compression({
  // Comprime apenas responses > 1KB
  threshold: 1024,
  
  // Nível de compressão (1-9, 6 é o padrão e melhor balanço)
  level: 6,
  
  // Filtro: não comprime streams ou já comprimidos
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

console.log('✅ [Performance] Gzip compression habilitado');

// ============================================================================
// OTIMIZAÇÃO 2: HTTP CACHE HEADERS (Reduz 30% das requisições)
// ============================================================================
app.use((req, res, next) => {
  const path = req.path;
  
  // Assets estáticos - cache agressivo por 1 ano
  if (path.match(/\.(jpg|jpeg|png|webp|gif|svg|ico|woff2?|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // CSS e JS - cache por 1 mês com revalidação
  else if (path.match(/\.(css|js)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000, must-revalidate');
  }
  
  // HTML - cache curto com revalidação
  else if (path.match(/\.html$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  
  // API - sem cache (dados dinâmicos)
  else if (path.startsWith('/api/') || path.startsWith('/auth/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

console.log('✅ [Performance] HTTP Cache Headers configurados');

// ============================================================================
// OTIMIZAÇÃO 3: PERFORMANCE MONITORING (Detecta rotas lentas)
// ============================================================================
if (!IS_PRODUCTION) {
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Log apenas requisições lentas (> 100ms)
      if (duration > 100) {
        console.warn(`⚠️ [SLOW] ${req.method} ${req.path} - ${duration}ms`);
      }
    });
    
    next();
  });
}

// --- ROTAS DA API ---

app.get('/api/video-info', async (req, res) => {
    const videoId = req.query.videoId;
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!videoId) return res.status(400).json({ error: 'O ID do vídeo é obrigatório.' });
    if (!YOUTUBE_API_KEY) {
        console.error("Chave da API do YouTube não encontrada. Verifique o arquivo .env");
        return res.status(500).json({ error: 'A chave da API do servidor não está configurada.' });
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails`;

    try {
        const youtubeResponse = await fetch(url );
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

app.use("/auth", authRoutes);

// --- ROTAS PROTEGIDAS ---
app.use("/api/user/progress", verifyToken, progressRoutes);
app.use("/api/bible", verifyToken, bibleRoutes);
app.use("/api/user/highlights", verifyToken, highlightsRoutes);
app.use("/api/user/chapters", verifyToken, chaptersRoutes);
app.use("/api/user/notes", verifyToken, notesRoutes);
app.use("/api/user/stats", verifyToken, statsRoutes);

// --- SERVIR ARQUIVOS ESTÁTICOS E PÁGINAS HTML ---
// Otimizado com cache headers e opções de performance
app.use(express.static(path.join(__dirname, "../www"), {
  maxAge: IS_PRODUCTION ? '30d' : 0,  // Cache de 30 dias em produção
  etag: true,                         // Habilita ETag para validação
  lastModified: true,                 // Habilita Last-Modified header
  immutable: IS_PRODUCTION            // Assets imutáveis em produção
}));

app.get("/cadastro", (req, res) => res.sendFile(path.join(__dirname, "../www/html/cadastro2.html")));
app.get("/home2", (req, res) => res.sendFile(path.join(__dirname, "../www/html/home2.html")));
app.get("/biblia", (req, res) => res.sendFile(path.join(__dirname, "../www/html/biblia.html")));
app.get("/saves", (req, res) => res.sendFile(path.join(__dirname, "../www/html/saves.html")));
app.get("/tl1-teologia", (req, res) => res.sendFile(path.join(__dirname, "../www/html/tl1-teologia.html")));
app.get("/tl2-teologia", (req, res) => res.sendFile(path.join(__dirname, "../www/html/tl2-teologia.html")));

// ============================================================================
// INICIAR O SERVIDOR - Com migração automática e health check
// ============================================================================
async function startServer() {
  try {
    // Executar migração automática do banco de dados
    console.log('🔄 Verificando/criando tabelas do banco de dados...');
    await runMigration();
    
    // Iniciar servidor
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Servidor Bible Study Journey iniciado com sucesso!`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 URL Local:  http://localhost:${PORT}`);
      console.log(`🔧 Ambiente:   ${NODE_ENV}`);
      console.log(`⚡ Otimizações:`);
      console.log(`   - Compressão Gzip habilitada (Level 6)`);
      console.log(`   - HTTP Cache Headers configurados`);
      console.log(`   - Connection Pool otimizado (min: 2, max: 20)`);
      console.log(`   - Migração automática do banco executada`);
      console.log(`   - Performance monitoring ${!IS_PRODUCTION ? 'ativo' : 'desabilitado'}`);
      console.log(`${'='.repeat(60)}\n`);

      // Gera o devocional de hoje e de amanhã em segundo plano (e a cada 6 horas)
      devotional.startScheduler();
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
