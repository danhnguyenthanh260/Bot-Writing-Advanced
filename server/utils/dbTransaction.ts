/**
 * Database transaction utilities for handling concurrent updates
 */

import { db } from '../db/connection';

/**
 * Execute function within a database transaction
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lock row for update (prevents concurrent modifications)
 */
export async function lockRowForUpdate(
  table: string,
  whereClause: string,
  params: any[],
  client?: any
): Promise<boolean> {
  const queryClient = client || db;
  
  const result = await queryClient.query(
    `SELECT * FROM ${table} WHERE ${whereClause} FOR UPDATE NOWAIT`,
    params
  );
  
  return result.rows.length > 0;
}

/**
 * Upsert with conflict handling
 * Uses ON CONFLICT with proper locking
 */
export async function upsertWithLock<T>(
  table: string,
  insertData: Record<string, any>,
  conflictColumns: string[],
  updateColumns: string[],
  client?: any
): Promise<T> {
  const queryClient = client || db;
  
  const insertKeys = Object.keys(insertData);
  const insertValues = Object.values(insertData);
  const placeholders = insertKeys.map((_, i) => `$${i + 1}`).join(', ');
  
  const conflictClause = conflictColumns.join(', ');
  const updateClause = updateColumns
    .map((col, i) => `${col} = EXCLUDED.${col}`)
    .join(', ');
  
  const query = `
    INSERT INTO ${table} (${insertKeys.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${conflictClause})
    DO UPDATE SET ${updateClause}
    RETURNING *
  `;
  
  const result = await queryClient.query(query, insertValues);
  return result.rows[0] as T;
}

