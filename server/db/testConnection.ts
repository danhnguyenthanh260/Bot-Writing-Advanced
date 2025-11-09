import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (go up from server/db/ to root)
const rootDir = join(__dirname, '../../');
dotenv.config({ path: join(rootDir, '.env') });

import { db } from './connection.ts';

/**
 * Test database connection
 */
async function testConnection() {
  console.log('Testing database connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (process.env.DATABASE_URL) {
    try {
      // Parse URL to check components
      const url = new URL(process.env.DATABASE_URL);
      const maskedUrl = `${url.protocol}//${url.username}:***@${url.hostname}:${url.port}${url.pathname}`;
      console.log('Connection string:', maskedUrl);
      
      // Debug info (without showing password)
      console.log('\nDebug info:');
      console.log('- Protocol:', url.protocol);
      console.log('- Username:', url.username || '(empty)');
      console.log('- Password:', url.password ? `[${url.password.length} chars]` : '(empty)');
      console.log('- Host:', url.hostname);
      console.log('- Port:', url.port || '5432 (default)');
      console.log('- Database:', url.pathname.slice(1) || '(empty)');
      
      // Check if password might need URL encoding
      if (url.password && decodeURIComponent(url.password) !== url.password) {
        console.log('⚠ Password appears to be URL encoded');
      }
      if (url.password && (url.password.includes('@') || url.password.includes(':') || url.password.includes('/'))) {
        console.log('⚠ Password contains special characters that might need encoding');
      }
    } catch (parseError: any) {
      console.error('⚠ Failed to parse DATABASE_URL:', parseError.message);
      console.log('Raw URL length:', process.env.DATABASE_URL?.length || 0);
    }
  }
  
  console.log('\nAttempting to connect...\n');
  
  try {
    // Simple query to test connection
    const result = await db.query('SELECT version(), current_database(), current_user');
    
    console.log('✅ Connection successful!\n');
    console.log('Database Info:');
    console.log('- PostgreSQL Version:', result.rows[0].version.split(',')[0]);
    console.log('- Database Name:', result.rows[0].current_database);
    console.log('- Current User:', result.rows[0].current_user);
    
    // Check if database exists and is accessible
    const dbCheck = await db.query(`
      SELECT 
        EXISTS(SELECT FROM pg_database WHERE datname = current_database()) as db_exists,
        pg_size_pretty(pg_database_size(current_database())) as db_size
    `);
    
    console.log('\nDatabase Status:');
    console.log('- Database exists:', dbCheck.rows[0].db_exists);
    console.log('- Database size:', dbCheck.rows[0].db_size);
    
    // Check extensions
    console.log('\nChecking extensions...');
    const extensions = await db.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'vector')
      ORDER BY extname
    `);
    
    if (extensions.rows.length === 0) {
      console.log('⚠ No required extensions found');
    } else {
      console.log('Installed extensions:');
      extensions.rows.forEach(ext => {
        console.log(`  ✓ ${ext.extname} (v${ext.extversion})`);
      });
    }
    
    const requiredExts = ['uuid-ossp', 'vector'];
    const installedExts = extensions.rows.map(r => r.extname);
    const missingExts = requiredExts.filter(ext => !installedExts.includes(ext));
    
    if (missingExts.length > 0) {
      console.log('\n⚠ Missing extensions:');
      missingExts.forEach(ext => {
        console.log(`  ✗ ${ext}`);
      });
    }
    
    // Check if schema exists
    console.log('\nChecking schema...');
    const schemaCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'books'
      ) as has_schema
    `);
    
    if (schemaCheck.rows[0].has_schema) {
      console.log('✓ Schema already deployed');
    } else {
      console.log('⚠ Schema not deployed yet');
      console.log('  Run: npm run db:reset');
    }
    
    console.log('\n✅ All checks completed!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error details:');
    console.error('- Message:', error.message);
    console.error('- Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('  1. Check if PostgreSQL service is running');
      console.error('  2. Check if host and port are correct');
      console.error('  3. Run: sc query postgresql-x64-15');
    } else if (error.code === '28P01' || error.message.includes('password')) {
      console.error('\n💡 Possible solutions:');
      console.error('  1. Check if password is correct');
      console.error('  2. Check if username is correct');
      console.error('  3. URL encode special characters in password');
    } else if (error.code === '3D000') {
      console.error('\n💡 Possible solutions:');
      console.error('  1. Database does not exist');
      console.error('  2. Create database: CREATE DATABASE bot_writing_advanced;');
    }
    
    process.exit(1);
  }
}

testConnection();

