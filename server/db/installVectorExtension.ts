import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const rootDir = join(__dirname, '../../');
dotenv.config({ path: join(rootDir, '.env') });

import { db } from './connection.ts';

/**
 * Cài đặt extension vector nếu chưa có
 */
async function installVectorExtension() {
  console.log('🔍 Checking vector extension...\n');
  
  try {
    // Kiểm tra extension đã được cài đặt chưa
    const checkInstalled = await db.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    
    if (checkInstalled.rows.length > 0) {
      console.log('✅ Vector extension đã được cài đặt!');
      console.log(`   Version: ${checkInstalled.rows[0].extversion}`);
      return;
    }
    
    // Kiểm tra extension có sẵn trong PostgreSQL không
    console.log('Checking if vector extension is available...');
    const checkAvailable = await db.query(`
      SELECT name, default_version 
      FROM pg_available_extensions 
      WHERE name = 'vector'
    `);
    
    if (checkAvailable.rows.length === 0) {
      console.error('\n❌ Vector extension không có sẵn trong PostgreSQL!');
      console.error('\n📋 Hướng dẫn cài đặt pgvector:');
      console.error('   1. Xem file: QUICK_INSTALL_PGVECTOR.md');
      console.error('   2. Hoặc: INSTALL_PGVECTOR_WINDOWS.md');
      console.error('\n   Tóm tắt:');
      console.error('   - Download pgvector từ: https://github.com/pgvector/pgvector/releases');
      console.error('   - Copy files vào PostgreSQL installation folder');
      console.error('   - Restart PostgreSQL service');
      console.error('   - Sau đó chạy lại script này');
      process.exit(1);
    }
    
    console.log(`✅ Vector extension có sẵn (version: ${checkAvailable.rows[0].default_version})`);
    console.log('\n📦 Đang cài đặt extension...');
    
    // Cài đặt extension
    await db.query('CREATE EXTENSION IF NOT EXISTS "vector"');
    
    // Verify
    const verify = await db.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `);
    
    if (verify.rows.length > 0) {
      console.log('✅ Vector extension đã được cài đặt thành công!');
      console.log(`   Version: ${verify.rows[0].extversion}`);
    } else {
      console.error('❌ Cài đặt thất bại!');
      process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Lỗi khi cài đặt vector extension:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('could not open extension control file') || 
        error.message.includes('extension "vector" is not available')) {
      console.error('\n📋 Vector extension chưa được cài đặt ở cấp PostgreSQL server.');
      console.error('   Xem hướng dẫn trong: QUICK_INSTALL_PGVECTOR.md');
    }
    
    process.exit(1);
  }
}

installVectorExtension();

