import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../');
dotenv.config({ path: join(rootDir, '.env') });

import { db } from './connection.ts';

/**
 * Verify Database Setup
 * 
 * Script này kiểm tra:
 * 1. Connection đến database có hoạt động không
 * 2. Database có tồn tại không
 * 3. Schema đã được apply chưa (các bảng)
 * 4. Extensions đã được cài chưa
 */

async function verifyConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing database connection...');
    const result = await db.query('SELECT version(), current_database(), current_user');
    
    console.log('✅ Connection successful!');
    console.log(`   - PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    console.log(`   - Database: ${result.rows[0].current_database}`);
    console.log(`   - User: ${result.rows[0].current_user}`);
    return true;
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function verifyDatabase(): Promise<boolean> {
  try {
    console.log('\n🔍 Verifying database exists...');
    const result = await db.query(`
      SELECT 
        EXISTS(SELECT FROM pg_database WHERE datname = current_database()) as db_exists,
        pg_size_pretty(pg_database_size(current_database())) as db_size
    `);
    
    if (result.rows[0].db_exists) {
      console.log('✅ Database exists');
      console.log(`   - Size: ${result.rows[0].db_size}`);
      return true;
    } else {
      console.error('❌ Database does not exist');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error verifying database:', error.message);
    return false;
  }
}

async function verifyExtensions(): Promise<boolean> {
  try {
    console.log('\n🔍 Verifying extensions...');
    const result = await db.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'vector')
      ORDER BY extname
    `);
    
    const requiredExtensions = ['uuid-ossp', 'vector'];
    const installedExtensions = result.rows.map((r: any) => r.extname);
    
    let allInstalled = true;
    for (const ext of requiredExtensions) {
      if (installedExtensions.includes(ext)) {
        const version = result.rows.find((r: any) => r.extname === ext)?.extversion;
        console.log(`   ✅ ${ext} (v${version})`);
      } else {
        console.log(`   ❌ ${ext} - NOT INSTALLED`);
        allInstalled = false;
      }
    }
    
    return allInstalled;
  } catch (error: any) {
    console.error('❌ Error verifying extensions:', error.message);
    return false;
  }
}

async function verifyTables(): Promise<boolean> {
  try {
    console.log('\n🔍 Verifying tables...');
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const expectedTables = [
      'books',
      'users',
      'book_contexts',
      'recent_chapters',
      'chapter_chunks',
      'workspaces',
      'workspace_chat_messages',
      'workspace_canvas_pages',
      'embedding_cache',
      'processing_status',
      'data_flow_logs',
      'chapter_archive',
    ];
    
    const existingTables = result.rows.map((r: any) => r.table_name);
    
    console.log(`   Found ${existingTables.length} tables:`);
    let allPresent = true;
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        allPresent = false;
      }
    }
    
    // Check for extra tables
    const extraTables = existingTables.filter((t: string) => !expectedTables.includes(t));
    if (extraTables.length > 0) {
      console.log(`\n   ℹ️  Extra tables found: ${extraTables.join(', ')}`);
    }
    
    return allPresent;
  } catch (error: any) {
    console.error('❌ Error verifying tables:', error.message);
    return false;
  }
}

async function verifyMigrationsTable(): Promise<boolean> {
  try {
    console.log('\n🔍 Verifying migration tracking...');
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      ) as exists
    `);
    
    if (result.rows[0].exists) {
      const migrations = await db.query(`
        SELECT version, description, applied_at 
        FROM schema_migrations 
        ORDER BY applied_at
      `);
      
      console.log(`   ✅ Migration tracking table exists`);
      console.log(`   ✅ Applied migrations: ${migrations.rows.length}`);
      migrations.rows.forEach((m: any) => {
        console.log(`      - ${m.version}: ${m.description}`);
      });
      return true;
    } else {
      console.log(`   ⚠️  Migration tracking table does not exist`);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error verifying migrations:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Database Setup Verification\n');
  console.log('=' .repeat(50));
  
  const results = {
    connection: false,
    database: false,
    extensions: false,
    tables: false,
    migrations: false,
  };
  
  // Test 1: Connection
  results.connection = await verifyConnection();
  if (!results.connection) {
    console.log('\n❌ Cannot proceed - connection failed!');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check PostgreSQL service is running');
    console.log('   2. Check DATABASE_URL in .env file');
    console.log('   3. Verify database exists: psql -U postgres -l');
    process.exit(1);
  }
  
  // Test 2: Database
  results.database = await verifyDatabase();
  
  // Test 3: Extensions
  results.extensions = await verifyExtensions();
  
  // Test 4: Tables
  results.tables = await verifyTables();
  
  // Test 5: Migrations
  results.migrations = await verifyMigrationsTable();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Verification Summary:');
  console.log(`   Connection: ${results.connection ? '✅' : '❌'}`);
  console.log(`   Database: ${results.database ? '✅' : '❌'}`);
  console.log(`   Extensions: ${results.extensions ? '✅' : '❌'}`);
  console.log(`   Tables: ${results.tables ? '✅' : '❌'}`);
  console.log(`   Migrations: ${results.migrations ? '✅' : '⚠️'}`);
  
  const allPassed = results.connection && results.database && results.extensions && results.tables;
  
  if (allPassed) {
    console.log('\n✅ Database setup is complete and ready to use!');
    if (!results.migrations) {
      console.log('\n⚠️  Note: Migration tracking table not found (optional)');
    }
    process.exit(0);
  } else {
    console.log('\n❌ Database setup is incomplete!');
    console.log('\n💡 Next steps:');
    if (!results.database) {
      console.log('   1. Create database: CREATE DATABASE bot_writing_advanced;');
    }
    if (!results.extensions) {
      console.log('   2. Install extensions (see BUILD_PGVECTOR_WINDOWS.md)');
    }
    if (!results.tables) {
      console.log('   3. Apply schema: npm run db:setup');
      console.log('      Or manually: psql -U postgres -d bot_writing_advanced -f server/db/schema.sql');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

