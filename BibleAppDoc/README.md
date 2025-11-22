# Bible Study Journey - Documentação Técnica

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-lightgrey.svg)

</div>

---

## 📋 Overview

**Bible Study Journey** é uma plataforma híbrida de estudo bíblico que resolve o problema da **fragmentação e superficialidade** no estudo das escrituras cristãs. 

### O Problema
Usuários alternam entre múltiplos aplicativos para realizar um estudo completo (apps de leitura + sites de comentários + ferramentas de hebraico/grego), resultando em perda de contexto e baixa profundidade teológica.

### A Solução
Plataforma unificada que integra:
- Leitura bíblica com 7 versões em português
- Trilhas de estudo guiadas (vídeos do YouTube)
- Devocionais diários gerados por LLM
- Sistema de anotações e destaques offline
- Ferramentas de personalização (temas, fontes)

### Por que essas tecnologias?
- **Capacitor**: Código único para Android, iOS e Web
- **Supabase**: Backend-as-a-Service com PostgreSQL, reduzindo overhead de infraestrutura
- **LocalForage**: Persistência offline robusta com fallback (IndexedDB → WebSQL → localStorage)
- **CloudFlare Workers AI**: Geração de conteúdo exegético sem custos de servidor próprio

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **HTML5/CSS3** | - | Estrutura e estilização |
| **JavaScript (ES6+)** | - | Lógica de aplicação |
| **Capacitor** | 6.x | Build híbrido (iOS/Android/Web) |
| **LocalForage** | 1.10+ | Storage offline (IndexedDB/WebSQL) |

### Backend
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **Node.js** | 18.x | Runtime |
| **Express** | 4.x | API REST |
| **PostgreSQL** | 15.x | Banco relacional (via Supabase) |
| **JWT** | - | Autenticação stateless |

### APIs Externas
- **Bible API** (versões NVI, ARA, NAA, ARC, TB, etc.)
- **YouTube Data API v3** (trilhas de estudo)
- **CloudFlare Workers AI** (geração de devocionais)

### DevOps
- **Oracle Cloud** (Always Free Tier - Compute Instance)
- **DuckDNS** (DNS dinâmico gratuito)
- **Let's Encrypt** (Certificados SSL)
- **Git/GitHub** (Controle de versão)

---

## 🏗️ Arquitetura e Design

### Padrão Arquitetural
O projeto segue uma **arquitetura híbrida**:
- **Frontend**: MVC implícito com separação de concerns (UI → Controller → Services)
- **Backend**: REST API com arquitetura em camadas (Routes → Controllers → Services → Database)

### Fluxo de Dados Principal

```mermaid
graph TB
    subgraph Client["📱 Client (Capacitor)"]
        UI[UI Layer<br/>HTML/CSS/JS]
        LocalDB[(LocalForage<br/>IndexedDB)]
    end
    
    subgraph Backend["☁️ Backend (Oracle Cloud)"]
        API[Express API<br/>Node.js]
        Auth[JWT Auth<br/>Middleware]
        DB[(Supabase<br/>PostgreSQL)]
    end
    
    subgraph External["🌐 External Services"]
        BibleAPI[Bible API<br/>7 Versões]
        YouTube[YouTube API<br/>Trilhas]
        LLM[CloudFlare AI<br/>Devocionais]
    end
    
    UI -->|Auth Request| API
    API -->|Validate| Auth
    Auth -->|Query| DB
    
    UI -->|Read/Write| LocalDB
    UI -->|Fetch Verses| BibleAPI
    UI -->|Load Videos| YouTube
    API -->|Generate Content| LLM
    
    style Client fill:#e1f5ff
    style Backend fill:#fff4e1
    style External fill:#f0e1ff
```

### Estrutura de Pastas

```
BibleStudyJourney/
├── www/                          # Frontend (Capacitor web assets)
│   ├── index.html                # Entry point
│   ├── css/
│   │   ├── styles.css            # Estilos globais
│   │   └── themes.css            # Sistema de temas (Light/Dark/Sépia)
│   ├── js/
│   │   ├── app.js                # Inicialização e roteamento
│   │   ├── auth.js               # Autenticação JWT
│   │   ├── bible.js              # Integração com Bible API
│   │   ├── devotional.js         # Devocionais (LLM)
│   │   ├── storage.js            # LocalForage wrapper
│   │   └── youtube.js            # Integração YouTube API
│   └── assets/
│       ├── icons/                # Ícones do app
│       └── images/               # Imagens estáticas
│
├── backend/                      # Backend (Node.js + Express)
│   ├── server.js                 # Entry point do servidor
│   ├── routes/
│   │   ├── auth.routes.js        # Rotas de autenticação
│   │   ├── user.routes.js        # Rotas de usuário
│   │   └── devotional.routes.js # Rotas de devocionais
│   ├── controllers/
│   │   ├── auth.controller.js    # Lógica de autenticação
│   │   └── user.controller.js    # Lógica de usuário
│   ├── services/
│   │   ├── jwt.service.js        # Geração/validação de tokens
│   │   └── llm.service.js        # Integração CloudFlare AI
│   ├── database/
│   │   └── supabase.js           # Conexão com Supabase
│   └── middleware/
│       ├── auth.middleware.js    # Validação JWT
│       └── error.middleware.js   # Tratamento de erros
│
├── capacitor.config.json         # Configuração Capacitor
├── package.json                  # Dependências Node.js
└── README.md                     # Documentação principal
```

### Decisões de Design

| Decisão | Justificativa |
|---------|---------------|
| **JWT em vez de sessões** | Stateless, ideal para mobile e escalabilidade horizontal |
| **LocalForage em vez de localStorage** | Suporte a grandes volumes de dados (IndexedDB) e fallback automático |
| **Supabase em vez de PostgreSQL puro** | Row-Level Security (RLS) nativo, redução de boilerplate de segurança |
| **Capacitor em vez de Cordova** | APIs modernas, melhor suporte a plugins nativos, comunidade ativa |
| **Temas via CSS Variables** | Performance superior a troca de classes, menos re-renders |

---

## 🚀 Pré-requisitos

### Desenvolvimento Local
```bash
# Obrigatório
Node.js >= 18.x
npm >= 9.x
Git >= 2.x

# Para build mobile (opcional)
Android Studio (Android)
Xcode (iOS - apenas macOS)
```

### Contas de Serviço Necessárias
- **Supabase** (banco de dados)
- **CloudFlare Workers** (devocionais AI)
- **YouTube Data API** (key gratuita)
- **Bible API** (depende da API escolhida)

---

## ⚙️ Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone https://github.com/guiibrag4/BibleStudyJourney.git
cd BibleStudyJourney
```

### 2. Instale Dependências
```bash
# Backend
cd backend
npm install

# Frontend (Capacitor)
cd ..
npm install
```

### 3. Configure Variáveis de Ambiente

#### Backend (`backend/.env`)
```env
# Servidor
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-publica
SUPABASE_DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-minimo-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CloudFlare Workers AI
CLOUDFLARE_ACCOUNT_ID=seu-account-id
CLOUDFLARE_API_TOKEN=seu-api-token

# APIs Externas
YOUTUBE_API_KEY=sua-youtube-api-key
BIBLE_API_KEY=sua-bible-api-key (se aplicável)
```

#### Frontend (`www/js/config.js`)
```javascript
const API_CONFIG = {
  BASE_URL: 'https://biblestudyjourney.duckdns.org/api',
  YOUTUBE_API_KEY: 'sua-youtube-api-key',
  BIBLE_API_URL: 'https://bible-api.com'
};
```

### Tabela de Variáveis de Ambiente

| Variável | Tipo | Obrigatório | Descrição | Exemplo |
|----------|------|-------------|-----------|---------|
| `PORT` | Number | ✅ | Porta do servidor backend | `3000` |
| `NODE_ENV` | String | ✅ | Ambiente de execução | `development`, `production` |
| `SUPABASE_URL` | String | ✅ | URL do projeto Supabase | `https://abc123.supabase.co` |
| `SUPABASE_KEY` | String | ✅ | Chave anon pública | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_DATABASE_URL` | String | ✅ | Connection string do PostgreSQL | `postgresql://user:pass@...` |
| `JWT_SECRET` | String | ✅ | Chave de assinatura JWT (min. 32 chars) | `MinhaChaveSuperSecreta123456` |
| `JWT_EXPIRES_IN` | String | ✅ | Tempo de expiração do token | `7d`, `24h` |
| `JWT_REFRESH_EXPIRES_IN` | String | ✅ | Tempo do refresh token | `30d` |
| `CLOUDFLARE_ACCOUNT_ID` | String | ✅ | ID da conta CloudFlare | `abc123def456` |
| `CLOUDFLARE_API_TOKEN` | String | ✅ | Token de acesso à Workers AI | `xyz789...` |
| `YOUTUBE_API_KEY` | String | ✅ | Chave da YouTube Data API v3 | `AIzaSyC...` |
| `BIBLE_API_KEY` | String | ❌ | Chave da API bíblica (se requer auth) | `abc123...` |

---

## 🧪 Testing

### Estratégia de Testes

Atualmente, o projeto adota **testes manuais** devido à natureza de MVP. Roadmap de testes:

**Fase Atual (Manual)**:
- ✅ Testes de integração com APIs externas
- ✅ Testes de fluxo de usuário (login → leitura → anotações)
- ✅ Testes de compatibilidade (Android/iOS/Web)

**Próxima Fase (Automated)**:
- 🔲 Unit tests com Jest (backend)
- 🔲 Integration tests com Supertest (API)
- 🔲 E2E tests com Playwright (frontend)

### Como Executar Testes (Futuro)

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration

# Frontend E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 📦 Deployment

### Arquitetura de Deploy

```mermaid
graph LR
    subgraph Dev["👨‍💻 Developer"]
        Code[Commit Code]
    end
    
    subgraph GitHub["🐙 GitHub"]
        Repo[Repository]
        Actions[GitHub Actions<br/>CI/CD]
    end
    
    subgraph Oracle["☁️ Oracle Cloud"]
        VM[Compute Instance<br/>Always Free]
        PM2[PM2 Process<br/>Manager]
        Nginx[Nginx Reverse<br/>Proxy]
    end
    
    subgraph CDN["🌐 Delivery"]
        DNS[DuckDNS<br/>biblestudyjourney]
        SSL[Let's Encrypt<br/>SSL/TLS]
    end
    
    Code -->|git push| Repo
    Repo -->|webhook| Actions
    Actions -->|SSH Deploy| VM
    VM --> PM2
    PM2 --> Nginx
    DNS --> SSL
    SSL --> Nginx
    
    style Dev fill:#e1f5ff
    style GitHub fill:#f0e1ff
    style Oracle fill:#fff4e1
    style CDN fill:#e1ffe1
```

### Deploy Manual (Atual)

#### 1. Preparar o Servidor (Oracle Cloud)
```bash
# Conectar ao servidor
ssh opc@seu-ip-oracle

# Instalar dependências
sudo yum install -y nodejs npm nginx git

# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 2. Deploy da Aplicação
```bash
# Clonar repositório
cd /var/www
sudo git clone https://github.com/guiibrag4/BibleStudyJourney.git
cd BibleStudyJourney/backend

# Instalar dependências
sudo npm install --production

# Configurar variáveis de ambiente
sudo nano .env
# (colar variáveis de produção)

# Iniciar com PM2
sudo pm2 start server.js --name bible-study
sudo pm2 save
sudo pm2 startup systemd
```

#### 3. Configurar Nginx
```nginx
# /etc/nginx/conf.d/biblestudyjourney.conf
server {
    listen 80;
    server_name biblestudyjourney.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Recarregar Nginx
sudo systemctl reload nginx

# Configurar SSL (Let's Encrypt)
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d biblestudyjourney.duckdns.org
```

#### 4. Deploy Frontend (Capacitor)

```bash
# Build para web
npm run build

# Build para Android
npx cap sync android
npx cap open android
# (Gerar APK no Android Studio)

# Build para iOS
npx cap sync ios
npx cap open ios
# (Gerar IPA no Xcode)
```

### Deploy Automatizado (Roadmap)

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Oracle Cloud

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.ORACLE_HOST }}
          username: opc
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/BibleStudyJourney
            git pull origin main
            cd backend
            npm install --production
            pm2 restart bible-study
```

---

## 🔒 Segurança

### Práticas Implementadas
- ✅ **JWT com Refresh Tokens** (rotação automática)
- ✅ **HTTPS obrigatório** (Let's Encrypt)
- ✅ **Environment Variables** (secrets fora do código)
- ✅ **Row-Level Security** (Supabase RLS policies)
- ✅ **Rate Limiting** (proteção contra brute-force)
- ✅ **CORS configurado** (whitelist de domínios)

### Checklist de Segurança
- [ ] Implementar Content Security Policy (CSP)
- [ ] Adicionar helmet.js no Express
- [ ] Configurar logging centralizado
- [ ] Implementar rotação automática de tokens
- [ ] Adicionar 2FA para usuários premium

---

## 📊 Monitoramento

### Métricas Atuais (Manual)
- Logs do PM2: `pm2 logs bible-study`
- Logs do Nginx: `/var/log/nginx/access.log`
- Monitoramento de recursos: `pm2 monit`

### Próximos Passos
- Integração com Sentry (error tracking)
- Implementar APM com New Relic / Datadog
- Dashboard de métricas de negócio (usuários ativos, retenção)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📞 Contato

**Guilherme Braga Rios da Costa**
- Email: [contato do desenvolvedor]
- LinkedIn: [perfil do desenvolvedor]
- GitHub: [@guiibrag4](https://github.com/guiibrag4)

---

## 🙏 Agradecimentos

- Comunidade cristã que forneceu feedback durante os testes
- APIs públicas de bíblia que tornam o projeto possível
- Ferramentas de IA que auxiliaram no desenvolvimento (ChatGPT, Claude, Gemini, Manus AI, GitHub Copilot)

---

<div align="center">

**[⬆ Voltar ao topo](#bible-study-journey---documentação-técnica)**

Feito com ❤️ e ☕ por Guilherme Braga

</div>