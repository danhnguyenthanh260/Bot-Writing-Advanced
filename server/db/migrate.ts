import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './connection.ts';

/**
 * Deploy database schema from schema.sql
 */
export async function deploySchema(): Promise<void> {
  try {
    const schemaPath = join(process.cwd(), 'server', 'db', 'schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');
    
    // Execute entire schema file
    // PostgreSQL can handle multiple statements in one query
    try {
      await db.query(schemaSQL);
      console.log('Schema deployment completed');
    } catch (error: any) {
      // If error is about existing objects, that's OK
      if (error.code === '42P07' || error.code === '42710' || error.code === '42723') {
        console.log('Schema objects already exist, skipping...');
      } else {
        // For other errors, try executing statement by statement
        console.warn('Bulk deployment failed, trying statement by statement...');
        const statements = schemaSQL
          .split(/;\s*(?=CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)/i)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          try {
            if (statement.trim()) {
              await db.query(statement + ';');
            }
          } catch (stmtError: any) {
            // Ignore "already exists" errors
            if (stmtError.code === '42P07' || stmtError.code === '42710' || stmtError.code === '42723') {
              continue;
            }
            console.warn('Schema statement warning:', stmtError.message.substring(0, 100));
          }
        }
        console.log('Schema deployment completed (statement by statement)');
      }
    }
  } catch (error: any) {
    console.error('Schema deployment error:', error.message);
    throw error;
  }
}

/**
 * Check if schema is already deployed
 */
export async function checkSchemaDeployed(): Promise<boolean> {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'books'
      );
    `);
    return result.rows[0]?.exists === true;
  } catch (error) {
    return false;
  }
}

