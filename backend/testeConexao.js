require('dotenv').config();
const pool = require('./config/db');

async function testarConexao() {
  try {
    // Testar conexão
    const resultado = await pool.query('SELECT NOW()');
    console.log("✅ Conexão bem-sucedida! Hora atual do banco:", resultado.rows[0].now);

    // Buscar os usuários
    const usuario = await pool.query('SELECT * FROM app_biblia.usuario');
    
    if (usuario.rows.length > 0) {
      console.log("👥 Lista de usuários:");
      console.table(usuario.rows); // Mostra os dados em formato de tabela
    } else {
      console.log("⚠️ Nenhum usuário encontrado na tabela.");
    }
  } catch (erro) {
    console.error("❌ Erro ao conectar ou buscar dados:", erro);
  } finally {
    pool.end();
  }
}

testarConexao();
