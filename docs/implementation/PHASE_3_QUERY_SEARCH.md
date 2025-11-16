# Phase 3: Query & Search
**Priority:** HIGH  
**Timeline:** Week 5-6  
**Prerequisites:** Phase 2 Complete

---

## 📋 Overview

Phase 3 implements query & search functionality:
- Query classification service
- Context retrieval service
- Semantic search service
- Hybrid search (vector + keyword)
- Context fusion & prompt construction
- Agent integration

---

## ✅ Implementation Checklist

### Week 5: Query Services

#### Day 21-22: Query Classification
- [ ] Implement query classification service
- [ ] Add query type detection (BOOK_LEVEL, CHAPTER_LEVEL, MIXED)
- [ ] Add keyword extraction
- [ ] Add classification tests

#### Day 23-24: Context Retrieval
- [ ] Implement book-level context retrieval
- [ ] Implement chapter-level context retrieval
- [ ] Implement recent chapters query (time-based)
- [ ] Add context combination logic

#### Day 25: Semantic Search (Basic)
- [ ] Implement basic semantic search
- [ ] Add chapter-level vector search
- [ ] Add distance calculation
- [ ] Add result ranking

### Week 6: Advanced Search & Agent Integration

#### Day 26-27: Hierarchical Search
- [ ] Implement two-stage search (chapter → chunk)
- [ ] Add chunk-level vector search
- [ ] Add context expansion (surrounding chunks)
- [ ] Add combined distance calculation

#### Day 28-29: Hybrid Search & Context Fusion
- [ ] Implement hybrid search (vector + keyword)
- [ ] Add keyword boosting
- [ ] Implement context fusion service
- [ ] Add prompt construction service

#### Day 30: Agent Integration & Testing
- [ ] Integrate query services with agent
- [ ] Add agent routing logic
- [ ] Add integration tests
- [ ] Performance testing

---

## 🔧 Service Implementations

### 1. Query Classification Service

**File:** `server/services/queryClassificationService.ts`

```typescript
export enum QueryType {
  BOOK_LEVEL = 'book_level',
  CHAPTER_LEVEL = 'chapter_level',
  MIXED = 'mixed',
}

interface QueryClassification {
  type: QueryType;
  keywords: string[];
  confidence: number;
}

/**
 * Classify query to determine which storage to use
 */
export function classifyQuery(query: string): QueryClassification {
  const queryLower = query.toLowerCase();
  
  // Book-level keywords
  const bookLevelKeywords = [
    'main character', 'overall', 'book', 'story',
    'world', 'setting', 'theme', 'arc',
    'summary', 'characters', 'plot',
    'who is', 'what is the',
  ];
  
  // Chapter-level keywords
  const chapterLevelKeywords = [
    'this chapter', 'this scene', 'recent',
    'current', 'now', 'next', 'last',
    'what happens', 'what should',
    'in this', 'in the recent',
  ];
  
  // Check for book-level indicators
  const hasBookLevel = bookLevelKeywords.some(keyword => 
    queryLower.includes(keyword)
  );
  
  // Check for chapter-level indicators
  const hasChapterLevel = chapterLevelKeywords.some(keyword => 
    queryLower.includes(keyword)
  );
  
  // Determine query type
  let type: QueryType;
  let confidence = 0.5;
  
  if (hasBookLevel && hasChapterLevel) {
    type = QueryType.MIXED;
    confidence = 0.9;
  } else if (hasBookLevel) {
    type = QueryType.BOOK_LEVEL;
    confidence = 0.8;
  } else if (hasChapterLevel) {
    type = QueryType.CHAPTER_LEVEL;
    confidence = 0.8;
  } else {
    // Default: use both
    type = QueryType.MIXED;
    confidence = 0.6;
  }
  
  // Extract keywords
  const keywords = extractKeywords(query);
  
  return {
    type,
    keywords,
    confidence,
  };
}

/**
 * Extract keywords from query
 */
function extractKeywords(query: string): string[] {
  // Simple keyword extraction (can be enhanced with NLP)
  const words = query.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 
                     'what', 'who', 'where', 'when', 'how', 'this', 'that'];
  
  const keywords = words.filter(word => 
    word.length > 3 && !stopWords.includes(word)
  );
  
  return [...new Set(keywords)]; // Remove duplicates
}
```

---

### 2. Context Retrieval Service

**File:** `server/services/contextRetrievalService.ts`

```typescript
import { db } from '../db/connection';
import { QueryType, classifyQuery } from './queryClassificationService';

interface BookContext {
  book_id: string;
  summary: string;
  characters: any[];
  world_setting: any;
  writing_style: any;
  story_arc: any;
  metadata: any;
}

interface ChapterContext {
  chapter_id: string;
  chapter_number: number;
  title: string;
  content: string;
  summary: string;
  key_scenes: any[];
  character_appearances: any[];
  plot_points: any;
  embedding_vector: number[];
  updated_at: Date;
}

interface AgentContext {
  book_context?: BookContext;
  recent_chapters?: ChapterContext[];
  semantic_results?: SearchResult[];
  query_type: QueryType;
}

/**
 * Get book-level context
 */
export async function getBookLevelContext(
  bookId: string
): Promise<BookContext | null> {
  const result = await db.query(
    `SELECT * FROM book_contexts WHERE book_id = $1`,
    [bookId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get chapter-level context (5 most recent)
 */
export async function getChapterLevelContext(
  bookId: string,
  limit: number = 5
): Promise<ChapterContext[]> {
  const result = await db.query(
    `SELECT * FROM recent_chapters 
     WHERE book_id = $1 
     ORDER BY updated_at DESC 
     LIMIT $2`,
    [bookId, limit]
  );
  
  return result.rows;
}

/**
 * Get context for agent query
 */
export async function getContextForQuery(
  bookId: string,
  query: string
): Promise<AgentContext> {
  // Classify query
  const classification = classifyQuery(query);
  
  let bookContext: BookContext | null = null;
  let recentChapters: ChapterContext[] = [];
  let semanticResults: SearchResult[] | null = null;
  
  // Route to appropriate storage(s)
  switch (classification.type) {
    case QueryType.BOOK_LEVEL:
      // Only need book context
      bookContext = await getBookLevelContext(bookId);
      break;
      
    case QueryType.CHAPTER_LEVEL:
      // Only need recent chapters
      recentChapters = await getChapterLevelContext(bookId);
      // + semantic search if query provided
      semanticResults = await semanticSearch(query, bookId);
      break;
      
    case QueryType.MIXED:
    default:
      // Need both
      [bookContext, recentChapters] = await Promise.all([
        getBookLevelContext(bookId),
        getChapterLevelContext(bookId),
      ]);
      // + semantic search
      semanticResults = await semanticSearch(query, bookId);
      break;
  }
  
  return {
    book_context: bookContext || undefined,
    recent_chapters: recentChapters.length > 0 ? recentChapters : undefined,
    semantic_results: semanticResults || undefined,
    query_type: classification.type,
  };
}
```

---

### 3. Semantic Search Service

**File:** `server/services/semanticSearchService.ts`

```typescript
import { db } from '../db/connection';
import { generateEmbedding } from './vertexEmbeddingService';

interface SearchResult {
  chapter_id: string;
  chapter_number: number;
  title: string;
  content: string;
  summary: string;
  distance: number;
  matched_chunks?: ChunkMatch[];
}

interface ChunkMatch {
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
  
  // 2. Search chapters
  const result = await db.query(
    `SELECT 
      chapter_id,
      chapter_number,
      title,
      content,
      summary,
      embedding_vector <=> $1::vector AS distance
     FROM recent_chapters
     WHERE book_id = $2
       AND embedding_vector IS NOT NULL
     ORDER BY embedding_vector <=> $1::vector
     LIMIT $3`,
    [queryEmbedding, bookId, limit]
  );
  
  return result.rows.map(row => ({
    chapter_id: row.chapter_id,
    chapter_number: row.chapter_number,
    title: row.title,
    content: row.content,
    summary: row.summary,
    distance: row.distance,
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
  
  // Stage 1: Chapter-level search (broad, fast)
  const chapterResults = await db.query(
    `SELECT 
      chapter_id,
      chapter_number,
      title,
      embedding_vector <=> $1::vector AS chapter_distance
     FROM recent_chapters
     WHERE book_id = $2
       AND embedding_vector IS NOT NULL
     ORDER BY embedding_vector <=> $1::vector
     LIMIT $3`,
    [queryEmbedding, bookId, chapterLimit]
  );
  
  if (chapterResults.rows.length === 0) {
    return [];
  }
  
  const chapterIds = chapterResults.rows.map(ch => ch.chapter_id);
  
  // Stage 2: Chunk-level search within relevant chapters (precise)
  const chunkResults = await db.query(
    `SELECT 
      cc.chapter_id,
      cc.chunk_index,
      cc.chunk_text,
      cc.chunk_embedding <=> $1::vector AS chunk_distance,
      rc.chapter_number,
      rc.title,
      rc.embedding_vector <=> $1::vector AS chapter_distance,
      (cc.chunk_embedding <=> $1::vector * 0.7 + 
       rc.embedding_vector <=> $1::vector * 0.3) AS combined_distance
     FROM chapter_chunks cc
     JOIN recent_chapters rc ON cc.chapter_id = rc.chapter_id
     WHERE cc.chapter_id = ANY($2::uuid[])
       AND cc.chunk_embedding IS NOT NULL
     ORDER BY combined_distance
     LIMIT $3`,
    [queryEmbedding, chapterIds, chunkLimit]
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
      title: chapter.title,
      content: chapter.content,
      summary: chapter.summary,
      distance: matches[0].combined_distance,
      matched_chunks: contextChunks.rows.map((chunk: any) => ({
        chunk_index: chunk.chunk_index,
        chunk_text: chunk.chunk_text,
        distance: matches.find((m: any) => m.chunk_index === chunk.chunk_index)?.chunk_distance || 0,
      })),
    });
  }
  
  return results.sort((a, b) => a.distance - b.distance);
}
```

---

### 4. Hybrid Search Service

**File:** `server/services/hybridSearchService.ts`

```typescript
import { db } from '../db/connection';
import { generateEmbedding } from './vertexEmbeddingService';
import { extractKeywords } from './queryClassificationService';

interface HybridSearchResult {
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
    [queryEmbedding, bookId, limit * 2] // Get more for keyword filtering
  );
  
  // 4. Keyword search
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
  
  const keywordChapterIds = new Set(
    keywordResults.rows.map((r: any) => r.chapter_id)
  );
  
  // 5. Combine results
  const combined: HybridSearchResult[] = vectorResults.rows.map((row: any) => ({
    chapter_id: row.chapter_id,
    chapter_number: row.chapter_number,
    title: row.title,
    content: row.content,
    summary: row.summary,
    vector_distance: row.vector_distance,
    keyword_match: keywordChapterIds.has(row.chapter_id),
    combined_score: keywordChapterIds.has(row.chapter_id) 
      ? row.vector_distance * 0.5  // Boost keyword matches
      : row.vector_distance,
  }));
  
  // 6. Sort by combined score
  combined.sort((a, b) => a.combined_score - b.combined_score);
  
  return combined.slice(0, limit);
}
```

---

### 5. Context Fusion & Prompt Construction

**File:** `server/services/promptConstructionService.ts`

```typescript
import { AgentContext } from './contextRetrievalService';

interface PromptOptions {
  maxContextLength?: number;
  includeFullContent?: boolean;
  prioritizeRecent?: boolean;
}

/**
 * Construct prompt for agent
 */
export function constructAgentPrompt(
  userQuery: string,
  context: AgentContext,
  options: PromptOptions = {}
): string {
  const {
    maxContextLength = 8000,
    includeFullContent = false,
    prioritizeRecent = true,
  } = options;
  
  let prompt = `You are a writing assistant helping the author.\n\n`;
  let currentLength = prompt.length;
  
  // 1. Book-level context (background)
  if (context.book_context) {
    prompt += `## Book Context:\n`;
    prompt += `Title: ${context.book_context.title || 'Untitled'}\n`;
    prompt += `Summary: ${context.book_context.summary}\n`;
    
    if (context.book_context.characters) {
      prompt += `Characters: ${JSON.stringify(context.book_context.characters)}\n`;
    }
    
    if (context.book_context.writing_style) {
      prompt += `Writing Style: ${JSON.stringify(context.book_context.writing_style)}\n`;
    }
    
    prompt += `\n`;
    currentLength = prompt.length;
  }
  
  // 2. Recent chapters (immediate context)
  if (context.recent_chapters && context.recent_chapters.length > 0) {
    prompt += `## Recent Chapters (Most Relevant Context):\n`;
    
    // Prioritize most recent first
    const chapters = prioritizeRecent 
      ? context.recent_chapters.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      : context.recent_chapters;
    
    chapters.forEach((chapter, index) => {
      if (currentLength > maxContextLength) return; // Stop if too long
      
      prompt += `\n### Chapter ${chapter.chapter_number}: ${chapter.title || 'Untitled'}\n`;
      prompt += `Summary: ${chapter.summary}\n`;
      
      if (chapter.key_scenes) {
        prompt += `Key Scenes: ${JSON.stringify(chapter.key_scenes)}\n`;
      }
      
      // Include full content for most recent chapter
      if (index === 0 && includeFullContent && chapter.content) {
        const contentPreview = chapter.content.substring(0, 2000);
        prompt += `Full Content: ${contentPreview}...\n`;
      }
      
      currentLength = prompt.length;
    });
    
    prompt += `\n`;
  }
  
  // 3. Semantic search results (specific matches)
  if (context.semantic_results && context.semantic_results.length > 0) {
    prompt += `## Relevant Passages (from semantic search):\n`;
    
    context.semantic_results.slice(0, 5).forEach(result => {
      if (currentLength > maxContextLength) return;
      
      prompt += `\n### ${result.title}\n`;
      prompt += `${result.summary}\n`;
      
      if (result.matched_chunks && result.matched_chunks.length > 0) {
        prompt += `Relevant Excerpts:\n`;
        result.matched_chunks.forEach(chunk => {
          if (currentLength > maxContextLength) return;
          prompt += `- ${chunk.chunk_text.substring(0, 200)}...\n`;
          currentLength = prompt.length;
        });
      }
      
      prompt += `\n`;
      currentLength = prompt.length;
    });
  }
  
  // 4. User query
  prompt += `## User Query:\n${userQuery}\n\n`;
  prompt += `Please provide helpful writing assistance based on the context above.`;
  
  return prompt;
}
```

---

## 🧪 Testing Guide

### Unit Tests
```typescript
// tests/services/queryClassificationService.test.ts
describe('Query Classification', () => {
  it('should classify book-level queries', () => {
    // Test
  });
  
  it('should classify chapter-level queries', () => {
    // Test
  });
});

// tests/services/semanticSearchService.test.ts
describe('Semantic Search', () => {
  it('should perform semantic search', async () => {
    // Test
  });
  
  it('should perform hierarchical search', async () => {
    // Test
  });
});
```

---

## ✅ Acceptance Criteria

### Query Services
- [ ] Query classification working (>80% accuracy)
- [ ] Context retrieval working
- [ ] Semantic search working (<500ms latency)
- [ ] Hybrid search working

### Agent Integration
- [ ] Context fusion working
- [ ] Prompt construction working
- [ ] Agent routing working
- [ ] Integration tests passing

### Performance
- [ ] Query latency <500ms (95th percentile)
- [ ] Search accuracy >80%
- [ ] Context size manageable

---

## 🚀 Next Steps

After completing Phase 3, proceed to:
- **Phase 4**: Async Processing (job queue, background workers)
- Review: `PHASE_4_ASYNC_PROCESSING.md`

---

**Status:** Ready to Start (After Phase 2)  
**Estimated Time:** 2 weeks  
**Priority:** HIGH















