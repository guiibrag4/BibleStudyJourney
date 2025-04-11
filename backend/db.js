const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT),
});

pool.connect()
  .then(() => console.log("📡 Conectado ao PostgreSQL!"))
  .catch(err => console.error("❌ Erro ao conectar no banco:", err));

module.exports = pool;