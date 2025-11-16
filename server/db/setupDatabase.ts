import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Setup Database - Tạo database và apply schema
 * 
 * Script này sẽ:
 * 1. Kết nối đến PostgreSQL (default database: postgres)
 * 2. Tạo database nếu chưa có
 * 3. Apply schema mới
 * 4. Tạo migration tracking table
 */

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    
    // Đảm bảo password là string primitive (giống connection.ts)
    let password: string = '';
    if (url.password !== null && url.password !== undefined) {
      password = String(url.password).valueOf();
    }
    if (typeof password !== 'string') {
      password = String(password || '');
    }
    
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      user: url.username || 'postgres',
      password: password,
      database: url.pathname.slice(1) || 'bot_writing_advanced',
    };
  }
  
  // Fallback to individual env vars
  const password = process.env.DB_PASSWORD;
  const passwordString = password !== undefined ? String(password) : '';
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: passwordString,
    database: process.env.DB_NAME || 'bot_writing_advanced',
  };
}

/**
 * Tạo database nếu chưa tồn tại
 */
async function createDatabaseIfNotExists(config: DatabaseConfig): Promise<void> {
  // Kết nối đến default database (postgres) để tạo database mới
  // Sử dụng DATABASE_URL nếu có, chỉ thay database name
  const databaseUrl = process.env.DATABASE_URL;
  let connectionString: string;
  
  if (databaseUrl) {
    // Thay database name trong URL thành 'postgres'
    const url = new URL(databaseUrl);
    url.pathname = '/postgres';
    connectionString = url.toString();
  } else {
    // Tạo connection string từ config
    connectionString = `postgresql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/postgres`;
  }
  
  const adminPool = new Pool({
    connectionString: connectionString,
  });

  try {
    console.log(`Checking if database '${config.database}' exists...`);
    
    // Kiểm tra database đã tồn tại chưa
    const checkResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✓ Database '${config.database}' already exists`);
    } else {
      console.log(`Creating database '${config.database}'...`);
      await adminPool.query(`CREATE DATABASE ${config.database}`);
      console.log(`✓ Database '${config.database}' created successfully`);
    }
  } catch (error: any) {
    console.error('Error creating database:', error.message);
    throw error;
  } finally {
    await adminPool.end();
  }
}

/**
 * Tạo migration tracking table
 */
async function createMigrationsTable(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        description TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Migration tracking table ready');
  } catch (error: any) {
    console.warn('Warning creating migrations table:', error.message);
  }
}

/**
 * Kiểm tra migration đã được apply chưa
 */
async function isMigrationApplied(pool: Pool, version: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM schema_migrations WHERE version = $1`,
      [version]
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Đánh dấu migration đã được apply
 */
async function markMigrationApplied(pool: Pool, version: string, description: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO schema_migrations (version, description) 
       VALUES ($1, $2) 
       ON CONFLICT (version) DO NOTHING`,
      [version, description]
    );
  } catch (error: any) {
    console.warn('Warning marking migration:', error.message);
  }
}

/**
 * Apply schema từ schema.sql
 */
async function applySchema(pool: Pool): Promise<void> {
  const schemaPath = join(process.cwd(), 'server', 'db', 'schema.sql');
  const schemaSQL = readFileSync(schemaPath, 'utf-8');
  
  const version = '1.0.0-initial';
  const description = 'Initial schema with all tables';

  // Kiểm tra đã apply chưa
  const alreadyApplied = await isMigrationApplied(pool, version);
  if (alreadyApplied) {
    console.log(`✓ Schema version ${version} already applied`);
    return;
  }

  console.log(`Applying schema version ${version}...`);
  
  try {
    // Execute schema
    await pool.query(schemaSQL);
    console.log('✓ Schema applied successfully');
    
    // Đánh dấu đã apply
    await markMigrationApplied(pool, version, description);
    console.log(`✓ Migration ${version} marked as applied`);
  } catch (error: any) {
    // If error is about existing objects, that's OK
    if (error.code === '42P07' || error.code === '42710' || error.code === '42723') {
      console.log('Schema objects already exist, marking as applied...');
      await markMigrationApplied(pool, version, description);
    } else {
      console.error('Schema deployment error:', error.message);
      throw error;
    }
  }
}

/**
 * Apply data_flow_logs migration nếu chưa có
 */
async function applyDataFlowLogsMigration(pool: Pool): Promise<void> {
  const version = '1.0.1-data-flow-logs';
  const description = 'Add data_flow_logs table';

  const alreadyApplied = await isMigrationApplied(pool, version);
  if (alreadyApplied) {
    console.log(`✓ Migration ${version} already applied`);
    return;
  }

  // Kiểm tra bảng đã tồn tại chưa
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'data_flow_logs'
    );
  `);

  if (tableCheck.rows[0]?.exists) {
    console.log(`✓ data_flow_logs table already exists, marking migration as applied`);
    await markMigrationApplied(pool, version, description);
    return;
  }

  console.log(`Applying migration ${version}...`);
  
  try {
    const migrationPath = join(process.cwd(), 'server', 'db', 'migrate_data_flow_logs.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    await pool.query(migrationSQL);
    await markMigrationApplied(pool, version, description);
    console.log(`✓ Migration ${version} applied successfully`);
  } catch (error: any) {
    if (error.code === '42P07' || error.code === '42710') {
      console.log('data_flow_logs already exists, marking as applied');
      await markMigrationApplied(pool, version, description);
    } else {
      console.error('Error applying data_flow_logs migration:', error.message);
      throw error;
    }
  }
}

/**
 * Main setup function
 */
export async function setupDatabase(): Promise<void> {
  console.log('🚀 Starting database setup...\n');
  
  const config = getDatabaseConfig();
  
  try {
    // Step 1: Tạo database nếu chưa có (skip nếu có lỗi connection)
    try {
      await createDatabaseIfNotExists(config);
      console.log('');
    } catch (dbError: any) {
      console.warn('⚠️  Could not create database automatically:', dbError.message);
      console.warn('⚠️  Please create database manually: CREATE DATABASE bot_writing_advanced;');
      console.warn('⚠️  Continuing with schema deployment...\n');
    }
    
    // Step 2: Kết nối đến database mới
    // Sử dụng connectionString hoặc DATABASE_URL nếu có
    const databaseUrl = process.env.DATABASE_URL;
    const pool = databaseUrl 
      ? new Pool({ connectionString: databaseUrl })
      : new Pool({
          connectionString: `postgresql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}`,
        });

    try {
      // Step 3: Tạo migration tracking table
      await createMigrationsTable(pool);
      console.log('');
      
      // Step 4: Apply initial schema
      await applySchema(pool);
      console.log('');
      
      // Step 5: Apply data_flow_logs migration
      await applyDataFlowLogsMigration(pool);
      console.log('');
      
      // Step 6: Kiểm tra kết quả
      const tablesCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      console.log(`✓ Database setup completed!`);
      console.log(`✓ Total tables: ${tablesCheck.rows.length}`);
      console.log(`\nTables created:`);
      tablesCheck.rows.forEach((row: any) => {
        console.log(`  - ${row.table_name}`);
      });
      
      // Hiển thị migrations đã apply
      const migrations = await pool.query(
        `SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at`
      );
      console.log(`\n✓ Applied migrations (${migrations.rows.length}):`);
      migrations.rows.forEach((row: any) => {
        console.log(`  - ${row.version}: ${row.description} (${row.applied_at})`);
      });
      
    } finally {
      await pool.end();
    }
    
    console.log('\n✅ Database setup completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Database setup failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('setupDatabase')) {
  setupDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

