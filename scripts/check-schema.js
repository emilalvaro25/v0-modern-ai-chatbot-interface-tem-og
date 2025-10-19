require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkSchema() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('📋 Checking existing tables...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('Existing tables:');
    for (const row of tables) {
      console.log(`  - ${row.table_name}`);
      
      // Get columns for each table
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${row.table_name}
        ORDER BY ordinal_position
      `;
      
      console.log('    Columns:');
      columns.forEach(col => {
        console.log(`      • ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
