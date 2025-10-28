// =============================================================================
// MIGRAÇÃO AUTOMÁTICA DO BANCO DE DADOS - GAMIFICAÇÃO DEVOCIONAL
// =============================================================================
// Este script cria as tabelas necessárias para a gamificação do devocional
// apenas se elas ainda não existirem (IF NOT EXISTS)
// =============================================================================

require('dotenv').config();
const pool = require('./db');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migração do banco de dados...\n');
    
    // Verificar estrutura da tabela usuario primeiro
    console.log('🔍 Verificando estrutura da tabela usuario...');
    const checkUsuario = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'app_biblia' 
      AND table_name = 'usuario'
      ORDER BY ordinal_position;
    `);
    
    if (checkUsuario.rows.length === 0) {
      console.error('❌ Tabela usuario não existe no schema app_biblia');
      throw new Error('Tabela usuario não encontrada');
    }
    
    console.log('✅ Tabela usuario encontrada com colunas:');
    checkUsuario.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // Identifica a coluna de ID (pode ser 'id' ou 'id_usuario')
    const idColumn = checkUsuario.rows.find(col => 
      col.column_name === 'id' || col.column_name === 'id_usuario'
    );
    
    if (!idColumn) {
      throw new Error('Não foi possível identificar a coluna de ID na tabela usuario');
    }
    
    const userIdColumn = idColumn.column_name;
    console.log(`✅ Coluna de ID identificada: ${userIdColumn}\n`);
    
    // =========================================================================
    // TABELA 1: devocional_leitura (rastreamento de leituras diárias)
    // =========================================================================
    console.log('📋 Criando tabela: devocional_leitura');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_biblia.devocional_leitura (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES app_biblia.usuario(${userIdColumn}) ON DELETE CASCADE,
        day_key DATE NOT NULL,
        lido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_usuario, day_key)
      );
    `);
    console.log('✅ Tabela devocional_leitura criada/verificada\n');
    
    // Criar índice para performance
    console.log('📊 Criando índice: idx_devocional_leitura_usuario_data');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_devocional_leitura_usuario_data 
      ON app_biblia.devocional_leitura(id_usuario, day_key DESC);
    `);
    console.log('✅ Índice criado/verificado\n');
    
    // =========================================================================
    // TABELA 2: devocional_conquistas (badges e conquistas)
    // =========================================================================
    console.log('📋 Criando tabela: devocional_conquistas');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_biblia.devocional_conquistas (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES app_biblia.usuario(${userIdColumn}) ON DELETE CASCADE,
        tipo_conquista VARCHAR(50) NOT NULL,
        desbloqueado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_usuario, tipo_conquista)
      );
    `);
    console.log('✅ Tabela devocional_conquistas criada/verificada\n');
    
    // Criar índice para performance
    console.log('📊 Criando índice: idx_devocional_conquistas_usuario');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_devocional_conquistas_usuario 
      ON app_biblia.devocional_conquistas(id_usuario);
    `);
    console.log('✅ Índice criado/verificado\n');
    
    // =========================================================================
    // VERIFICAÇÃO DAS TABELAS CRIADAS
    // =========================================================================
    console.log('🔍 Verificando estrutura das tabelas...\n');
    
    const verificaLeitura = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'app_biblia' 
      AND table_name = 'devocional_leitura'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura de devocional_leitura:');
    verificaLeitura.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    const verificaConquistas = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'app_biblia' 
      AND table_name = 'devocional_conquistas'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estrutura de devocional_conquistas:');
    verificaConquistas.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ Migração concluída com sucesso!');
    console.log('🎉 Banco de dados pronto para gamificação do devocional!\n');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar migração
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Script de migração executado com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
