import { db } from './connection.ts';

/**
 * Drop all tables and recreate schema
 * WARNING: This will delete all data!
 */
async function resetSchema(): Promise<void> {
  try {
    console.log('Dropping all tables...');
    
    // Drop tables in reverse dependency order
    const dropStatements = [
      'DROP TABLE IF EXISTS chapter_archive CASCADE',
      'DROP TABLE IF EXISTS processing_status CASCADE',
      'DROP TABLE IF EXISTS embedding_cache CASCADE',
      'DROP TABLE IF EXISTS workspace_canvas_pages CASCADE',
      'DROP TABLE IF EXISTS workspace_chat_messages CASCADE',
      'DROP TABLE IF EXISTS workspaces CASCADE',
      'DROP TABLE IF EXISTS chapter_chunks CASCADE',
      'DROP TABLE IF EXISTS recent_chapters CASCADE',
      'DROP TABLE IF EXISTS book_contexts CASCADE',
      'DROP TABLE IF EXISTS books CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
    ];
    
    for (const statement of dropStatements) {
      try {
        await db.query(statement);
        console.log(`✓ Dropped: ${statement}`);
      } catch (error: any) {
        console.warn(`Warning dropping ${statement}:`, error.message);
      }
    }
    
    // Drop functions
    try {
      await db.query('DROP FUNCTION IF EXISTS update_updated_at() CASCADE');
      console.log('✓ Dropped function: update_updated_at');
    } catch (error: any) {
      console.warn('Warning dropping function:', error.message);
    }
    
    // Drop extensions (optional - might fail if in use)
    try {
      await db.query('DROP EXTENSION IF EXISTS vector CASCADE');
      console.log('✓ Dropped extension: vector');
    } catch (error: any) {
      console.warn('Warning dropping vector extension:', error.message);
    }
    
    try {
      await db.query('DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE');
      console.log('✓ Dropped extension: uuid-ossp');
    } catch (error: any) {
      console.warn('Warning dropping uuid-ossp extension:', error.message);
    }
    
    console.log('\nAll tables dropped successfully!');
    console.log('Now deploying new schema...\n');
    
    // Deploy new schema
    const { deploySchema } = await import('./migrate.ts');
    await deploySchema();
    
    console.log('\n✓ Schema reset completed!');
  } catch (error: any) {
    console.error('Error resetting schema:', error);
    throw error;
  }
}

/**
 * Check if schema exists and has data
 */
async function checkSchemaData(): Promise<{
  hasTables: boolean;
  hasData: boolean;
  tableCounts: Record<string, number>;
}> {
  const result = {
    hasTables: false,
    hasData: false,
    tableCounts: {} as Record<string, number>,
  };
  
  try {
    // Check if books table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'books'
      );
    `);
    
    result.hasTables = tableCheck.rows[0]?.exists === true;
    
    if (!result.hasTables) {
      return result;
    }
    
    // Count rows in each table
    const tables = [
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
      'chapter_archive',
    ];
    
    for (const table of tables) {
      try {
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(countResult.rows[0]?.count || '0');
        result.tableCounts[table] = count;
        if (count > 0) {
          result.hasData = true;
        }
      } catch (error) {
        // Table might not exist
        result.tableCounts[table] = 0;
      }
    }
    
    return result;
  } catch (error) {
    return result;
  }
}

// If run directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('resetSchema')) {
  resetSchema()
    .then(() => {
      console.log('\n✅ Done! Database schema has been reset.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

export { resetSchema, checkSchemaData };

