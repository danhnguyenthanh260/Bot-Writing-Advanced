/**
 * Data integrity checks for embeddings and metadata
 */

import { db } from '../db/connection';

/**
 * Validate embedding vector
 */
export interface EmbeddingValidation {
  valid: boolean;
  dimensions: number;
  expectedDimensions: number;
  issues: string[];
}

export function validateEmbedding(
  embedding: number[],
  expectedDimensions: number = 384
): EmbeddingValidation {
  const issues: string[] = [];
  
  if (!Array.isArray(embedding)) {
    issues.push('Embedding is not an array');
    return {
      valid: false,
      dimensions: 0,
      expectedDimensions,
      issues,
    };
  }
  
  if (embedding.length !== expectedDimensions) {
    issues.push(
      `Dimension mismatch: expected ${expectedDimensions}, got ${embedding.length}`
    );
  }
  
  // Check for NaN or Infinity
  const invalidValues = embedding.filter(
    v => !Number.isFinite(v) || isNaN(v)
  );
  if (invalidValues.length > 0) {
    issues.push(`Found ${invalidValues.length} invalid values (NaN/Infinity)`);
  }
  
  // Check for all zeros (might indicate error)
  const allZeros = embedding.every(v => v === 0);
  if (allZeros) {
    issues.push('Embedding vector contains only zeros');
  }
  
  // Check magnitude (should be reasonable)
  const magnitude = Math.sqrt(
    embedding.reduce((sum, v) => sum + v * v, 0)
  );
  if (magnitude < 0.001) {
    issues.push(`Very small magnitude: ${magnitude}`);
  }
  if (magnitude > 100) {
    issues.push(`Very large magnitude: ${magnitude}`);
  }
  
  return {
    valid: issues.length === 0,
    dimensions: embedding.length,
    expectedDimensions,
    issues,
  };
}

/**
 * Verify embedding integrity in database
 */
export async function verifyChapterEmbedding(chapterId: string): Promise<{
  valid: boolean;
  issues: string[];
  embeddingExists: boolean;
  validation?: EmbeddingValidation;
}> {
  const result = await db.query(
    `SELECT embedding_vector, embedding_version
     FROM recent_chapters
     WHERE chapter_id = $1`,
    [chapterId]
  );
  
  if (result.rows.length === 0) {
    return {
      valid: false,
      issues: ['Chapter not found'],
      embeddingExists: false,
    };
  }
  
  const row = result.rows[0];
  
  if (!row.embedding_vector) {
    return {
      valid: false,
      issues: ['No embedding vector found'],
      embeddingExists: false,
    };
  }
  
  // Convert pgvector to array if needed
  let embedding: number[];
  if (Array.isArray(row.embedding_vector)) {
    embedding = row.embedding_vector;
  } else if (typeof row.embedding_vector === 'string') {
    const cleaned = row.embedding_vector.replace(/[\[\]]/g, '');
    embedding = cleaned.split(',').map(Number);
  } else {
    return {
      valid: false,
      issues: ['Invalid embedding format'],
      embeddingExists: true,
    };
  }
  
  const validation = validateEmbedding(embedding, 384);
  
  return {
    valid: validation.valid,
    issues: validation.issues,
    embeddingExists: true,
    validation,
  };
}

/**
 * Verify content hash matches stored content
 */
export async function verifyContentHash(chapterId: string): Promise<{
  valid: boolean;
  hashMatches: boolean;
  storedHash?: string;
  calculatedHash?: string;
}> {
  const result = await db.query(
    `SELECT content, content_hash
     FROM recent_chapters
     WHERE chapter_id = $1`,
    [chapterId]
  );
  
  if (result.rows.length === 0) {
    return {
      valid: false,
      hashMatches: false,
    };
  }
  
  const row = result.rows[0];
  const storedHash = row.content_hash;
  const content = row.content;
  
  if (!storedHash || !content) {
    return {
      valid: false,
      hashMatches: false,
      storedHash,
    };
  }
  
  // Calculate hash from content
  const { calculateContentHash } = await import('./contentHash');
  const calculatedHash = calculateContentHash(content);
  
  return {
    valid: true,
    hashMatches: storedHash === calculatedHash,
    storedHash,
    calculatedHash,
  };
}

/**
 * Check data integrity for a chapter
 */
export async function checkChapterIntegrity(chapterId: string): Promise<{
  valid: boolean;
  issues: string[];
  embeddingCheck?: any;
  hashCheck?: any;
}> {
  const issues: string[] = [];
  
  // Check embedding
  const embeddingCheck = await verifyChapterEmbedding(chapterId);
  if (!embeddingCheck.valid) {
    issues.push(...embeddingCheck.issues);
  }
  
  // Check content hash
  const hashCheck = await verifyContentHash(chapterId);
  if (!hashCheck.valid || !hashCheck.hashMatches) {
    issues.push('Content hash mismatch');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    embeddingCheck,
    hashCheck,
  };
}

