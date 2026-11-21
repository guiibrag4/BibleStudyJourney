# Plano de Reativação — Bible Study Journey (novembro/2026)

> Diagnóstico de 21/11/2026, feito a partir do código (commit `1020d11`), do servidor de produção e de fontes públicas (links no fim).
> Os detalhes sensíveis de acesso e segurança ficam em `notes.md`, na raiz do projeto, que o `.gitignore` já exclui. Não traga esse conteúdo para cá: o repositório é público.

---

## 1. Resumo

### Estado atual

- **O app está no ar**, mas o núcleo parou. O site https://biblestudyjourney.duckdns.org (Oracle Cloud) responde, e o frontend em produção é idêntico ao último commit: os 49 arquivos de `www/` conferem. Só que a leitura, a busca, o versículo aleatório e o devocional dependem da API **A Bíblia Digital**, que o autor desativou em **01/08/2026** ("Site e APIs desativados desde 01/08/2026").
- **O modelo de IA do devocional foi descontinuado.** O app usa o Cloudflare Workers AI com `@cf/meta/llama-3.1-8b-instruct-awq`. Esse modelo e o primeiro fallback (`@cf/meta/llama-3.1-8b-instruct`) foram descontinuados em **30/05/2026**. Só o segundo fallback (`@cf/openai/gpt-oss-20b`) continua ativo, mas o devocional nem chega à IA: ele falha antes, ao buscar o versículo.
- **O ambiente de staging não responde.** O serviço no Render (`biblestudyjourney-v2.onrender.com`) ficou mais de 100 s sem resposta; deve estar suspenso.
- **A sequência de dias (streak) do devocional nunca passa de 1.** É um bug de SQL (ver seção 7), e por causa dele as conquistas de 3, 7, 14, 30 e 100 dias nunca são desbloqueadas.

### As quatro decisões recomendadas

1. **Texto bíblico local, com licença aberta e disponível offline**, para o app não depender de uma API externa. Para as versões que exigem licença (NVI, NVT etc.), usar a **YouVersion Platform**.
2. **TypeScript no projeto inteiro e Expo (React Native) no app.** Um único código gera Android, iOS e web, e o build do iOS é feito na nuvem, sem precisar de Mac.
3. **Supabase completo** (Auth com Google/Apple, Postgres com RLS, Edge Functions e cron) no lugar do Express na VM com JWT próprio.
4. **Posicionamento: "o app que te ensina a estudar a Bíblia, não só a ler".** Estudo guiado em camadas, com a IA no papel de tutora, não de oráculo.

---

## 2. Mapa do projeto hoje

| Peça | Onde está | Status em 21/11/2026 |
|---|---|---|
| Código | GitHub `guiibrag4/BibleStudyJourney` (**público**) | 172 commits; o último é de 28/12/2025 |
| Frontend | `www/`: HTML, CSS e JS puro em 13 páginas, servidas pelo Express | Produção igual ao último commit |
| App Android | `android/`: Capacitor 7, `com.biblestudyjourney.app`, `targetSdk 35` | Sem iOS; versionCode 1 |
| Backend | `backend/`: Node + Express 5, JWT próprio, rotas `/auth` e `/api/*` | Rodando (nginx na frente do Express) |
| Produção | VM Always Free na Oracle Cloud (Ubuntu + nginx), DuckDNS e Let's Encrypt | Online |
| Staging | Render | Não responde |
| Banco | Postgres no Supabase (us-east-1, pooler na porta 6543), schema `bible_study_app` | Confira no dashboard se o projeto não foi pausado |
| Texto bíblico | A Bíblia Digital, via proxy em `backend/routes/bibleRoutes.js` | **Desativada em 01/08/2026** |
| IA | Cloudflare Workers AI (`llama-3.1-8b-instruct-awq` e fallbacks) | Modelo principal descontinuado em 30/05/2026 |
| Vídeos das trilhas | YouTube Data API v3 (`/api/video-info`) | Chave no `.env` |

### Como rodar localmente (Windows/PowerShell)

```powershell
cd "C:\Users\Guilherme\Dev\BibleStudy - Ofc"
npm install
npm start   # roda node backend/server.js; abra http://localhost:3000
```

- O `.env` fica em `backend/.env`; o modelo das variáveis está em `.env.example`.
- `npm run dev` e `npm run prod` usam a sintaxe `NODE_ENV=... node`, que não funciona no PowerShell. Rode `$env:NODE_ENV='development'; npm start` ou adote o `cross-env`.
- Mesmo localmente, a leitura da Bíblia vai falhar enquanto a fonte do texto não for trocada (ver seção 8, Fase 0).

Para o app Android:

```powershell
npx cap sync android
npx cap open android   # abre no Android Studio
```

O app nativo sempre usa a URL de produção (ver `www/js/config.js`).

---

## 3. A IA do devocional

### Como funciona hoje

1. A primeira requisição do dia chama `GET /api/bible/devotional/daily`. O "dia" do devocional vira às 05h, horário de Brasília.
2. O backend sorteia um versículo na A Bíblia Digital, pede à IA um JSON com `estudo`, `reflexao` e `aplicacao` e grava o resultado em `bible_study_app.devocional_diario_global`.
3. Todos os usuários recebem o mesmo devocional: é um cache global, com uma chamada de IA por dia.

Esse cache global foi uma ótima decisão, porque o custo de IA não cresce com o número de usuários. E ele muda a conta do modelo: **com uma geração por dia, dá para usar o melhor modelo disponível**.

### Problemas

- A fonte do versículo saiu do ar, então toda geração falha (HTTP 502) desde 01/08/2026.
- Os dois modelos Llama 3.1 8B foram descontinuados.
- Um versículo sorteado e isolado contraria a missão do app ("texto sem contexto"). O sorteio pode cair numa genealogia ou num versículo que só faz sentido dentro da perícope.
- Um modelo pequeno (8B) escrevendo conteúdo teológico em português tem risco alto de erro factual e doutrinário.
- A geração acontece na primeira visita do dia, o que a torna lenta e frágil.
- O JSON da resposta é "consertado" com regex (`parseDevotionalOutput`), e, se nada funcionar, o app mostra um texto genérico.
- Não há revisão humana antes da publicação.

### Recomendação

1. **Um plano editorial em vez de sorteio.** Uma tabela define a passagem de cada dia, sempre uma perícope completa (ex.: Lc 15.11-32), seguindo um plano (Evangelhos, Salmos, narrativas) e o calendário cristão.
2. **Gerar com antecedência.** Um cron semanal gera os próximos 7 dias como `rascunho`: pode ser `pg_cron` com uma Edge Function no Supabase, ou um Cloudflare Worker com Cron Trigger. Você revisa e aprova, e o app mostra só o que está `aprovado`.
3. **Dar contexto ao modelo.** O prompt leva a perícope inteira, a introdução do livro (autor, data, destinatários, gênero) e as referências cruzadas. Peça que cada afirmação aponte um versículo e confira as referências citadas contra o banco local.
4. **Saída estruturada.** Use JSON Schema, structured outputs ou tool calling no lugar de regex.
5. **Escolher o modelo por teste, não por palpite.** Rode 10 passagens em 3 modelos e avalie com uma rubrica: fidelidade ao texto, contexto histórico correto, ausência de eisegese, português natural e referências válidas. Candidatos:
   - **Na própria Cloudflare** (troca de uma linha no `.env`): `@cf/openai/gpt-oss-120b`, a US$ 0,35 por milhão de tokens de entrada e US$ 0,75 por milhão de saída, ou `@cf/zai-org/glm-4.7-flash`, multilíngue, a US$ 0,06 e US$ 0,40.
   - **Modelos de ponta via API**, como o Claude Sonnet 5.5 ou equivalentes da OpenAI e do Google. Com uma geração por dia, o custo fica em poucos dólares por mês mesmo no modelo mais caro.
6. **Uma camada de provedor.** Uma função `generateStudy(passagem)` com adaptadores permite trocar de modelo sem mexer nas rotas. A Cloudflare acabou de descontinuar 18 modelos de uma vez.
7. **IA interativa por usuário** (perguntas sobre um versículo): use um modelo mais barato, um cache por passagem (muita gente estuda a passagem do dia) e um limite diário no plano gratuito.

Referência de custo da Cloudflare: 10.000 neurons por dia são grátis; acima disso, o plano Workers Paid cobra US$ 0,011 por 1.000 neurons.

---

## 4. Nova fonte do texto bíblico

A lição desse episódio: o app inteiro dependia de uma API gratuita de terceiros. A estratégia nova tem duas camadas.

### Camada 1: Bíblia local, aberta e offline (a base do app)

| Versão | Licença | Cobertura | Observação |
|---|---|---|---|
| Bíblia Livre (BLIVRE, 2018) | CC BY 4.0 | AT + NT | Linguagem formal, da família Almeida |
| Biblica Open Nova Bíblia Viva (2007) | CC BY-SA 4.0 | AT + NT | Linguagem contemporânea |
| Bíblia Portuguesa Mundial | Domínio público | AT + NT | |
| Bíblia Livre Para Todos | CC BY-SA 4.0 | Só NT | |
| KJV, WEB e BSB (inglês) | Domínio público | AT + NT | Para comparar versões |

Onde baixar: no eBible.org ou na **Free Use Bible API** (`bible.helloao.org`), que não pede chave, não tem limite de uso e oferece 1.518 traduções. Dá para baixar os JSON uma única vez e gerar o banco a partir deles.

- **No app novo:** um SQLite empacotado (`expo-sqlite`) com busca FTS5, para a leitura e a busca serem instantâneas e funcionarem offline.
- **No backend atual (feito na Fase 0):** arquivos `backend/data/bible/<versao>.json.gz` (cerca de 1,2 MB cada), gerados por `npm run build:bible` e carregados em memória. Não dependem do banco nem de rede.
- **Atribuição:** CC BY e CC BY-SA exigem citar a versão e a licença; mostre isso na tela "Sobre" e no rodapé do capítulo. Não modifique o texto: na CC BY-SA, qualquer modificação precisa sair com a mesma licença.

### Camada 2: versões populares licenciadas (NVI, NVT, NAA, ARA, ARC, NTLH)

Essas versões têm direitos autorais (Biblica, SBB, Mundo Cristão e outras editoras). Há três caminhos:

- **YouVersion Platform (recomendado).**
  - É gratuita. Cada app recebe uma chave (`X-YVP-App-Key`) e precisa aceitar no portal a licença de cada versão que for usar.
  - Tem SDKs para JavaScript/TypeScript, React, **React Native (Expo)**, Swift e Kotlin.
  - Oferece endpoints de passagem, capítulo e versículo, versículo do dia, busca, imagens de versículo, grifos e notas.
  - Exige exibir a atribuição da versão e limita as requisições por chave; o limite exato não é publicado.
  - Antes de decidir, confirme nos termos: se o uso comercial com assinatura é permitido, quais são as regras de cache e uso offline, e quais versões em português a sua organização consegue licenciar (`GET /v1/bibles?language_ranges[]=pt`).
- **API.Bible (American Bible Society).** A licença de cada versão aparece nos metadados. Um app que tenha receita, anúncios ou cobrança precisa do plano comercial.
- **Licenciar direto com a editora** (SBB, Biblica, Mundo Cristão), quando o app tiver tração.

**Não faça:** hospedar você mesmo arquivos JSON da NVI, ACF ou ARA encontrados no GitHub, inclusive os que a A Bíblia Digital usava. O código da A Bíblia Digital é open source (BSD-2), mas o texto dessas versões não é, e isso pode tirar o app da loja.

### Arquitetura

```
BibleProvider (interface)
 ├─ LocalProvider      → SQLite/Postgres com as versões abertas (padrão, offline)
 └─ YouVersionProvider → versões licenciadas (online, com o cache que os termos permitirem)
```

Todas as referências internas usam códigos USFM (`GEN`, `JHN`...) no formato `JHN.3.16`, o mesmo da YouVersion. Isso também resolve o velho problema das abreviações (`gn`, `jo`...).

### Dados abertos para a profundidade (o diferencial)

| Dado | Fonte | Licença |
|---|---|---|
| Hebraico e grego com morfologia, e léxicos | STEPBible Data (Tyndale House) | CC BY 4.0 |
| Referências cruzadas | OpenBible.info | CC BY |
| Lugares bíblicos com coordenadas (para mapas) | OpenBible.info Bible Geocoding | CC BY 4.0 |

---

## 5. Linguagem, stack e portabilidade

### O que pesa hoje

- São 13 páginas HTML que recarregam por inteiro a cada navegação, com o menu duplicado e o estado em variáveis globais. Alguns arquivos passam de 1.000 linhas (`saves.js`, `biblia.js`).
- Não há TypeScript, testes nem CI, e o deploy é manual, por SSH.
- O app existe só para Android; o iOS exigiria um Mac.
- Você mantém sozinho o backend e toda a infraestrutura: VM, nginx, certbot, PM2 e DuckDNS.

### Recomendação: TypeScript, Expo (React Native) e Supabase

| Camada | Hoje | Proposta | Por quê |
|---|---|---|---|
| Linguagem | JavaScript | **TypeScript** | É a mesma linguagem, com tipos: menos erros de `undefined` e refatoração segura |
| App | Capacitor com HTML/JS | **Expo (React Native) + Expo Router** | Um código para Android, iOS e web; build do iOS na nuvem (EAS Build), sem Mac; atualização OTA (EAS Update); notificações, widgets e SQLite nativos; SDK oficial da YouVersion |
| Dados no app | LocalForage | **SQLite (`expo-sqlite`)** | Bíblia offline, busca FTS5 e fila de sincronização |
| Backend | Express na VM da Oracle | **Supabase** (Auth, Postgres + RLS, Storage, Edge Functions e cron) | Elimina o JWT próprio, a VM e os certificados; login Google/Apple e "esqueci a senha" já vêm prontos |
| IA | Chamada direta no Express | **Edge Function ou Worker**, com a camada de provedor | Trocar de modelo sem atualizar o app |
| Domínio | DuckDNS | **Domínio próprio** (`.com.br`) | Links que abrem o app, e-mails de conta, política de privacidade e marca |
| Site | Não existe | **Landing e páginas públicas de estudo** (Next.js, Astro ou Expo web) | SEO: buscas como "Salmo 23 explicação" viram canal de aquisição |
| Qualidade | Testes manuais | Vitest, Maestro (E2E), GitHub Actions, Sentry e PostHog | Medir retenção e não quebrar o que já funciona |

**Alternativa de menor esforço:** manter o Capacitor e migrar só o frontend para React, Vite e TypeScript. Faz sentido se a prioridade for relançar rápido no Android; o iOS continuaria exigindo um Mac ou uma CI com macOS.

Estrutura sugerida, em monorepo com pnpm e Turborepo:

```
apps/mobile      Expo (Android/iOS/web)
apps/site        landing, páginas públicas de estudo, política de privacidade
packages/bible   livros, referências (JHN.3.16), parser de "Jo 3:16", provedores
packages/db      tipos gerados do Supabase
supabase/        migrations, políticas de RLS, edge functions (IA e cron)
```

**Migração dos dados.** As tabelas `usuario`, `grifado`, `anotacoes`, `paginasalva`, `livros_lidos`, `progressovideos` e `devocional_*` passam a se ligar a `auth.users`, com RLS (`user_id = auth.uid()`). As senhas atuais estão em bcrypt: veja na documentação do Supabase Auth como importar usuários com hash, ou peça a redefinição de senha no primeiro acesso.

**Supabase:** no plano gratuito, projetos inativos são pausados. Para produção com usuários, avalie o plano pago.

### Lojas

- **Google Play.**
  - Desde 31/08/2026, apps novos e atualizações precisam de **`targetSdk 36`**; o projeto está em 35.
  - Contas pessoais criadas depois de 13/11/2023 só publicam depois de um **teste fechado com pelo menos 12 testadores por 14 dias seguidos**. Dá para recrutar esses testadores na igreja ou na EBD.
- **Exigências comuns às lojas:** política de privacidade (LGPD), **exclusão de conta dentro do app e por um link na web**, e o formulário de segurança de dados.
- **Apple:** exige o Apple Developer Program. Com o EAS, o build e o envio saem do Windows.

---

## 6. Produto: diferencial, experiência e retenção

### Posicionamento

A sua validação de negócio já encontrou o espaço vazio. De um lado ficam os apps **acessíveis, mas rasos** (leitura e devocional); do outro, as ferramentas **profundas, mas complexas** (e-Sword e similares). E o aprendizado mais forte dos testes foi que o app "dá um norte e organização de temas". Ou seja, o valor está em **estrutura e orientação**, não em ser mais uma Bíblia.

**Proposta de valor:** *o app que te ensina a estudar a Bíblia, com contexto e passo a passo.*

### Diferenciais (as funcionalidades-assinatura)

1. **Estudo guiado em três passos (Observar, Interpretar, Aplicar)** para cada passagem.
   - **Observar:** perguntas curtas, como "Quem fala?", "Para quem?" e "Que palavra se repete?".
   - **Interpretar:** o contexto do livro (autor, data, destinatários, gênero), as palavras-chave no original e as referências cruzadas.
   - **Aplicar:** uma pergunta de reflexão e uma ação para o dia; a resposta vira anotação.
   - **IA como tutora socrática:** ela comenta a resposta do usuário, mostra o que o texto diz e indica onde olhar, em vez de entregar uma interpretação pronta. Isso combina com a missão de combater a eisegese.
2. **Camadas de profundidade por toque.** A leitura é limpa por padrão. Tocar num versículo abre um painel com as abas *Contexto · Original · Referências · Comentário · Minhas notas*. O iniciante não se assusta, e quem quer profundidade encontra tudo num lugar só.
3. **Trilhas com professores no formato de curso.** Cada aula reúne o vídeo, os versículos citados ligados ao texto, 3 perguntas, o progresso e um certificado no fim. Formalize parcerias com os professores: hoje o app usa nomes e fotos deles, e sem autorização isso é risco de direito de imagem e de remoção da loja.
4. **Modo Turma (EBD e pequenos grupos).** O líder cria a turma, escolhe o plano ou a lição da semana e acompanha quem leu e as respostas compartilhadas. Isso gera retenção social e abre um canal de aquisição pelas igrejas; é o "programa de embaixadores" do seu plano de negócio virando funcionalidade.
5. **Mapa da Jornada.** A Bíblia aparece como uma trilha visual (Criação → Patriarcas → Êxodo → Reino → Exílio → Jesus → Igreja → Nova Criação), e cada capítulo lido acende o caminho. Isso dá identidade ao nome "Journey" e mostra o progresso de longo prazo.

### Retenção: hábito sem culpa

- **Valor antes do cadastro.** A pessoa abre o app e já lê e estuda. A conta serve só para salvar e sincronizar, com login Google ou Apple em um toque.
- **Onboarding de 3 perguntas** (objetivo, minutos por dia e nível), que gera um plano sugerido automaticamente.
- **Planos de leitura:** Bíblia em 1 ano, NT em 90 dias, temáticos (ansiedade, perdão, oração) e sazonais (Quaresma, Advento). São o principal motivo de retorno diário em apps bíblicos.
- **Lembrete no horário que a pessoa escolher**, com o próprio versículo no texto da notificação e no máximo um por dia. A notificação local não precisa de servidor.
- **Constância gentil.** Uma meta semanal (ex.: 5 de 7 dias) e um "dia de graça", em vez de zerar tudo quando a pessoa perde um dia. Antes disso, é preciso corrigir o cálculo atual (seção 7).
- **Widget na tela inicial** com o versículo do dia.
- **Memorização com repetição espaçada:** revisões de um minuto dos versículos-chave do plano.
- **Resumo semanal** com capítulos lidos, notas e constância.
- **Valor acumulado.** Notas, grifos e respostas formam um "diário de estudo" pesquisável e exportável em PDF; quanto mais a pessoa usa, mais o app vale para ela.
- **Compartilhamento com retorno.** As imagens de versículo, que já existem, levam um link que abre o app na mesma passagem.

### Métricas para instrumentar desde o primeiro dia (PostHog ou Firebase Analytics)

- Ativação: % de quem conclui o primeiro estudo no primeiro dia.
- Retenção D1, D7 e D30 por coorte, e DAU/MAU.
- % de usuários com lembrete ativo, e planos iniciados × concluídos.
- Uso do estudo guiado e da IA.

### Monetização (sem colocar a Bíblia atrás de um paywall)

- **Grátis:** Bíblia, planos, devocional, notas, grifos e lembretes.
- **Premium (assinatura):** IA tutora sem limite, camadas avançadas (original e comentários licenciados), trilhas com certificado e exportação do diário.
- **Plano Igreja:** a igreja paga e libera o Premium para as turmas.
- **Ofertas e doações:** atenção às regras do Google Play e da App Store para pagamentos e doações dentro do app.

---

## 7. Correções no código atual

| Prioridade | Problema | Onde | Correção |
|---|---|---|---|
| 🔴 | Leitura, busca, versículo aleatório e devocional quebrados | `backend/routes/bibleRoutes.js` | Bíblia local (seção 4) |
| 🔴 | Modelo de IA descontinuado | `backend/.env` (`CLOUDFLARE_AI_MODEL`) | Trocar o modelo (seção 3) |
| 🔴 | Parte da troca de segredos ainda pendente | `notes.md` (fora do git) | Ver o arquivo |
| 🟠 | O streak atual nunca passa de 1: com o `LAG` ordenado de forma decrescente, `day_key = dia_anterior + 1 dia` nunca é verdade. Num teste com 7 dias seguidos, o resultado foi 1 | `bibleRoutes.js`, rotas `mark-read` e `stats` | Usar a mesma técnica de "ilhas" da consulta de maior streak e comparar com o `day_key` de hoje, não com `CURRENT_DATE` (que está em UTC) |
| 🟠 | Sem `DB_SSL` definido, a conexão com o Postgres não usa SSL | `backend/db.js:14` | `DB_SSL=true` |
| 🟠 | Nenhum limite de tentativas no login | `backend/routes/auth/auth.js` | `express-rate-limit`, ou o Supabase Auth |
| 🟠 | Não existe "esqueci minha senha", e o botão "Continuar com o Google" não faz nada (já removido do login e do cadastro; ainda aparece em `formacadastro.html`) | `formacadastro.html` | Supabase Auth, ou remover o botão |
| 🟠 | Não há exclusão de conta nem política de privacidade | App | Exigidas pelas lojas e pela LGPD |
| 🟡 | É preciso fazer login para ler a Bíblia | `www/js/auth-guard.js`; `/api/bible` usa `verifyToken` em `server.js` | Liberar a leitura sem login |
| 🟡 | Splash fixo de 2,5 s a cada abertura do app | `www/index.html` | Remover o `setTimeout` |
| 🟡 | Zoom bloqueado (`user-scalable=no`) | `www/index.html` | Remover, por acessibilidade |
| 🟡 | O Render, fora do ar, continua listado no CORS, na CSP e no `config.js` | `backend/server.js`, `www/js/config.js` | Remover, ou recriar o staging |
| 🟡 | `npm run dev` não funciona no Windows | `package.json` | `cross-env` |
| 🟡 | `targetSdk` 35 | `android/variables.gradle` | Subir para 36 |
| 🟡 | A documentação cita rate limit, refresh token e RLS, que o código não tem | `docs/`, `BibleAppDoc/README.md` | Atualizar a documentação |
| 🟡 | O `package.json` ainda tem o nome e a descrição do template do Cordova | `package.json` | Renomear |

---

## 8. Roteiro

### Fase 0: religar e proteger (1 a 2 semanas)

**Já feito no código (branch `fase0/biblia-local-e-ia`, 21/11/2026):**
- Bíblia local com seis versões abertas: Bíblia Livre, Nova Bíblia Viva (Biblica Open), Bíblia Portuguesa Mundial, KJV, BSB e Reina-Valera 1909. As respostas saem no mesmo JSON da A Bíblia Digital. As versões antigas (`nvi`, `acf`, `ra`...) são redirecionadas para a Bíblia Livre, e o crédito da versão aparece no fim do capítulo.
- Busca por palavra inteira, sem diferenciar acentos. O versículo do dia agora sorteia entre 127 versículos selecionados, em vez da Bíblia inteira.
- Devocional:
  - segue um plano editorial de 100 passagens (`backend/data/plano-devocional.js`);
  - a IA recebe a passagem completa como contexto e responde em saída estruturada, com `gpt-oss-120b`;
  - modelos descontinuados são pulados automaticamente;
  - o devocional de hoje e o de amanhã são gerados com antecedência.
- Grifos e notas voltaram a salvar: faltavam dois índices únicos no banco desde a migração de dezembro de 2025. Agora a migração de inicialização do servidor os cria.
- Telas de login e de cadastro redesenhadas: foto e versículo no desktop, erros dentro do formulário, mostrar/ocultar senha.
- Correções: o cálculo do streak (testado em Postgres), as abreviações de Habacuque, Hebreus e Filemom, o SSL ligado por padrão no Supabase e a remoção do Render e da A Bíblia Digital do CORS e da CSP.

**Falta fazer (depende de você):**
1. Terminar a troca de segredos (ver `notes.md`). O `JWT_SECRET` já foi trocado.
2. Fazer backup do Supabase (já reativado) e criar o Secret do workflow de keep-alive.
3. Publicar no servidor e rodar `npx cap sync android`. O `CLOUDFLARE_AI_MODEL` já foi atualizado no local e no servidor.
4. Descobrir por que o "salvar capítulo" não grava (a rota do servidor não registra erro).
5. Criar um passo de revisão humana do devocional. A IA ainda erra detalhes; num teste, situou Lucas 15 "na Galileia".
6. Ouvir de 10 a 20 usuários reais (igreja, EBD) antes de construir a v2.

### Fase 1: fundação da v2 (6 a 8 semanas)

Monorepo em TypeScript; app Expo com leitor offline (SQLite + FTS5); Supabase Auth com Google e Apple; sincronização de notas e grifos; onboarding de 3 perguntas; planos de leitura; lembretes; analytics e Sentry. Fechar com um beta fechado no Google Play.

### Fase 2: diferencial (6 a 10 semanas)

Estudo guiado com a IA tutora; painel de camadas (contexto de cada livro, original via STEPBible, referências cruzadas, mapas); trilhas no formato de curso; Mapa da Jornada; widget.

### Fase 3: crescimento (contínuo)

Modo Turma/EBD; versões licenciadas via YouVersion; site com páginas públicas de estudo para SEO; Premium e Plano Igreja; iOS.

---

## 9. Decisões em aberto

1. Expo (recomendado) ou Capacitor com React?
2. Supabase completo (recomendado) ou manter o Express na VM da Oracle?
3. Quais versões licenciadas buscar primeiro (NVI? NVT? NAA?). Pergunte ao seu público o que ele usa.
4. Lançar com ofertas e doações, ou já com o Premium?

---

## Fontes

- A Bíblia Digital, aviso de desativação: <https://github.com/omarciovsena/abibliadigital/commit/8f28283cc75a68afd3b317c1c028a3ff84f3656b>
- Cloudflare, modelos descontinuados em 30/05/2026: <https://developers.cloudflare.com/changelog/post/2026-05-08-planned-model-deprecations/>
- Cloudflare, preços do Workers AI: <https://developers.cloudflare.com/workers-ai/platform/pricing/>
- YouVersion Platform: <https://platform.youversion.com/>; documentação: <https://developers.youversion.com/api-usage>
- API.Bible, termos de uso: <https://api.bible/terms-and-conditions>
- Free Use Bible API: <https://github.com/HelloAOLab/bible-api>
- eBible.org, licenças das versões em português: <https://ebible.org/Scriptures/details.php?id=porbr2018>, <https://ebible.org/Scriptures/details.php?id=poronbv>, <https://ebible.org/Scriptures/details.php?id=porbrbsl>
- STEPBible Data: <https://github.com/STEPBible/STEPBible-Data>
- OpenBible.info, referências cruzadas: <https://www.openbible.info/labs/cross-references/>
- Google Play, nível de API exigido: <https://support.google.com/googleplay/android-developer/answer/11926878>
- Google Play, teste fechado para contas pessoais novas: <https://support.google.com/googleplay/android-developer/answer/14151465>
