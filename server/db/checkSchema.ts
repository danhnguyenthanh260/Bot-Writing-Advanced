import { db } from './connection.ts';

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
      'data_flow_logs',
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

/**
 * Check schema status
 */
async function main() {
  console.log('Checking database schema...\n');
  
  const status = await checkSchemaData();
  
  console.log('Schema Status:');
  console.log(`- Has Tables: ${status.hasTables ? '✓' : '✗'}`);
  console.log(`- Has Data: ${status.hasData ? '✓' : '✗'}`);
  console.log('\nTable Row Counts:');
  
  for (const [table, count] of Object.entries(status.tableCounts)) {
    console.log(`  ${table}: ${count}`);
  }
  
  if (!status.hasTables) {
    console.log('\n⚠ Schema not deployed. Run resetSchema to create it.');
  } else if (!status.hasData) {
    console.log('\n✓ Schema exists but no data. Ready for use.');
  } else {
    console.log('\n✓ Schema exists with data.');
  }
}

main().catch(console.error);

