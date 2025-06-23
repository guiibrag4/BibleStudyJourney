const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectionString = process.env.SUPABASE_DATABASE_URL;

// Verifica se a connectionString foi carregada antes de criar o Pool
if (!connectionString) {
  console.error("❌ Erro Fatal: A variável SUPABASE_DATABASE_URL não foi encontrada no arquivo .env");
  process.exit(1); // Encerra a aplicação se o banco não pode ser conectado
}

const pool = new Pool({
  connectionString: connectionString,
  host: 'seu-host-do-banco.com',
});

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASS,
//   port: parseInt(process.env.DB_PORT),
// });

pool.connect()
  .then(() => console.log("📡 Conectado ao PostgreSQL!"))
  .catch(err => console.error("❌ Erro ao conectar no banco:", err));

module.exports = pool;