import { db } from '../db/connection';
import { generateEmbedding } from './vertexEmbeddingService';

export interface SearchResult {
  chapter_id: string;
  chapter_number: number;
  title: string;
  content: string;
  summary: string;
  distance: number;
  matched_chunks?: ChunkMatch[];
}

export interface ChunkMatch {
  chunk_index: number;
  chunk_text: string;
  distance: number;
}

/**
 * Semantic search (chapter-level only)
 */
export async function semanticSearch(
  query: string,
  bookId: string,
  limit: number = 10
): Promise<SearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const vectorString = `[${queryEmbedding.join(',')}]`;
  
  // 2. Search chapters
  const result = await db.query(
    `SELECT 
      chapter_id,
      chapter_number,
      title,
      content,
      summary,
      embedding_vector <=> $1::vector(384) AS distance
     FROM recent_chapters
     WHERE book_id = $2
       AND embedding_vector IS NOT NULL
     ORDER BY embedding_vector <=> $1::vector(384)
     LIMIT $3`,
    [vectorString, bookId, limit]
  );
  
  return result.rows.map(row => ({
    chapter_id: row.chapter_id,
    chapter_number: row.chapter_number,
    title: row.title || '',
    content: row.content || '',
    summary: row.summary || '',
    distance: parseFloat(row.distance) || 0,
  }));
}

/**
 * Hierarchical semantic search (chapter → chunk)
 */
export async function hierarchicalSemanticSearch(
  query: string,
  bookId: string,
  chapterLimit: number = 10,
  chunkLimit: number = 20
): Promise<SearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const vectorString = `[${queryEmbedding.join(',')}]`;
  
  // Stage 1: Chapter-level search (broad, fast)
  const chapterResults = await db.query(
    `SELECT 
      chapter_id,
      chapter_number,
      title,
      embedding_vector <=> $1::vector(384) AS chapter_distance
     FROM recent_chapters
     WHERE book_id = $2
       AND embedding_vector IS NOT NULL
     ORDER BY embedding_vector <=> $1::vector(384)
     LIMIT $3`,
    [vectorString, bookId, chapterLimit]
  );
  
  if (chapterResults.rows.length === 0) {
    return [];
  }
  
  const chapterIds = chapterResults.rows.map((ch: any) => ch.chapter_id);
  
  // Stage 2: Chunk-level search within relevant chapters (precise)
  const chunkResults = await db.query(
    `SELECT 
      cc.chapter_id,
      cc.chunk_index,
      cc.chunk_text,
      cc.chunk_embedding <=> $1::vector(384) AS chunk_distance,
      rc.chapter_number,
      rc.title,
      rc.content,
      rc.summary,
      rc.embedding_vector <=> $1::vector(384) AS chapter_distance,
      (cc.chunk_embedding <=> $1::vector(384) * 0.7 + 
       rc.embedding_vector <=> $1::vector(384) * 0.3) AS combined_distance
     FROM chapter_chunks cc
     JOIN recent_chapters rc ON cc.chapter_id = rc.chapter_id
     WHERE cc.chapter_id = ANY($2::uuid[])
       AND cc.chunk_embedding IS NOT NULL
     ORDER BY combined_distance
     LIMIT $3`,
    [vectorString, chapterIds, chunkLimit]
  );
  
  // Stage 3: Expand context (get surrounding chunks)
  const expandedResults = await expandContext(chunkResults.rows, bookId);
  
  return expandedResults;
}

/**
 * Expand context around matched chunks
 */
async function expandContext(
  chunkMatches: any[],
  bookId: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  // Group by chapter
  const byChapter = chunkMatches.reduce((acc, match) => {
    if (!acc[match.chapter_id]) {
      acc[match.chapter_id] = [];
    }
    acc[match.chapter_id].push(match);
    return acc;
  }, {} as Record<string, any[]>);
  
  // For each chapter, get full context
  for (const [chapterId, matches] of Object.entries(byChapter)) {
    // Get chapter info
    const chapterInfo = await db.query(
      `SELECT chapter_number, title, content, summary
       FROM recent_chapters
       WHERE chapter_id = $1`,
      [chapterId]
    );
    
    if (chapterInfo.rows.length === 0) continue;
    
    const chapter = chapterInfo.rows[0];
    
    // Get surrounding chunks
    const minChunkIndex = Math.min(...matches.map((m: any) => m.chunk_index));
    const maxChunkIndex = Math.max(...matches.map((m: any) => m.chunk_index));
    
    const contextChunks = await db.query(
      `SELECT chunk_index, chunk_text
       FROM chapter_chunks
       WHERE chapter_id = $1
         AND chunk_index >= $2 - 1
         AND chunk_index <= $3 + 1
       ORDER BY chunk_index`,
      [chapterId, minChunkIndex, maxChunkIndex]
    );
    
    results.push({
      chapter_id: chapterId,
      chapter_number: chapter.chapter_number,
      title: chapter.title || '',
      content: chapter.content || '',
      summary: chapter.summary || '',
      distance: parseFloat(matches[0].combined_distance) || 0,
      matched_chunks: contextChunks.rows.map((chunk: any) => ({
        chunk_index: chunk.chunk_index,
        chunk_text: chunk.chunk_text,
        distance: parseFloat(
          matches.find((m: any) => m.chunk_index === chunk.chunk_index)?.chunk_distance || '0'
        ),
      })),
    });
  }
  
  return results.sort((a, b) => a.distance - b.distance);
}


