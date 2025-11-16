/**
 * Data Flow Logger - Track data processing flow
 */

import { db } from '../db/connection';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export enum LogStage {
  INGEST = 'ingest',
  EXTRACTION = 'extraction',
  EMBEDDING = 'embedding',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  CACHE = 'cache',
}

export interface DataFlowLog {
  log_id: string;
  entity_type: 'book' | 'chapter' | 'chunk' | 'system';
  entity_id?: string;
  stage: LogStage;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  duration_ms?: number;
  created_at: Date;
}

/**
 * Create a data flow log entry
 */
export async function logDataFlow(
  entityType: 'book' | 'chapter' | 'chunk' | 'system',
  stage: LogStage,
  level: LogLevel,
  message: string,
  options: {
    entityId?: string;
    metadata?: Record<string, any>;
    durationMs?: number;
  } = {}
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO data_flow_logs 
       (log_id, entity_type, entity_id, stage, level, message, metadata, duration_ms, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [
        entityType,
        options.entityId || null,
        stage,
        level,
        message,
        options.metadata ? JSON.stringify(options.metadata) : null,
        options.durationMs || null,
      ]
    );
  } catch (error) {
    // Don't throw - logging should not break the main flow
    console.error('Failed to write data flow log:', error);
  }
}

/**
 * Log with timing
 */
export async function logWithTiming<T>(
  entityType: 'book' | 'chapter' | 'chunk' | 'system',
  stage: LogStage,
  level: LogLevel,
  message: string,
  fn: () => Promise<T>,
  options: {
    entityId?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    await logDataFlow(entityType, stage, level, message, {
      ...options,
      durationMs: duration,
      metadata: {
        ...options.metadata,
        success: true,
      },
    });
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    await logDataFlow(entityType, stage, LogLevel.ERROR, `${message} - FAILED`, {
      ...options,
      durationMs: duration,
      metadata: {
        ...options.metadata,
        success: false,
        error: error.message,
      },
    });
    
    throw error;
  }
}

/**
 * Get logs for an entity
 */
export async function getEntityLogs(
  entityType: 'book' | 'chapter' | 'chunk' | 'system',
  entityId?: string,
  options: {
    stage?: LogStage;
    level?: LogLevel;
    limit?: number;
    offset?: number;
  } = {}
): Promise<DataFlowLog[]> {
  const conditions: string[] = ['entity_type = $1'];
  const params: any[] = [entityType];
  let paramIndex = 2;
  
  if (entityId) {
    conditions.push(`entity_id = $${paramIndex++}`);
    params.push(entityId);
  }
  
  if (options.stage) {
    conditions.push(`stage = $${paramIndex++}`);
    params.push(options.stage);
  }
  
  if (options.level) {
    conditions.push(`level = $${paramIndex++}`);
    params.push(options.level);
  }
  
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  
  const result = await db.query(
    `SELECT * FROM data_flow_logs
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );
  
  return result.rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
}

/**
 * Get logs for a book (including all chapters)
 */
export async function getBookFlowLogs(
  bookId: string,
  options: {
    stage?: LogStage;
    level?: LogLevel;
    limit?: number;
  } = {}
): Promise<DataFlowLog[]> {
  // Get book logs
  const bookLogs = await getEntityLogs('book', bookId, options);
  
  // Get chapter IDs
  const chaptersResult = await db.query(
    'SELECT chapter_id FROM recent_chapters WHERE book_id = $1',
    [bookId]
  );
  
  // Get chapter logs
  const chapterLogs = await Promise.all(
    chaptersResult.rows.map(ch => 
      getEntityLogs('chapter', ch.chapter_id, options)
    )
  );
  
  // Combine and sort
  const allLogs = [...bookLogs, ...chapterLogs.flat()];
  allLogs.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return allLogs.slice(0, options.limit || 100);
}

/**
 * Get flow statistics
 */
export async function getFlowStatistics(
  entityType: 'book' | 'chapter' | 'chunk' | 'system',
  entityId?: string
): Promise<{
  totalLogs: number;
  byStage: Record<string, number>;
  byLevel: Record<string, number>;
  averageDuration: number;
  errorCount: number;
}> {
  const conditions: string[] = ['entity_type = $1'];
  const params: any[] = [entityType];
  
  if (entityId) {
    conditions.push('entity_id = $2');
    params.push(entityId);
  }
  
  const result = await db.query(
    `SELECT 
      COUNT(*) as total_logs,
      COUNT(CASE WHEN level = 'error' THEN 1 END) as error_count,
      AVG(duration_ms) as avg_duration,
      stage,
      level
     FROM data_flow_logs
     WHERE ${conditions.join(' AND ')}
     GROUP BY stage, level`,
    params
  );
  
  const byStage: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  let totalLogs = 0;
  let totalDuration = 0;
  let errorCount = 0;
  
  for (const row of result.rows) {
    totalLogs += parseInt(row.total_logs) || 0;
    errorCount += parseInt(row.error_count) || 0;
    totalDuration += parseFloat(row.avg_duration) || 0;
    
    byStage[row.stage] = (byStage[row.stage] || 0) + parseInt(row.total_logs) || 0;
    byLevel[row.level] = (byLevel[row.level] || 0) + parseInt(row.total_logs) || 0;
  }
  
  return {
    totalLogs,
    byStage,
    byLevel,
    averageDuration: totalLogs > 0 ? totalDuration / totalLogs : 0,
    errorCount,
  };
}

/**
 * Clear old logs (older than specified days)
 */
export async function clearOldLogs(olderThanDays: number = 30): Promise<number> {
  const result = await db.query(
    `DELETE FROM data_flow_logs
     WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * $1
     RETURNING log_id`,
    [olderThanDays]
  );
  
  return result.rowCount || 0;
}

