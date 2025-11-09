import { generateEmbedding, generateEmbeddingsBatch } from './vertexEmbeddingService';
import { extractChapterMetadata } from './extractionService';
import { db } from '../db/connection';

const CHUNK_SIZE_WORDS = 800;
const CHUNK_OVERLAP_WORDS = 100;

interface Chunk {
  text: string;
  index: number;
  wordCount: number;
}

/**
 * Chunk text into smaller pieces for embedding
 */
function chunkText(text: string): Chunk[] {
  const words = text.split(/\s+/);
  const chunks: Chunk[] = [];
  
  for (let i = 0; i < words.length; i += CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS) {
    const chunkWords = words.slice(i, i + CHUNK_SIZE_WORDS);
    chunks.push({
      text: chunkWords.join(' '),
      index: chunks.length,
      wordCount: chunkWords.length,
    });
  }
  
  return chunks;
}

export interface HierarchicalEmbeddingResult {
  chapterEmbedding: number[];
  chunkEmbeddings: Array<{
    chunkIndex: number;
    embedding: number[];
    text: string;
    wordCount: number;
  }>;
}

/**
 * Generate hierarchical embeddings for chapter
 * - Chapter-level embedding (from summary)
 * - Chunk-level embeddings (for long chapters)
 */
export async function generateHierarchicalEmbeddings(
  chapterContent: string,
  chapterNumber: number,
  chapterTitle?: string
): Promise<HierarchicalEmbeddingResult> {
  // 1. Generate summary for chapter-level embedding
  let summary: string;
  try {
    const metadata = await extractChapterMetadata(chapterContent, chapterNumber, chapterTitle);
    summary = metadata.data.summary;
  } catch (error) {
    // Fallback: use first 200 words as summary
    console.warn('Failed to extract summary, using fallback', error);
    const words = chapterContent.split(/\s+/);
    summary = words.slice(0, 200).join(' ');
  }
  
  // 2. Generate chapter-level embedding (from summary)
  const chapterEmbedding = await generateEmbedding(summary);
  
  // 3. Check if chapter is long enough to chunk
  const wordCount = chapterContent.split(/\s+/).length;
  if (wordCount <= CHUNK_SIZE_WORDS) {
    // Short chapter: only chapter-level embedding
    return {
      chapterEmbedding,
      chunkEmbeddings: [],
    };
  }
  
  // 4. Chunk content
  const chunks = chunkText(chapterContent);
  
  // 5. Generate chunk-level embeddings (batch)
  const chunkTexts = chunks.map(chunk => chunk.text);
  const chunkEmbeddings = await generateEmbeddingsBatch(chunkTexts);
  
  return {
    chapterEmbedding,
    chunkEmbeddings: chunks.map((chunk, index) => ({
      chunkIndex: chunk.index,
      embedding: chunkEmbeddings[index],
      text: chunk.text,
      wordCount: chunk.wordCount,
    })),
  };
}

/**
 * Save hierarchical embeddings to database
 */
export async function saveHierarchicalEmbeddings(
  chapterId: string,
  bookId: string,
  chapterNumber: number,
  embeddings: HierarchicalEmbeddingResult,
  modelVersion: string
): Promise<void> {
  // Save chapter-level embedding
  const chapterVectorString = `[${embeddings.chapterEmbedding.join(',')}]`;
  
  await db.query(
    `UPDATE recent_chapters
     SET embedding_vector = $1::vector,
         embedding_version = $2,
         embedding_timestamp = CURRENT_TIMESTAMP
     WHERE chapter_id = $3`,
    [chapterVectorString, modelVersion, chapterId]
  );
  
  // Save chunk-level embeddings
  if (embeddings.chunkEmbeddings.length > 0) {
    // Delete existing chunks
    await db.query(
      'DELETE FROM chapter_chunks WHERE chapter_id = $1',
      [chapterId]
    );
    
    // Insert new chunks
    for (const chunk of embeddings.chunkEmbeddings) {
      const chunkVectorString = `[${chunk.embedding.join(',')}]`;
      await db.query(
        `INSERT INTO chapter_chunks (chapter_id, chunk_index, chunk_text, chunk_embedding, word_count)
         VALUES ($1, $2, $3, $4::vector, $5)`,
        [chapterId, chunk.chunkIndex, chunk.text, chunkVectorString, chunk.wordCount]
      );
    }
  }
}


