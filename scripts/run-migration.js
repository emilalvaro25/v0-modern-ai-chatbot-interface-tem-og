require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or POSTGRES_URL environment variable not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('📦 Connecting to database...');
    
    console.log('📄 Reading SQL migration file...');
    const sqlPath = path.join(__dirname, '004_upgrade_for_hyperfocus.sql');
    const migrationSQL = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing migration...');
    
    // Parse SQL more carefully, handling multi-line statements
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    let inCreateTable = false;
    let inFunction = false;
    let parenDepth = 0;
    
    migrationSQL.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        return;
      }
      
      // Check if entering a DO block
      if (trimmedLine.startsWith('DO $$') || trimmedLine.startsWith('DO $')) {
        inDoBlock = true;
      }
      
      // Check if starting CREATE FUNCTION
      if (trimmedLine.toUpperCase().startsWith('CREATE OR REPLACE FUNCTION') || 
          trimmedLine.toUpperCase().startsWith('CREATE FUNCTION')) {
        inFunction = true;
      }
      
      // Check if starting CREATE TABLE
      if (trimmedLine.toUpperCase().startsWith('CREATE TABLE')) {
        inCreateTable = true;
        parenDepth = 0;
      }
      
      // Track parentheses for CREATE TABLE
      if (inCreateTable) {
        for (const char of line) {
          if (char === '(') parenDepth++;
          if (char === ')') parenDepth--;
        }
      }
      
      currentStatement += line + '\n';
      
      // Check if exiting a DO block
      if (inDoBlock && (trimmedLine === 'END $$;' || trimmedLine === '$$;')) {
        inDoBlock = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (inFunction && trimmedLine.endsWith("language 'plpgsql';")) {
        // End of function
        inFunction = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (inCreateTable && parenDepth === 0 && trimmedLine.endsWith(');')) {
        // End of CREATE TABLE
        inCreateTable = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (!inDoBlock && !inCreateTable && !inFunction && trimmedLine.endsWith(';')) {
        // Normal statement end
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    });
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements
    const validStatements = statements.filter(s => s.length > 0);
    
    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      console.log(`  [${i + 1}/${validStatements.length}] ${preview}...`);
      try {
        await sql.query(statement);
        console.log(`  ✓ Success`);
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message && !err.message.includes('already exists')) {
          console.error(`  ❌ Error:`, err.message);
          throw err;
        } else {
          console.log(`  ℹ️  Skipped (already exists)`);
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'voice_sessions', 'llm_benchmarks', 'system_monitoring', 'audit_logs', 'encryption_keys')
      ORDER BY table_name
    `;
    
    console.log('\n📋 Created tables:');
    tables.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verify test users were created
    const users = await sql`
      SELECT email, role FROM users ORDER BY role, email
    `;
    
    console.log('\n👥 Created users:');
    users.forEach(user => {
      console.log(`  ✓ ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
