import { db } from '../db/connection';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type EntityType = 'book' | 'chapter';

export interface ProcessingStatusInfo {
  status: ProcessingStatus;
  progress: number;
  started_at: Date | null;
  completed_at: Date | null;
  error: string | null;
}

/**
 * Update processing status
 */
export async function updateProcessingStatus(
  entityId: string,
  entityType: EntityType,
  status: ProcessingStatus,
  progress: number = 0,
  error?: string
): Promise<void> {
  // Check if status exists
  const existing = await db.query(
    `SELECT status_id, started_at 
     FROM processing_status
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [entityType, entityId]
  );
  
  const hasExisting = existing.rows.length > 0;
  const existingStartedAt = hasExisting ? existing.rows[0].started_at : null;
  
  // Determine started_at
  let startedAt: Date | null = null;
  if (status === 'processing' && !existingStartedAt) {
    startedAt = new Date();
  } else if (existingStartedAt) {
    startedAt = existingStartedAt;
  }
  
  // Determine completed_at
  let completedAt: Date | null = null;
  if (status === 'completed' || status === 'failed') {
    completedAt = new Date();
  }
  
  if (hasExisting) {
    // Update existing
    await db.query(
      `UPDATE processing_status
       SET status = $1,
           progress = $2,
           started_at = COALESCE(started_at, $3),
           completed_at = $4,
           error = $5
       WHERE entity_type = $6 AND entity_id = $7
         AND status_id = $8`,
      [
        status,
        progress,
        startedAt,
        completedAt,
        error || null,
        entityType,
        entityId,
        existing.rows[0].status_id,
      ]
    );
  } else {
    // Insert new
    await db.query(
      `INSERT INTO processing_status 
       (entity_type, entity_id, status, progress, started_at, completed_at, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [entityType, entityId, status, progress, startedAt, completedAt, error || null]
    );
  }
}

/**
 * Get processing status
 */
export async function getProcessingStatus(
  entityId: string,
  entityType: EntityType
): Promise<ProcessingStatusInfo | null> {
  const result = await db.query(
    `SELECT status, progress, started_at, completed_at, error
     FROM processing_status
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [entityType, entityId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    status: row.status as ProcessingStatus,
    progress: row.progress || 0,
    started_at: row.started_at,
    completed_at: row.completed_at,
    error: row.error,
  };
}

/**
 * Get all processing statuses for a book
 */
export async function getBookProcessingStatuses(bookId: string): Promise<{
  book: ProcessingStatusInfo | null;
  chapters: Array<{
    chapter_id: string;
    status: ProcessingStatusInfo;
  }>;
}> {
  const bookStatus = await getProcessingStatus(bookId, 'book');
  
  const chaptersResult = await db.query(
    `SELECT 
      rc.chapter_id,
      ps.status,
      ps.progress,
      ps.started_at,
      ps.completed_at,
      ps.error
     FROM recent_chapters rc
     LEFT JOIN LATERAL (
       SELECT status, progress, started_at, completed_at, error
       FROM processing_status
       WHERE entity_type = 'chapter' AND entity_id = rc.chapter_id
       ORDER BY created_at DESC
       LIMIT 1
     ) ps ON true
     WHERE rc.book_id = $1`,
    [bookId]
  );
  
  const chapters = chaptersResult.rows.map(row => ({
    chapter_id: row.chapter_id,
    status: {
      status: (row.status || 'pending') as ProcessingStatus,
      progress: row.progress || 0,
      started_at: row.started_at,
      completed_at: row.completed_at,
      error: row.error,
    },
  }));
  
  return {
    book: bookStatus,
    chapters,
  };
}


