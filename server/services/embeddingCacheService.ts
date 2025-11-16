import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';

export interface EmbeddingCache {
  content_hash: string;
  embedding_vector: number[];
  model_version: string;
  created_at: Date;
  last_accessed_at: Date;
}

/**
 * Get embedding from cache
 */
export async function getCachedEmbedding(
  content: string,
  modelVersion: string
): Promise<number[] | null> {
  const contentHash = calculateContentHash(content);
  
  const result = await db.query(
    `SELECT embedding_vector, model_version
     FROM embedding_cache
     WHERE content_hash = $1 AND model_version = $2`,
    [contentHash, modelVersion]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Update last_accessed_at
  await db.query(
    `UPDATE embedding_cache 
     SET last_accessed_at = CURRENT_TIMESTAMP
     WHERE content_hash = $1 AND model_version = $2`,
    [contentHash, modelVersion]
  );
  
  // pgvector returns as array, convert if needed
  const embedding = result.rows[0].embedding_vector;
  if (Array.isArray(embedding)) {
    return embedding;
  }
  // If it's a string, parse it
  if (typeof embedding === 'string') {
    // Remove brackets and split
    const cleaned = embedding.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(Number);
  }
  // Fallback: return empty array
  return [];
}

/**
 * Cache embedding
 */
export async function cacheEmbedding(
  content: string,
  embedding: number[],
  modelVersion: string
): Promise<void> {
  const contentHash = calculateContentHash(content);
  
  // Convert array to pgvector format: [1,2,3] -> '[1,2,3]'
  const vectorString = `[${embedding.join(',')}]`;
  
  await db.query(
    `INSERT INTO embedding_cache (content_hash, embedding_vector, model_version)
     VALUES ($1, $2::vector, $3)
     ON CONFLICT (content_hash) 
     DO UPDATE SET 
       embedding_vector = EXCLUDED.embedding_vector,
       model_version = EXCLUDED.model_version,
       last_accessed_at = CURRENT_TIMESTAMP`,
    [contentHash, vectorString, modelVersion]
  );
}

/**
 * Clear old cache entries (older than specified days)
 */
export async function clearOldCache(olderThanDays: number = 30): Promise<number> {
  // Use parameterized query to prevent SQL injection
  const result = await db.query(
    `DELETE FROM embedding_cache
     WHERE last_accessed_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * $1
     RETURNING content_hash`,
    [olderThanDays]
  );
  
  return result.rowCount || 0;
}

/**
 * Invalidate cache entries for specific content hashes
 * Used when content changes and embeddings need regeneration
 */
export async function invalidateCacheEntries(contentHashes: string[]): Promise<number> {
  if (contentHashes.length === 0) return 0;
  
  const placeholders = contentHashes.map((_, i) => `$${i + 1}`).join(', ');
  const result = await db.query(
    `DELETE FROM embedding_cache
     WHERE content_hash IN (${placeholders})
     RETURNING content_hash`,
    contentHashes
  );
  
  return result.rowCount || 0;
}

/**
 * Invalidate cache when chapter content changes
 */
export async function invalidateChapterCache(chapterId: string): Promise<void> {
  // Get old content hash
  const chapterResult = await db.query(
    'SELECT content_hash FROM recent_chapters WHERE chapter_id = $1',
    [chapterId]
  );
  
  if (chapterResult.rows.length > 0 && chapterResult.rows[0].content_hash) {
    await invalidateCacheEntries([chapterResult.rows[0].content_hash]);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  byModelVersion: Record<string, number>;
}> {
  const totalResult = await db.query('SELECT COUNT(*) as count FROM embedding_cache');
  const totalEntries = parseInt(totalResult.rows[0].count);
  
  const modelResult = await db.query(
    `SELECT model_version, COUNT(*) as count
     FROM embedding_cache
     GROUP BY model_version`
  );
  
  const byModelVersion: Record<string, number> = {};
  for (const row of modelResult.rows) {
    byModelVersion[row.model_version] = parseInt(row.count);
  }
  
  return { totalEntries, byModelVersion };
}

