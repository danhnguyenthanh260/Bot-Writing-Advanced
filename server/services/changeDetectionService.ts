import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';

export interface ContentChange {
  hasChanged: boolean;
  oldHash?: string;
  newHash: string;
}

/**
 * Check if chapter content has changed
 */
export async function detectChapterChange(
  bookId: string,
  chapterNumber: number,
  newContent: string
): Promise<ContentChange> {
  const newHash = calculateContentHash(newContent);
  
  const result = await db.query(
    `SELECT content_hash 
     FROM recent_chapters
     WHERE book_id = $1 AND chapter_number = $2`,
    [bookId, chapterNumber]
  );
  
  if (result.rows.length === 0) {
    // New chapter
    return {
      hasChanged: true,
      newHash,
    };
  }
  
  const oldHash = result.rows[0].content_hash;
  const hasChanged = oldHash !== newHash;
  
  return {
    hasChanged,
    oldHash,
    newHash,
  };
}

/**
 * Check if book context has changed
 */
export async function detectBookContextChange(
  bookId: string,
  newContext: {
    summary?: string;
    characters?: any;
    world_setting?: any;
    writing_style?: any;
    story_arc?: any;
  }
): Promise<ContentChange> {
  const contextString = JSON.stringify(newContext);
  const newHash = calculateContentHash(contextString);
  
  const result = await db.query(
    `SELECT 
       COALESCE(summary, '') || 
       COALESCE(characters::text, '') ||
       COALESCE(world_setting::text, '') ||
       COALESCE(writing_style::text, '') ||
       COALESCE(story_arc::text, '') as context_string
     FROM book_contexts
     WHERE book_id = $1`,
    [bookId]
  );
  
  if (result.rows.length === 0) {
    // New context
    return {
      hasChanged: true,
      newHash,
    };
  }
  
  const oldContextString = result.rows[0].context_string || '';
  const oldHash = calculateContentHash(oldContextString);
  const hasChanged = oldHash !== newHash;
  
  return {
    hasChanged,
    oldHash,
    newHash,
  };
}

/**
 * Mark content as processed (update hash)
 */
export async function markContentProcessed(
  bookId: string,
  chapterNumber: number,
  contentHash: string
): Promise<void> {
  await db.query(
    `UPDATE recent_chapters
     SET content_hash = $1, updated_at = CURRENT_TIMESTAMP
     WHERE book_id = $2 AND chapter_number = $3`,
    [contentHash, bookId, chapterNumber]
  );
}

