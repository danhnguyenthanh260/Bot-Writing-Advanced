import { db } from '../db/connection';
import { generateEmbedding } from './vertexEmbeddingService';
import { extractKeywords } from './queryClassificationService';

export interface HybridSearchResult {
  chapter_id: string;
  chapter_number: number;
  title: string;
  content: string;
  summary: string;
  vector_distance: number;
  keyword_match: boolean;
  combined_score: number;
}

/**
 * Hybrid search: Vector + Keyword
 */
export async function hybridSearch(
  query: string,
  bookId: string,
  limit: number = 10
): Promise<HybridSearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const vectorString = `[${queryEmbedding.join(',')}]`;
  
  // 2. Extract keywords
  const keywords = extractKeywords(query);
  
  // 3. Vector search
  const vectorResults = await db.query(
    `SELECT 
      chapter_id,
      chapter_number,
      title,
      content,
      summary,
      embedding_vector <=> $1::vector AS vector_distance
     FROM recent_chapters
     WHERE book_id = $2
       AND embedding_vector IS NOT NULL
     ORDER BY embedding_vector <=> $1::vector
     LIMIT $3`,
    [vectorString, bookId, limit * 2] // Get more for keyword filtering
  );
  
  // 4. Keyword search (if keywords exist)
  let keywordChapterIds = new Set<string>();
  
  if (keywords.length > 0) {
    const keywordConditions = keywords.map((keyword, index) => 
      `(content ILIKE $${index + 3} OR title ILIKE $${index + 3})`
    ).join(' OR ');
    
    const keywordResults = await db.query(
      `SELECT chapter_id
       FROM recent_chapters
       WHERE book_id = $1
         AND (${keywordConditions})
       LIMIT $2`,
      [bookId, ...keywords.map(k => `%${k}%`), limit]
    );
    
    keywordChapterIds = new Set(
      keywordResults.rows.map((r: any) => r.chapter_id)
    );
  }
  
  // 5. Combine results
  const combined: HybridSearchResult[] = vectorResults.rows.map((row: any) => {
    const vectorDistance = parseFloat(row.vector_distance) || 0;
    const keywordMatch = keywordChapterIds.has(row.chapter_id);
    
    return {
      chapter_id: row.chapter_id,
      chapter_number: row.chapter_number,
      title: row.title || '',
      content: row.content || '',
      summary: row.summary || '',
      vector_distance: vectorDistance,
      keyword_match: keywordMatch,
      combined_score: keywordMatch 
        ? vectorDistance * 0.5  // Boost keyword matches
        : vectorDistance,
    };
  });
  
  // 6. Sort by combined score
  combined.sort((a, b) => a.combined_score - b.combined_score);
  
  return combined.slice(0, limit);
}











