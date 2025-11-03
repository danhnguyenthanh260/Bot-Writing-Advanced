# Storage Architecture Master Plan
## PostgreSQL Database Design for AI Writing Assistant

**Version:** 2.0 - Complete Implementation Plan  
**Last Updated:** 2024  
**Status:** Ready for Implementation

---

## 📋 Mục Lục

1. [Tổng Quan Architecture](#1-tổng-quan-architecture)
2. [Storage Design](#2-storage-design)
3. [Data Normalization Pipeline](#3-data-normalization-pipeline)
4. [Query Strategy & Agent Integration](#4-query-strategy--agent-integration)
5. [Performance & Cost Optimization](#5-performance--cost-optimization)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)

---

## 1. Tổng Quan Architecture

### 1.1. Mục Tiêu

Xây dựng hệ thống storage cho AI Writing Assistant với:
- **Storage 1**: Book Context (Lightweight, Whole Book) - Essential DNA của book
- **Storage 2**: Recent Chapters (Detailed, 5 Chapters) - Immediate writing context
- **Storage 3**: Workspace State - UI state persistence

### 1.2. Design Principles

1. **Separation of Concerns** - Tách biệt book-level vs. chapter-level data
2. **Performance First** - Optimize cho frequent queries
3. **Cost Effective** - Minimize LLM/Embedding API calls
4. **Data Integrity** - Ensure consistency và quality
5. **Scalability** - Support many books và users

### 1.3. Key Decisions

- **Embeddings**: Chỉ dùng cho Storage 2 (Recent Chapters)
- **Rolling Window**: Time-based (updated_at), không phải chapter_number
- **Archive Strategy**: Move to archive, không delete
- **Async Processing**: Background jobs cho heavy tasks
- **Smart Updates**: Chỉ update khi có changes

---

## 2. Storage Design

### 2.1. Storage 1: Book Context (Lightweight, Whole Book)

#### Mục Đích
Store "essential DNA" của book - chỉ thông tin quan trọng cho book-level decisions.

#### Data Structure
```sql
book_contexts (
  book_id UUID PRIMARY KEY,
  summary TEXT,                    -- ~500-1000 words
  characters JSONB,                -- {name, role, description, relationships}
  world_setting JSONB,             -- {locations, rules, timeline}
  writing_style JSONB,             -- {tone, pov, voice}
  story_arc JSONB,                  -- {act1, act2, act3}
  metadata JSONB,                   -- {word_count, chapter_count, genres}
  extraction_model_version TEXT,   -- LLM version used
  extraction_timestamp TIMESTAMP,
  manual_override BOOLEAN DEFAULT FALSE,  -- Lock manual edits
  last_manual_edit TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Characteristics
- **No Embeddings** - Structured JSON only
- **Fast Lookup** - By book_id
- **Stable** - Không tăng trưởng với book length
- **Query Pattern** - Key-value lookup

#### Update Strategy
- **Manual Trigger** - User confirms update
- **Change Detection** - Monitor chapters for significant changes
- **Selective Updates** - Chỉ update affected sections
- **Manual Override** - Lock manual edits, không auto-update

#### Normalization Process
```
Raw Google Docs
    ↓
LLM Analysis (Gemini with schema):
  - Full text → Summary (500-1000 words)
  - Extract: characters, world, style, arc
    ↓
Validation Layer:
  - Schema validation
  - Confidence scoring
  - Manual review nếu low confidence
    ↓
Structured JSON → book_contexts table
```

---

### 2.2. Storage 2: Recent Chapters (Detailed, 5 Chapters Window)

#### Mục Đích
Store chi tiết của 5 chapters gần nhất (by updated_at) - immediate writing context.

#### Data Structure
```sql
recent_chapters (
  chapter_id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(book_id),
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,            -- Full chapter text
  summary TEXT,                     -- ~200 words
  key_scenes JSONB,                 -- Scene descriptions
  character_appearances JSONB,      -- Characters in chapter
  plot_points JSONB,               -- Events, conflicts, resolutions
  writing_notes JSONB,             -- Author notes, AI suggestions
  content_hash TEXT,                -- SHA256 hash for change detection
  embedding_vector vector(768),     -- pgvector
  embedding_version TEXT,           -- Vertex AI model version
  embedding_timestamp TIMESTAMP,
  extraction_model_version TEXT,    -- LLM version for extraction
  extraction_timestamp TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,             -- For "recent" definition
  INDEX (book_id, updated_at DESC)  -- For recent query
)

-- For long chapters: Chunk-level embeddings
chapter_chunks (
  chunk_id UUID PRIMARY KEY,
  chapter_id UUID REFERENCES recent_chapters(chapter_id),
  chunk_index INTEGER,
  chunk_text TEXT,
  chunk_embedding vector(768),
  word_count INTEGER,
  created_at TIMESTAMP,
  UNIQUE(chapter_id, chunk_index)
)
```

#### Characteristics
- **Full Text Storage** - Complete chapter content
- **With Embeddings** - 768 dimensions (Vertex AI)
- **Rolling Window** - 5 most recent by updated_at
- **Hierarchical** - Chapter-level + chunk-level embeddings

#### Update Strategy
- **Time-Based "Recent"** - ORDER BY updated_at DESC LIMIT 5
- **Change Detection** - Content hash comparison
- **Smart Caching** - Cache embeddings với hash
- **Archive Strategy** - Move to archive, không delete

#### Normalization Process
```
Raw Chapter Content
    ↓
Content Hash → Check Cache
    ↓ (if changed)
For Each Chapter (5 most recent):
  1. Full text → content
  2. LLM Extraction:
     - Summary (~200 words)
     - Key scenes, characters, plot points
  3. Embedding Generation:
     - Chapter-level: From summary (broad context)
     - Chunk-level: If >800 words, chunk and embed (precise search)
    ↓
Store in recent_chapters + chapter_chunks
```

---

### 2.3. Storage 3: Workspace State

#### Mục Đích
Persist workspace state cho user experience - UI state, selections, messages.

#### Data Structure
```sql
workspaces (
  workspace_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  name TEXT,
  selected_book_id UUID REFERENCES books(book_id),
  selected_chapter_id UUID REFERENCES recent_chapters(chapter_id),
  settings JSONB,                  -- {theme, preferences}
  latest_chat_message_id UUID,      -- Reference to most recent
  active_canvas_pages UUID[],      -- References to active pages
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_accessed_at TIMESTAMP,
  INDEX (user_id, last_accessed_at DESC)
)

-- Separate tables for large data
workspace_chat_messages (
  message_id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(workspace_id),
  message JSONB,                   -- {id, role, text, timestamp}
  created_at TIMESTAMP,
  INDEX (workspace_id, created_at DESC)
  -- Auto-truncate: Keep only last 50 messages
)

workspace_canvas_pages (
  page_id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(workspace_id),
  page_data JSONB,                 -- {id, title, position, size, content}
  updated_at TIMESTAMP,
  INDEX (workspace_id, updated_at DESC)
  -- Auto-truncate: Keep only last 20 pages
)
```

#### Characteristics
- **JSONB Storage** - Flexible schema
- **Size Limits** - Auto-truncate to prevent bloat
- **Separate Tables** - For large data (chat, canvas)
- **Soft Delete** - Mark deleted, không hard delete

#### Update Strategy
- **Auto-Save** - Save state on changes
- **Auto-Truncate** - Keep only recent data
- **Archive Old** - Move old messages/pages to archive

---

## 3. Data Normalization Pipeline

### 3.1. Input Processing Flow

```
Google Docs Input
    ↓
[Phase 1: Basic Info] (Immediate, ~1s)
  - Extract: title, word_count, chapter_count
  - Save to books table
  - Return immediately to user
    ↓
[Phase 2: Quick Summary] (Fast, ~5s)
  - Generate simple summary
  - Save to book_contexts (draft)
  - User can start working
    ↓
[Phase 3: Full Analysis] (Background, ~30-60s)
  - LLM extraction: characters, world, style, arc
  - Validation & confidence scoring
  - Update book_contexts (final)
    ↓
[Phase 4: Chapter Processing] (Background, ~2-5min)
  - Split into chapters
  - Extract metadata for each chapter
  - Save to recent_chapters
    ↓
[Phase 5: Embeddings] (Background, ~5-10min)
  - Generate embeddings for 5 recent chapters
  - Cache với content hash
  - Complete
```

### 3.2. LLM Extraction Strategy

#### For Book Context (Storage 1)

**Prompt Template:**
```
Analyze this book and extract structured information:

Book Title: {title}
Full Text: {full_text}

Extract:
1. Summary: 500-1000 words comprehensive summary
2. Characters: List all characters with:
   - Name, role, description, relationships
3. World Setting: Locations, rules, timeline
4. Writing Style: Tone, POV, voice characteristics
5. Story Arc: 3-act structure summary

Return as JSON following this schema: {schema}
```

**Settings:**
- Model: Gemini Pro
- Temperature: 0.3 (for consistency)
- Schema validation: Required
- Confidence scoring: Calculate based on validation

**Validation:**
```typescript
interface BookContextSchema {
  summary: string;           // Required, 500-1000 words
  characters: Character[];    // Required, min 1
  world_setting: WorldSetting; // Optional
  writing_style: WritingStyle; // Required
  story_arc: StoryArc;        // Required
}

interface ValidationResult {
  valid: boolean;
  confidence: number;        // 0-1
  errors: ValidationError[];
  warnings: string[];
}
```

#### For Chapter Context (Storage 2)

**Prompt Template:**
```
Analyze this chapter and extract:

Chapter: {chapter_number} - {title}
Content: {content}

Extract:
1. Summary: ~200 words chapter summary
2. Key Scenes: List important scenes with descriptions
3. Character Appearances: Which characters appear and what they do
4. Plot Points: Events, conflicts, resolutions in this chapter
5. Writing Notes: Any notable writing patterns or suggestions

Return as JSON following this schema: {schema}
```

**Settings:**
- Model: Gemini Pro
- Temperature: 0.3
- Chunking: If >2000 words, process in chunks

### 3.3. Embedding Generation Strategy

#### Vertex AI Embeddings

**Model Selection:**
- **For Storage 2 (Chapters)**: `text-embedding-004` (768 dimensions)
- **For Critical Queries**: `text-embedding-004` (1536 dimensions) - optional

**Strategy:**
1. **Content Hash Check** - Calculate SHA256 hash
2. **Cache Lookup** - Check if embedding exists for hash
3. **Generate if Needed** - Call Vertex AI only if changed
4. **Store with Hash** - Cache embedding with hash

**Hierarchical Embeddings for Long Chapters:**
```
Chapter Content (>800 words)
    ↓
1. Generate Summary
2. Embed Summary → Chapter-level embedding (broad context)
    ↓
3. Chunk Content (800 words/chunk, 100 words overlap)
4. Embed Each Chunk → Chunk-level embeddings (precise search)
    ↓
Store both levels:
- Chapter embedding: For broad semantic search
- Chunk embeddings: For detailed scene search
```

---

## 4. Query Strategy & Agent Integration

### 4.1. Query Classification

**Query Types:**
- **BOOK_LEVEL**: "Who is the main character?", "What is the story arc?"
- **CHAPTER_LEVEL**: "What happens in this scene?", "What should happen next?"
- **MIXED**: "How has character X changed?", "What is the relationship between A and B?"

**Classification Logic:**
```typescript
function classifyQuery(query: string): QueryType {
  const bookLevelKeywords = [
    'main character', 'overall', 'book', 'story',
    'world', 'setting', 'theme', 'arc'
  ];
  
  const chapterLevelKeywords = [
    'this chapter', 'this scene', 'recent',
    'current', 'now', 'next'
  ];
  
  const hasBookLevel = bookLevelKeywords.some(k => 
    query.toLowerCase().includes(k)
  );
  const hasChapterLevel = chapterLevelKeywords.some(k => 
    query.toLowerCase().includes(k)
  );
  
  if (hasBookLevel && hasChapterLevel) return QueryType.MIXED;
  if (hasBookLevel) return QueryType.BOOK_LEVEL;
  if (hasChapterLevel) return QueryType.CHAPTER_LEVEL;
  
  return QueryType.MIXED; // Default: use both
}
```

### 4.2. Context Retrieval

#### Book-Level Query
```typescript
async function getBookLevelContext(bookId: string): Promise<BookContext> {
  return await db.book_contexts.findOne({
    where: { book_id: bookId },
  });
}
```

#### Chapter-Level Query
```typescript
async function getChapterLevelContext(
  bookId: string,
  query?: string
): Promise<ChapterContext[]> {
  // Get 5 most recent chapters
  const recentChapters = await db.recent_chapters.findMany({
    where: { book_id: bookId },
    orderBy: { updated_at: 'desc' },
    take: 5,
  });
  
  // Semantic search if query provided
  if (query) {
    const queryEmbedding = await vertexAI.embedContent(query);
    const semanticResults = await semanticSearch(
      queryEmbedding,
      bookId,
      recentChapters
    );
    return semanticResults;
  }
  
  return recentChapters;
}
```

#### Semantic Search Strategy

**Two-Stage Search:**
```typescript
async function semanticSearch(
  queryEmbedding: number[],
  bookId: string
): Promise<SearchResult[]> {
  // Stage 1: Chapter-level search (broad, fast)
  const relevantChapters = await db.query(`
    SELECT chapter_id, 
           chapter_embedding <=> $1::vector AS distance
    FROM recent_chapters
    WHERE book_id = $2
    ORDER BY chapter_embedding <=> $1::vector
    LIMIT 10
  `, [queryEmbedding, bookId]);
  
  // Stage 2: Chunk-level search within relevant chapters (precise)
  const chapterIds = relevantChapters.map(ch => ch.chapter_id);
  const relevantChunks = await db.query(`
    SELECT 
      cc.chunk_id,
      cc.chunk_text,
      cc.chunk_index,
      cc.chapter_id,
      cc.chunk_embedding <=> $1::vector AS chunk_distance,
      rc.chapter_embedding <=> $1::vector AS chapter_distance,
      (cc.chunk_embedding <=> $1::vector * 0.7 + 
       rc.chapter_embedding <=> $1::vector * 0.3) AS combined_distance
    FROM chapter_chunks cc
    JOIN recent_chapters rc ON cc.chapter_id = rc.chapter_id
    WHERE cc.chapter_id = ANY($2::uuid[])
    ORDER BY combined_distance
    LIMIT 20
  `, [queryEmbedding, chapterIds]);
  
  // Stage 3: Expand context (get surrounding chunks)
  return await expandContext(relevantChunks);
}
```

#### Hybrid Search (Vector + Keyword)
```sql
WITH vector_results AS (
  SELECT chapter_id, embedding_vector <=> $1::vector AS distance
  FROM recent_chapters
  WHERE book_id = $2
  ORDER BY embedding_vector <=> $1::vector
  LIMIT 20
),
keyword_results AS (
  SELECT chapter_id
  FROM recent_chapters
  WHERE book_id = $2
    AND (content ILIKE '%' || $3 || '%'
         OR title ILIKE '%' || $3 || '%')
  LIMIT 10
)
SELECT DISTINCT 
  v.chapter_id, 
  v.distance,
  CASE WHEN k.chapter_id IS NOT NULL THEN 0 ELSE 1 END AS keyword_boost
FROM vector_results v
LEFT JOIN keyword_results k ON v.chapter_id = k.chapter_id
ORDER BY keyword_boost, v.distance
LIMIT 10;
```

### 4.3. Context Fusion & Prompt Construction

**Strategy:**
- **Priority Order**: Recent Chapters > Semantic Results > Book Context
- **Progressive Detail**: Summary → Key points → Full text
- **Optimized Prompt**: Combine intelligently

**Prompt Template:**
```typescript
function constructAgentPrompt(
  userQuery: string,
  context: AgentContext
): string {
  let prompt = `You are a writing assistant helping the author.\n\n`;
  
  // 1. Book-level context (background)
  if (context.book_context) {
    prompt += `## Book Context:\n`;
    prompt += `Title: ${context.book_context.title}\n`;
    prompt += `Summary: ${context.book_context.summary}\n`;
    prompt += `Characters: ${JSON.stringify(context.book_context.characters)}\n`;
    prompt += `Writing Style: ${JSON.stringify(context.book_context.writing_style)}\n\n`;
  }
  
  // 2. Recent chapters (immediate context)
  if (context.recent_chapters && context.recent_chapters.length > 0) {
    prompt += `## Recent Chapters (Most Relevant Context):\n`;
    context.recent_chapters.forEach((chapter, index) => {
      prompt += `\n### Chapter ${chapter.chapter_number}: ${chapter.title}\n`;
      prompt += `Summary: ${chapter.summary}\n`;
      prompt += `Key Scenes: ${JSON.stringify(chapter.key_scenes)}\n`;
      if (index === 0) {
        // Most recent: include full content
        prompt += `Full Content: ${chapter.content.substring(0, 2000)}...\n`;
      }
    });
    prompt += `\n`;
  }
  
  // 3. Semantic search results (specific matches)
  if (context.semantic_results && context.semantic_results.length > 0) {
    prompt += `## Relevant Passages (from semantic search):\n`;
    context.semantic_results.forEach(result => {
      prompt += `\n${result.full_text}\n`;
    });
    prompt += `\n`;
  }
  
  // 4. User query
  prompt += `## User Query:\n${userQuery}\n\n`;
  prompt += `Please provide helpful writing assistance based on the context above.`;
  
  return prompt;
}
```

---

## 5. Performance & Cost Optimization

### 5.1. Change Detection & Caching

**Content Hash Strategy:**
```typescript
import crypto from 'crypto';

function calculateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

// Embedding cache table
CREATE TABLE embedding_cache (
  content_hash TEXT PRIMARY KEY,
  embedding_vector vector(768),
  model_version TEXT,
  created_at TIMESTAMP,
  INDEX (model_version)
);

// Get or generate embedding
async function getOrGenerateEmbedding(
  content: string,
  chapterId: string
): Promise<number[]> {
  const contentHash = calculateContentHash(content);
  
  // Check cache
  const cached = await db.embedding_cache.findOne({
    where: { 
      content_hash: contentHash,
      model_version: CURRENT_EMBEDDING_MODEL,
    },
  });
  
  if (cached) {
    return cached.embedding_vector;
  }
  
  // Generate new
  const embedding = await vertexAI.embedContent(content);
  
  // Cache it
  await db.embedding_cache.create({
    content_hash: contentHash,
    embedding_vector: embedding,
    model_version: CURRENT_EMBEDDING_MODEL,
  });
  
  return embedding;
}
```

### 5.2. Incremental Updates

**Strategy:**
- **Track changes** với content hash
- **Only re-embed** if hash changed
- **Only re-extract** if content changed significantly

**Implementation:**
```typescript
async function updateChapter(
  chapterId: string,
  newContent: string
): Promise<void> {
  // 1. Get current chapter
  const current = await db.recent_chapters.findOne({
    where: { chapter_id: chapterId },
  });
  
  // 2. Check if content changed
  const newHash = calculateContentHash(newContent);
  if (current.content_hash === newHash) {
    // No change - skip
    return;
  }
  
  // 3. Update content
  await db.recent_chapters.update({
    where: { chapter_id: chapterId },
    data: {
      content: newContent,
      content_hash: newHash,
      updated_at: new Date(),
    },
  });
  
  // 4. Re-embed only if content changed
  const embedding = await getOrGenerateEmbedding(newContent, chapterId);
  await db.recent_chapters.update({
    where: { chapter_id: chapterId },
    data: {
      embedding_vector: embedding,
      embedding_timestamp: new Date(),
    },
  });
  
  // 5. Re-extract metadata (if significant change)
  const changeRatio = calculateChangeRatio(current.content, newContent);
  if (changeRatio > 0.2) {
    // Significant change - re-extract
    const metadata = await extractChapterMetadata(newContent);
    await db.recent_chapters.update({
      where: { chapter_id: chapterId },
      data: {
        summary: metadata.summary,
        key_scenes: metadata.key_scenes,
        character_appearances: metadata.character_appearances,
        plot_points: metadata.plot_points,
      },
    });
  }
}
```

### 5.3. Batch Processing & Rate Limiting

**Job Queue Setup:**
```typescript
import Queue from 'bull';

const processingQueue = new Queue('book-processing', {
  redis: { host: 'localhost', port: 6379 },
});

// Batch embedding generation
class EmbeddingQueue {
  private queue: EmbeddingTask[] = [];
  private processing = false;
  private batchSize = 10;
  private rateLimit = 1000; // ms between batches
  
  async add(task: EmbeddingTask): Promise<void> {
    this.queue.push(task);
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  private async processQueue(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      // Process batch in parallel
      await Promise.all(
        batch.map(task => this.processEmbedding(task))
      );
      
      // Rate limit
      await sleep(this.rateLimit);
    }
    
    this.processing = false;
  }
}
```

### 5.4. pgvector Optimization

**Dynamic Index Tuning:**
```sql
-- Calculate optimal lists for ivfflat
-- Rule: lists = sqrt(rows / 1000)
CREATE OR REPLACE FUNCTION calculate_optimal_lists(table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  row_count INTEGER;
  optimal_lists INTEGER;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
  optimal_lists := GREATEST(10, CEIL(SQRT(row_count / 1000)));
  RETURN optimal_lists;
END;
$$ LANGUAGE plpgsql;

-- Rebuild index with optimal parameters
CREATE OR REPLACE FUNCTION rebuild_embedding_index()
RETURNS void AS $$
DECLARE
  optimal_lists INTEGER;
BEGIN
  SELECT calculate_optimal_lists('recent_chapters') INTO optimal_lists;
  
  DROP INDEX IF EXISTS idx_recent_chapters_embedding;
  
  CREATE INDEX idx_recent_chapters_embedding
  ON recent_chapters
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = optimal_lists);
END;
$$ LANGUAGE plpgsql;

-- Always filter by book_id first
CREATE INDEX idx_recent_chapters_book_embedding
ON recent_chapters (book_id, embedding_vector);
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Priority: CRITICAL**

#### Database Setup
- [ ] Install PostgreSQL với pgvector extension
- [ ] Create database schema (books, book_contexts, recent_chapters, etc.)
- [ ] Setup indexes (book_id, embedding_vector, updated_at)
- [ ] Create archive tables

#### Basic Services
- [ ] Content hash utility
- [ ] Embedding cache service
- [ ] Change detection service
- [ ] Database connection & models

**Deliverables:**
- Database schema deployed
- Basic CRUD operations working
- Change detection functional

---

### Phase 2: Data Normalization (Week 3-4)

**Priority: HIGH**

#### LLM Extraction Services
- [ ] Book context extraction service
- [ ] Chapter metadata extraction service
- [ ] Schema validation layer
- [ ] Confidence scoring
- [ ] Manual review flagging

#### Embedding Services
- [ ] Vertex AI integration
- [ ] Embedding generation service
- [ ] Caching layer với hash
- [ ] Chunking service cho long chapters
- [ ] Hierarchical embedding generation

**Deliverables:**
- Full normalization pipeline
- Validation & quality checks
- Embedding generation with caching

---

### Phase 3: Query & Search (Week 5-6)

**Priority: HIGH**

#### Query Services
- [ ] Query classification service
- [ ] Context retrieval service
- [ ] Semantic search service
- [ ] Hybrid search (vector + keyword)
- [ ] Context fusion service

#### Agent Integration
- [ ] Prompt construction service
- [ ] Context combination logic
- [ ] Agent query routing

**Deliverables:**
- Full query system
- Semantic search working
- Agent integration complete

---

### Phase 4: Async Processing (Week 7-8)

**Priority: MEDIUM**

#### Job Queue System
- [ ] Setup job queue (Bull/BullMQ)
- [ ] Background job processors
- [ ] Status tracking service
- [ ] Progress updates API

#### Async Workflows
- [ ] Book import async workflow
- [ ] Chapter update async workflow
- [ ] Embedding generation queue
- [ ] User notification system

**Deliverables:**
- Background processing system
- Status tracking functional
- User notifications working

---

### Phase 5: Optimization & Polish (Week 9-10)

**Priority: MEDIUM**

#### Performance
- [ ] Index optimization
- [ ] Query optimization
- [ ] Caching layer (Redis)
- [ ] Batch processing improvements

#### Data Management
- [ ] Archive management
- [ ] Auto-truncation services
- [ ] Cleanup jobs
- [ ] Migration tools

**Deliverables:**
- Optimized performance
- Complete data management
- Production-ready

---

## 7. Database Schema

### Complete Schema Definition

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Core tables
CREATE TABLE books (
  book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_doc_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  total_word_count INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (google_doc_id),
  INDEX (created_at DESC)
);

-- Storage 1: Book Context (lightweight)
CREATE TABLE book_contexts (
  book_id UUID PRIMARY KEY REFERENCES books(book_id) ON DELETE CASCADE,
  summary TEXT,                              -- ~500-1000 words
  characters JSONB,                          -- {name, role, description, relationships}
  world_setting JSONB,                       -- {locations, rules, timeline}
  writing_style JSONB,                       -- {tone, pov, voice}
  story_arc JSONB,                          -- {act1, act2, act3}
  metadata JSONB,                            -- {genres, themes, etc}
  extraction_model_version TEXT,            -- LLM version
  extraction_timestamp TIMESTAMP,
  manual_override BOOLEAN DEFAULT FALSE,
  last_manual_edit TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (updated_at DESC)
);

-- Storage 2: Recent Chapters (detailed + embeddings)
CREATE TABLE recent_chapters (
  chapter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,                    -- Full chapter text
  summary TEXT,                             -- ~200 words
  key_scenes JSONB,                        -- Scene descriptions
  character_appearances JSONB,             -- Characters in chapter
  plot_points JSONB,                       -- Events, conflicts, resolutions
  writing_notes JSONB,                     -- Author notes, AI suggestions
  content_hash TEXT NOT NULL,              -- SHA256 hash for change detection
  embedding_vector vector(768),            -- Chapter-level embedding
  embedding_version TEXT,                  -- Vertex AI model version
  embedding_timestamp TIMESTAMP,
  extraction_model_version TEXT,           -- LLM version for extraction
  extraction_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, chapter_number),
  INDEX (book_id, updated_at DESC),        -- For "recent" query
  INDEX (book_id, embedding_vector)        -- For semantic search
);

-- Chunk-level embeddings for long chapters
CREATE TABLE chapter_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES recent_chapters(chapter_id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_embedding vector(768),
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, chunk_index),
  INDEX (chapter_id, chunk_index),
  INDEX (chunk_embedding)                   -- For chunk-level search
);

-- Embedding cache
CREATE TABLE embedding_cache (
  content_hash TEXT PRIMARY KEY,
  embedding_vector vector(768) NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (model_version),
  INDEX (last_accessed_at DESC)
);

-- Chapter archive
CREATE TABLE chapter_archive (
  archive_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  key_scenes JSONB,
  character_appearances JSONB,
  plot_points JSONB,
  writing_notes JSONB,
  content_hash TEXT,
  embedding_vector vector(768),
  embedding_version TEXT,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archive_reason TEXT,                     -- 'window_overflow' | 'manual' | 'book_deleted'
  INDEX (book_id, archived_at DESC)
);

-- Storage 3: Workspaces
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email)
);

CREATE TABLE workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT,
  selected_book_id UUID REFERENCES books(book_id),
  selected_chapter_id UUID REFERENCES recent_chapters(chapter_id),
  settings JSONB,                          -- {theme, preferences}
  latest_chat_message_id UUID,
  active_canvas_pages UUID[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id, last_accessed_at DESC),
  INDEX (selected_book_id)
);

CREATE TABLE workspace_chat_messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  message JSONB NOT NULL,                  -- {id, role, text, timestamp}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (workspace_id, created_at DESC)
  -- Keep only last 50 messages per workspace
);

CREATE TABLE workspace_canvas_pages (
  page_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  page_data JSONB NOT NULL,               -- {id, title, position, size, content}
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (workspace_id, updated_at DESC)
  -- Keep only last 20 pages per workspace
);

-- Processing status tracking
CREATE TABLE processing_status (
  status_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,               -- 'book' | 'chapter'
  entity_id UUID NOT NULL,
  status TEXT NOT NULL,                    -- 'pending' | 'processing' | 'completed' | 'failed'
  progress INTEGER DEFAULT 0,             -- 0-100
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT,
  INDEX (entity_type, entity_id),
  INDEX (status, started_at DESC)
);

-- Change detection tracking
CREATE TABLE book_change_log (
  change_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,               -- 'character_added' | 'world_expanded' | 'plot_changed'
  affected_sections TEXT[],
  change_severity TEXT,                    -- 'low' | 'medium' | 'high'
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  INDEX (book_id, detected_at DESC),
  INDEX (resolved, change_severity)
);

-- Model version tracking
CREATE TABLE embedding_models (
  model_version TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (is_active)
);
```

### Functions & Triggers

```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_book_contexts_updated_at
  BEFORE UPDATE ON book_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recent_chapters_updated_at
  BEFORE UPDATE ON recent_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-truncate chat messages (keep last 50)
CREATE OR REPLACE FUNCTION truncate_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM workspace_chat_messages
  WHERE workspace_id = NEW.workspace_id
    AND message_id NOT IN (
      SELECT message_id
      FROM workspace_chat_messages
      WHERE workspace_id = NEW.workspace_id
      ORDER BY created_at DESC
      LIMIT 50
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_truncate_chat_messages
  AFTER INSERT ON workspace_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION truncate_chat_messages();

-- Auto-truncate canvas pages (keep last 20)
CREATE OR REPLACE FUNCTION truncate_canvas_pages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM workspace_canvas_pages
  WHERE workspace_id = NEW.workspace_id
    AND page_id NOT IN (
      SELECT page_id
      FROM workspace_canvas_pages
      WHERE workspace_id = NEW.workspace_id
      ORDER BY updated_at DESC
      LIMIT 20
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_truncate_canvas_pages
  AFTER INSERT OR UPDATE ON workspace_canvas_pages
  FOR EACH ROW
  EXECUTE FUNCTION truncate_canvas_pages();
```

---

## 8. API Design

### 8.1. Book Management APIs

#### Import Book
```typescript
POST /api/books/import
Body: {
  google_doc_url: string;
  google_doc_id: string;
}
Response: {
  book_id: string;
  status: 'processing';
  progress: 0;
}

GET /api/books/:book_id/status
Response: {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: 0-100;
  error?: string;
}
```

#### Get Book Context
```typescript
GET /api/books/:book_id/context
Response: {
  book_id: string;
  summary: string;
  characters: Character[];
  world_setting: WorldSetting;
  writing_style: WritingStyle;
  story_arc: StoryArc;
  metadata: Metadata;
}
```

#### Update Book Context
```typescript
PUT /api/books/:book_id/context
Body: {
  summary?: string;
  characters?: Character[];
  // ... partial update
  manual_override?: boolean;
}
Response: {
  success: boolean;
  updated_at: timestamp;
}
```

### 8.2. Chapter Management APIs

#### Get Recent Chapters
```typescript
GET /api/books/:book_id/chapters/recent
Query: {
  limit?: number;  // default: 5
}
Response: {
  chapters: Chapter[];
}
```

#### Update Chapter
```typescript
PUT /api/chapters/:chapter_id
Body: {
  content: string;
  title?: string;
}
Response: {
  chapter_id: string;
  status: 'processing';  // if needs re-embedding
  progress?: number;
}
```

#### Semantic Search
```typescript
POST /api/books/:book_id/search
Body: {
  query: string;
  limit?: number;
}
Response: {
  results: SearchResult[];
  query_type: 'book_level' | 'chapter_level' | 'mixed';
}
```

### 8.3. Workspace APIs

#### Get Workspace
```typescript
GET /api/workspaces/:workspace_id
Response: {
  workspace_id: string;
  selected_book_id?: string;
  selected_chapter_id?: string;
  settings: Settings;
  recent_messages: Message[];  // last 10
  active_pages: Page[];        // last 5
}
```

#### Save Workspace State
```typescript
PUT /api/workspaces/:workspace_id
Body: {
  selected_book_id?: string;
  selected_chapter_id?: string;
  settings?: Settings;
}
Response: {
  success: boolean;
  updated_at: timestamp;
}
```

---

## 9. Key Implementation Details

### 9.1. Change Detection

**Content Hash:**
- SHA256 hash của content
- Store với chapter/context
- Compare khi update

**Change Detection Logic:**
```typescript
async function detectChanges(
  bookId: string
): Promise<Change[]> {
  const recentChapters = await getRecentChapters(bookId);
  const bookContext = await getBookContext(bookId);
  
  const changes: Change[] = [];
  
  // Check for new/missing characters
  for (const chapter of recentChapters) {
    const chapterCharacters = extractCharacters(chapter);
    const missingInContext = chapterCharacters.filter(
      char => !bookContext.characters.includes(char)
    );
    
    if (missingInContext.length > 0) {
      changes.push({
        type: 'characters_missing',
        details: missingInContext,
        severity: 'high',
        affected_sections: ['characters'],
      });
    }
  }
  
  return changes;
}
```

### 9.2. Manual Override Protection

**Lock Mechanism:**
```typescript
async function updateBookContext(
  bookId: string,
  updates: Partial<BookContext>
): Promise<void> {
  const current = await getBookContext(bookId);
  
  // Check manual override
  if (current.manual_override) {
    // Check if updating manually edited fields
    const manuallyEditedFields = getManuallyEditedFields(current);
    const updatingManualFields = Object.keys(updates).some(
      field => manuallyEditedFields.includes(field)
    );
    
    if (updatingManualFields) {
      throw new Error(
        'Cannot auto-update manually edited fields. ' +
        'Please unlock or manually update.'
      );
    }
  }
  
  // Safe to update
  await db.book_contexts.update(bookId, updates);
}
```

### 9.3. Rolling Window Management

**Archive & Update Logic:**
```sql
-- Move oldest to archive
CREATE OR REPLACE FUNCTION archive_oldest_chapter(
  p_book_id UUID
) RETURNS UUID AS $$
DECLARE
  oldest_chapter_id UUID;
BEGIN
  -- Find oldest in recent (by updated_at, not window_position)
  SELECT chapter_id INTO oldest_chapter_id
  FROM recent_chapters
  WHERE book_id = p_book_id
  ORDER BY updated_at ASC
  LIMIT 1
  OFFSET 4;  -- Skip to 5th oldest
  
  IF oldest_chapter_id IS NOT NULL THEN
    -- Move to archive
    INSERT INTO chapter_archive
    SELECT * FROM recent_chapters
    WHERE chapter_id = oldest_chapter_id;
    
    -- Delete from recent
    DELETE FROM recent_chapters
    WHERE chapter_id = oldest_chapter_id;
  END IF;
  
  RETURN oldest_chapter_id;
END;
$$ LANGUAGE plpgsql;

-- Get 5 most recent (by updated_at)
CREATE OR REPLACE FUNCTION get_recent_chapters(
  p_book_id UUID
) RETURNS TABLE (
  chapter_id UUID,
  chapter_number INTEGER,
  title TEXT,
  content TEXT,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT rc.chapter_id, rc.chapter_number, rc.title, 
         rc.content, rc.updated_at
  FROM recent_chapters rc
  WHERE rc.book_id = p_book_id
  ORDER BY rc.updated_at DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

---

## 10. Quality Assurance & Monitoring

### 10.1. Data Quality Checks

**Validation Rules:**
- Schema validation cho LLM output
- Confidence scoring (0-1)
- Manual review flagging (confidence < 0.7)
- Content hash verification

**Monitoring:**
- Track extraction confidence scores
- Monitor low-confidence rates
- Track manual review rate
- Alert on anomalies

### 10.2. Performance Monitoring

**Metrics to Track:**
- Query latency (Storage 1, Storage 2, semantic search)
- Embedding generation time
- Cache hit rate
- API call costs
- Database query performance

**Alerts:**
- High latency (>1s for queries)
- Low cache hit rate (<70%)
- High API costs (spike detection)
- Slow embedding generation (>5s)

---

## 11. Migration & Version Management

### 11.1. Model Version Tracking

**Strategy:**
- Track embedding model version per record
- Lazy migration: migrate on-demand
- Background batch for frequently accessed items

**Migration Process:**
```typescript
async function migrateEmbeddings(
  fromVersion: string,
  toVersion: string
): Promise<MigrationResult> {
  // 1. Create migration record
  const migration = await createMigration(fromVersion, toVersion);
  
  // 2. Find all with old version
  const chapters = await db.recent_chapters.findMany({
    where: { embedding_version: fromVersion },
  });
  
  // 3. Process in batches
  const batchSize = 10;
  let processed = 0;
  
  for (let i = 0; i < chapters.length; i += batchSize) {
    const batch = chapters.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async chapter => {
        // Check cache first
        const cached = await checkCache(chapter.content_hash, toVersion);
        if (cached) {
          await db.recent_chapters.update({
            where: { chapter_id: chapter.chapter_id },
            data: {
              embedding_vector: cached.embedding,
              embedding_version: toVersion,
            },
          });
          return;
        }
        
        // Generate new
        const newEmbedding = await vertexAI.embedContent(
          chapter.content,
          { model: toVersion }
        );
        
        // Save
        await db.recent_chapters.update({
          where: { chapter_id: chapter.chapter_id },
          data: {
            embedding_vector: newEmbedding,
            embedding_version: toVersion,
            embedding_timestamp: new Date(),
          },
        });
        
        // Cache
        await cacheEmbedding(chapter.content_hash, newEmbedding, toVersion);
      })
    );
    
    processed += batch.length;
    await updateMigrationProgress(
      migration.id,
      Math.floor((processed / chapters.length) * 100)
    );
  }
  
  return { status: 'completed', processed };
}
```

---

## 12. Cost Optimization Summary

### Embedding Costs
- **Cache Strategy**: Content hash → cache hit rate ~80-90%
- **Selective Updates**: Chỉ re-embed khi content changed
- **Model Selection**: 768 dimensions cho search (cheaper)
- **Batch Processing**: Rate limiting để avoid quota

### LLM Costs
- **Schema Constraints**: Reduce retries với invalid output
- **Incremental Updates**: Chỉ extract changed sections
- **Batch Analysis**: Process multiple chapters together
- **Cache Summaries**: Cache LLM summaries với hash

### Database Costs
- **Index Optimization**: Proper indexes for queries
- **Partitioning**: By book_id for large datasets
- **Archive Strategy**: Move old data to cheaper storage
- **Auto-Truncation**: Limit JSONB sizes

---

## 13. Testing Strategy

### Unit Tests
- Content hash calculation
- Change detection logic
- Query classification
- Context fusion

### Integration Tests
- Full normalization pipeline
- Embedding generation & caching
- Semantic search queries
- Rolling window updates

### Performance Tests
- Query latency benchmarks
- Embedding generation time
- Cache hit rate measurement
- Concurrent request handling

---

## 14. Documentation & Maintenance

### Developer Documentation
- Schema documentation
- API documentation
- Workflow diagrams
- Error handling guide

### Operations Documentation
- Database backup procedures
- Migration procedures
- Monitoring setup
- Troubleshooting guide

---

## 15. Success Metrics

### Performance Metrics
- Query latency: <500ms (95th percentile)
- Embedding generation: <5s per chapter
- Cache hit rate: >80%
- API cost per book: <$0.50

### Quality Metrics
- Extraction confidence: >0.8 average
- Manual review rate: <10%
- Data consistency: 99.9%
- User satisfaction: >4.5/5

---

## Appendix: Quick Reference

### File Structure
```
server/
├── db/
│   ├── schema.sql              # Complete schema
│   ├── migrations/             # Migration files
│   └── seeds/                  # Seed data
├── services/
│   ├── bookContextService.ts   # Storage 1 operations
│   ├── chapterService.ts       # Storage 2 operations
│   ├── workspaceService.ts     # Storage 3 operations
│   ├── embeddingService.ts     # Embedding generation
│   ├── extractionService.ts   # LLM extraction
│   └── queryService.ts         # Query & search
└── jobs/
    ├── bookProcessingQueue.ts   # Async processing
    └── embeddingQueue.ts      # Embedding generation queue
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
DATABASE_SSL=false

# Vertex AI
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_EMBEDDING_MODEL=text-embedding-004

# Gemini
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-pro

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# Processing
EMBEDDING_BATCH_SIZE=10
EMBEDDING_RATE_LIMIT=1000
```

---

**Version:** 2.0  
**Status:** Ready for Implementation  
**Last Updated:** 2024

*Tài liệu này là master plan tổng hợp tất cả các giải pháp và best practices cho storage architecture.*


