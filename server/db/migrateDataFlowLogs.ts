import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './connection.ts';

/**
 * Apply migration for data_flow_logs table
 */
export async function migrateDataFlowLogs(): Promise<void> {
  try {
    console.log('Applying migration: data_flow_logs table...\n');
    
    const migrationPath = join(process.cwd(), 'server', 'db', 'migrate_data_flow_logs.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Check if table already exists
    const checkResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'data_flow_logs'
      );
    `);
    
    if (checkResult.rows[0]?.exists === true) {
      console.log('✓ data_flow_logs table already exists');
      console.log('Checking indexes...');
      
      // Check if indexes exist
      const indexCheck = await db.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'data_flow_logs' 
        AND schemaname = 'public'
      `);
      
      const existingIndexes = indexCheck.rows.map(row => row.indexname);
      const requiredIndexes = [
        'idx_data_flow_logs_entity',
        'idx_data_flow_logs_stage',
        'idx_data_flow_logs_level',
        'idx_data_flow_logs_created',
      ];
      
      const missingIndexes = requiredIndexes.filter(idx => !existingIndexes.includes(idx));
      
      if (missingIndexes.length > 0) {
        console.log(`⚠ Missing indexes: ${missingIndexes.join(', ')}`);
        console.log('Creating missing indexes...');
        
        // Execute only the CREATE INDEX statements
        const indexStatements = migrationSQL
          .split(';')
          .filter(stmt => stmt.trim().startsWith('CREATE INDEX'))
          .map(stmt => stmt.trim() + ';');
        
        for (const statement of indexStatements) {
          try {
            await db.query(statement);
            console.log(`✓ Created index: ${statement.match(/idx_\w+/)?.[0] || 'unknown'}`);
          } catch (error: any) {
            if (error.code === '42P07') {
              // Index already exists
              continue;
            }
            console.warn(`⚠ Index creation warning: ${error.message.substring(0, 100)}`);
          }
        }
      } else {
        console.log('✓ All indexes exist');
      }
      
      return;
    }
    
    // Execute migration
    console.log('Creating data_flow_logs table and indexes...');
    await db.query(migrationSQL);
    console.log('\n✓ Migration completed successfully!');
    console.log('✓ data_flow_logs table created');
    console.log('✓ All indexes created');
    
  } catch (error: any) {
    console.error('✗ Migration error:', error.message);
    throw error;
  }
}

/**
 * Run migration if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDataFlowLogs()
    .then(() => {
      console.log('\n✓ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Migration failed:', error);
      process.exit(1);
    });
}

