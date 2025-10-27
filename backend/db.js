const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectionString = process.env.SUPABASE_DATABASE_URL;

// Verifica se a connectionString foi carregada antes de criar o Pool
if (!connectionString) {
  console.error("❌ Erro Fatal: A variável SUPABASE_DATABASE_URL não foi encontrada no arquivo .env");
  process.exit(1); // Encerra a aplicação se o banco não pode ser conectado
}

const sslOption =
  process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'true' }
    : false;

// ============================================================================
// CONNECTION POOL OTIMIZADO - Performance Enhancement
// ============================================================================
const pool = new Pool({
  connectionString: connectionString,
  ssl: sslOption,
  
  // Pool Configuration (otimizado para performance)
  min: 2,                          // Mínimo de conexões sempre abertas
  max: 20,                         // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,        // Fecha conexões idle após 30s
  connectionTimeoutMillis: 5000,   // Timeout para obter conexão do pool
  
  // Query Performance
  statement_timeout: 10000,        // Timeout de query: 10s (previne queries travadas)
  query_timeout: 10000,            // Timeout geral de query
  
  // Network Optimization
  keepAlive: true,                 // Mantém conexão viva (previne timeout de rede)
  keepAliveInitialDelayMillis: 10000, // Delay inicial do keepalive
  
  // Application Name (para identificação no pg_stat_activity)
  application_name: 'BibleStudyJourney'
});

// ============================================================================
// EVENT LISTENERS - Monitoring & Logging
// ============================================================================

// Log quando nova conexão é criada
pool.on('connect', (client) => {
  console.log('📡 [DB Pool] Nova conexão criada');
});

// Log quando conexão é adquirida do pool
pool.on('acquire', (client) => {
  console.log('🔓 [DB Pool] Conexão adquirida do pool');
});

// Log quando conexão é removida do pool
pool.on('remove', (client) => {
  console.log('🗑️ [DB Pool] Conexão removida do pool');
});

// Handler de erros inesperados
pool.on('error', (err, client) => {
  console.error('❌ [DB Pool] Erro inesperado na conexão idle:', err);
  process.exit(-1); // Exit em caso de erro crítico
});

// ============================================================================
// GRACEFUL SHUTDOWN - Fecha conexões adequadamente
// ============================================================================
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 [DB Pool] Recebido sinal ${signal}, fechando conexões...`);
  
  try {
    await pool.end();
    console.log('✅ [DB Pool] Todas as conexões fechadas com sucesso');
    process.exit(0);
  } catch (err) {
    console.error('❌ [DB Pool] Erro ao fechar conexões:', err);
    process.exit(1);
  }
};

// Registra handlers para sinais de encerramento
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// HEALTH CHECK - Verifica conexão inicial
// ============================================================================

// ============================================================================
// HEALTH CHECK - Verifica conexão inicial
// ============================================================================
pool.connect()
  .then((client) => {
    console.log("✅ [DB Pool] Conectado ao PostgreSQL com sucesso!");
    console.log(`📊 [DB Pool] Configuração: min=${pool.options.min}, max=${pool.options.max}`);
    client.release(); // Importante: libera a conexão de volta ao pool
  })
  .catch(err => {
    console.error("❌ [DB Pool] Erro ao conectar no banco:", err);
    process.exit(1);
  });

// ============================================================================
// POOL STATS - Função auxiliar para monitoramento (opcional)
// ============================================================================
pool.getStats = function() {
  return {
    totalCount: this.totalCount,     // Total de conexões
    idleCount: this.idleCount,       // Conexões idle
    waitingCount: this.waitingCount  // Clientes aguardando conexão
  };
};

module.exports = pool;