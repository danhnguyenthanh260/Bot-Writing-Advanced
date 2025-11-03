# Solutions for Storage Architecture Issues

## 📋 Tổng Quan Vấn Đề

Bạn đã phân tích rất kỹ các vấn đề tiềm ẩn. Document này sẽ đề xuất giải pháp cụ thể cho từng vấn đề.

---

## I. VẤN ĐỀ DỮ LIỆU & TÍNH NHẤT QUÁN

### 1.1. Chất Lượng & Tính Nhất Quán LLM Extraction

#### Vấn Đề:
- **Hallucination**: LLM có thể bịa thông tin
- **Inconsistency**: Cùng input nhưng output khác nhau
- **Complexity**: Khó extract với văn bản phức tạp
- **Latency**: Phụ thuộc API, độ trễ cao

#### ✅ Giải Pháp:

##### Solution 1: Validation & Verification Layer

**Strategy:**
1. **Structured Output với Schema Validation**
   - Dùng JSON Schema để constrain LLM output
   - Validate structure trước khi save
   - Retry nếu invalid (max 3 attempts)

2. **Confidence Scoring**
   - LLM output confidence score
   - Flag low-confidence extractions cho manual review
   - Store confidence với extracted data

3. **Cross-Validation**
   - Compare multiple LLM passes (optional)
   - Flag inconsistencies
   - Manual review nếu không match

**Implementation:**
```typescript
// Pseudo-code structure
interface ExtractionResult {
  data: StructuredData;
  confidence: number; // 0-1
  validation_errors: string[];
  verified: boolean;
}

async function extractBookContext(bookText: string): Promise<ExtractionResult> {
  // 1. Generate with schema constraint
  const result = await llm.generate({
    prompt: EXTRACTION_PROMPT,
    schema: BOOK_CONTEXT_SCHEMA,
    temperature: 0.3, // Lower for consistency
  });
  
  // 2. Validate structure
  const validation = validateAgainstSchema(result, BOOK_CONTEXT_SCHEMA);
  
  // 3. Calculate confidence
  const confidence = calculateConfidence(result, validation);
  
  // 4. Return with metadata
  return {
    data: result,
    confidence,
    validation_errors: validation.errors,
    verified: confidence > 0.7,
  };
}
```

##### Solution 2: Incremental & Selective Updates

**Strategy:**
- **Not re-extract everything** mỗi lần
- **Track what changed** và chỉ extract changes
- **Manual override** capability cho critical data

**Implementation:**
```typescript
// Track changes in book
interface BookChange {
  type: 'character_added' | 'world_expanded' | 'plot_changed';
  affected_sections: string[];
  change_confidence: number;
}

async function updateBookContext(
  bookId: string,
  changes: BookChange[]
): Promise<void> {
  // Only regenerate affected sections
  for (const change of changes) {
    if (change.type === 'character_added') {
      // Only re-extract characters section
      await updateCharactersSection(bookId, change);
    }
    // Selective updates based on change type
  }
}
```

##### Solution 3: Async Processing với Status Tracking

**Strategy:**
- **Background jobs** cho extraction
- **Status tracking** (pending, processing, completed, failed)
- **User notification** khi hoàn thành
- **Retry mechanism** cho failures

**Implementation:**
```typescript
// Processing status
interface ProcessingStatus {
  book_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  started_at: timestamp;
  completed_at?: timestamp;
  error?: string;
}

// Async processing
async function processBookAsync(bookId: string): Promise<void> {
  // 1. Mark as processing
  await updateStatus(bookId, 'processing', 0);
  
  try {
    // 2. Extract Storage 1 (book context)
    await updateStatus(bookId, 'processing', 25);
    await extractBookContext(bookId);
    
    // 3. Process chapters (Storage 2)
    await updateStatus(bookId, 'processing', 50);
    await processChapters(bookId);
    
    // 4. Generate embeddings
    await updateStatus(bookId, 'processing', 75);
    await generateEmbeddings(bookId);
    
    // 5. Complete
    await updateStatus(bookId, 'completed', 100);
    await notifyUser(bookId, 'completed');
  } catch (error) {
    await updateStatus(bookId, 'failed', -1, error.message);
    await notifyUser(bookId, 'failed');
  }
}
```

##### Solution 4: Model Consistency & Versioning

**Strategy:**
- **Pin LLM model version** cho extraction
- **Version tracking** của extracted data
- **Migration path** khi upgrade model

**Implementation:**
```sql
-- Add version tracking
ALTER TABLE book_contexts ADD COLUMN extraction_model_version TEXT;
ALTER TABLE book_contexts ADD COLUMN extraction_timestamp TIMESTAMP;
ALTER TABLE recent_chapters ADD COLUMN embedding_model_version TEXT;
```

---

### 1.2. Đồng Bộ Giữa Storage 1 & Storage 2

#### Vấn Đề:
- **When to update Storage 1?**
- **Data conflicts** giữa 2 storage
- **Manual vs. Automatic updates**

#### ✅ Giải Pháp:

##### Solution 1: Change Detection & Smart Updates

**Strategy:**
- **Monitor changes** trong chapters
- **Detect significant changes** (character changes, plot shifts)
- **Trigger selective updates** cho Storage 1
- **Manual override** option

**Implementation:**
```typescript
interface ChangeDetection {
  // Detect changes in chapters
  detectChanges(bookId: string): Promise<Change[]> {
    const recentChapters = await getRecentChapters(bookId);
    const bookContext = await getBookContext(bookId);
    
    // Compare and detect
    const changes = [];
    
    // Check character appearances vs. book context
    for (const chapter of recentChapters) {
      const newCharacters = extractCharacters(chapter);
      const missingInContext = newCharacters.filter(
        char => !bookContext.characters.includes(char)
      );
      
      if (missingInContext.length > 0) {
        changes.push({
          type: 'characters_missing',
          details: missingInContext,
          severity: 'high',
        });
      }
    }
    
    return changes;
  }
}

// Smart update trigger
async function updateBookContextIfNeeded(
  bookId: string,
  changes: Change[]
): Promise<void> {
  // Only update if significant changes detected
  const significantChanges = changes.filter(
    c => c.severity === 'high' || c.impact > THRESHOLD
  );
  
  if (significantChanges.length > 0) {
    // Notify user: "Book context may be outdated. Update?"
    // If user confirms → regenerate Storage 1
    await regenerateBookContext(bookId);
  }
}
```

##### Solution 2: Conflict Resolution Strategy

**Strategy:**
- **Priority hierarchy**: Storage 2 (recent) > Storage 1 (summary)
- **Merge strategy** cho conflicting data
- **Timestamp-based** resolution

**Implementation:**
```typescript
// When agent queries
async function getCombinedContext(bookId: string): Promise<CombinedContext> {
  const bookContext = await getBookContext(bookId); // Storage 1
  const recentChapters = await getRecentChapters(bookId); // Storage 2
  
  // Priority: Storage 2 > Storage 1
  // For characters:
  const allCharacters = mergeCharacters(
    bookContext.characters, // Base
    recentChapters.map(ch => ch.character_appearances) // Recent override
  );
  
  // For plot points:
  const plotPoints = [
    ...bookContext.story_arc, // High-level
    ...recentChapters.flatMap(ch => ch.plot_points), // Recent details
  ];
  
  return {
    book: bookContext,
    recent: recentChapters,
    merged: {
      characters: allCharacters,
      plot_points: plotPoints,
    },
  };
}
```

##### Solution 3: Manual Override & User Control

**Strategy:**
- **Allow manual edits** cho Storage 1
- **Lock mechanism** - lock manual data, don't auto-update
- **Diff view** - show what changed, let user decide

**Implementation:**
```sql
-- Add manual override flag
ALTER TABLE book_contexts ADD COLUMN manual_override BOOLEAN DEFAULT FALSE;
ALTER TABLE book_contexts ADD COLUMN last_manual_edit TIMESTAMP;

-- Add change history
CREATE TABLE book_context_history (
  history_id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(book_id),
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  change_source TEXT, -- 'auto' | 'manual' | 'llm'
  changed_at TIMESTAMP
);
```

---

### 1.3. Rolling Window Management

#### Vấn Đề:
- **Data loss** khi delete chapter
- **Definition of "recent"** - by update time or chapter number?
- **Performance** của shift operations

#### ✅ Giải Pháp:

##### Solution 1: Archive Instead of Delete

**Strategy:**
- **Move to archive table** thay vì delete
- **Keep metadata** trong archive
- **Option to restore** if needed

**Implementation:**
```sql
-- Archive table
CREATE TABLE chapter_archive (
  chapter_id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(book_id),
  chapter_number INTEGER,
  title TEXT,
  content TEXT,
  summary TEXT,
  metadata JSONB,
  embedding_vector vector(768),
  archived_at TIMESTAMP,
  archive_reason TEXT -- 'window_overflow' | 'manual' | 'book_deleted'
);

-- Rolling window logic (improved)
CREATE OR REPLACE FUNCTION update_rolling_window(
  p_book_id UUID,
  p_new_chapter_id UUID
) RETURNS void AS $$
DECLARE
  oldest_chapter_id UUID;
BEGIN
  -- Find oldest in window (position 5)
  SELECT chapter_id INTO oldest_chapter_id
  FROM recent_chapters
  WHERE book_id = p_book_id AND window_position = 5;
  
  -- Move oldest to archive (not delete!)
  IF oldest_chapter_id IS NOT NULL THEN
    INSERT INTO chapter_archive
    SELECT * FROM recent_chapters WHERE chapter_id = oldest_chapter_id;
  END IF;
  
  -- Shift positions (efficient batch update)
  UPDATE recent_chapters
  SET window_position = window_position + 1
  WHERE book_id = p_book_id
    AND window_position < 5;
  
  -- Insert new chapter
  INSERT INTO recent_chapters (chapter_id, book_id, window_position)
  VALUES (p_new_chapter_id, p_book_id, 1);
  
  -- Delete from recent (only after archive)
  DELETE FROM recent_chapters WHERE chapter_id = oldest_chapter_id;
END;
$$ LANGUAGE plpgsql;
```

##### Solution 2: Time-Based "Recent" Definition

**Strategy:**
- **Define "recent" by `updated_at`**, not `chapter_number`
- **When user edits old chapter**, it becomes "recent"
- **Dynamic window** - always 5 most recently updated

**Implementation:**
```sql
-- Change from fixed window_position to time-based
-- Remove window_position, use updated_at instead

CREATE OR REPLACE FUNCTION get_recent_chapters(p_book_id UUID)
RETURNS TABLE(chapter_id UUID, ...) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM recent_chapters
  WHERE book_id = p_book_id
  ORDER BY updated_at DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- When chapter updated, it automatically becomes recent
CREATE TRIGGER update_recent_on_edit
AFTER UPDATE ON recent_chapters
FOR EACH ROW
WHEN (NEW.content IS DISTINCT FROM OLD.content)
EXECUTE FUNCTION refresh_recent_window();
```

##### Solution 3: Batch & Optimized Shift Operations

**Strategy:**
- **Single SQL operation** thay vì multiple updates
- **Use CTEs** cho efficiency
- **Index optimization**

**Implementation:**
```sql
-- Optimized single-operation shift
WITH shifted AS (
  UPDATE recent_chapters
  SET window_position = CASE
    WHEN window_position = 4 THEN 5
    WHEN window_position = 3 THEN 4
    WHEN window_position = 2 THEN 3
    WHEN window_position = 1 THEN 2
    ELSE window_position
  END
  WHERE book_id = $1 AND window_position < 5
  RETURNING *
)
INSERT INTO recent_chapters (book_id, chapter_id, window_position)
SELECT $1, $2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM shifted WHERE window_position = 1
);
```

---

### 1.4. JSONB Size & Performance (Storage 3)

#### Vấn Đề:
- **Large JSONB** fields (canvas_state, chat_messages)
- **Performance** issues với large JSONB
- **Automatic truncation** needed

#### ✅ Giải Pháp:

##### Solution 1: Size Limits & Automatic Truncation

**Strategy:**
- **Set max sizes** cho JSONB fields
- **Automatic truncation** khi vượt quá
- **Keep most recent** data, archive old

**Implementation:**
```typescript
// Automatic truncation
async function saveWorkspaceState(
  workspaceId: string,
  state: WorkspaceState
): Promise<void> {
  // Limit chat messages to 50
  if (state.chat_messages.length > 50) {
    // Keep last 50, archive older
    const toArchive = state.chat_messages.slice(0, -50);
    await archiveChatMessages(workspaceId, toArchive);
    state.chat_messages = state.chat_messages.slice(-50);
  }
  
  // Limit canvas pages
  if (state.canvas_state.pages.length > 20) {
    // Keep most recent 20
    state.canvas_state.pages = state.canvas_state.pages
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, 20);
  }
  
  // Save with limits
  await db.workspaces.update(workspaceId, {
    chat_messages: state.chat_messages,
    canvas_state: state.canvas_state,
  });
}
```

##### Solution 2: Separate Tables cho Large Data

**Strategy:**
- **Move large data** to separate tables
- **Reference from workspace** table
- **Better query performance**

**Implementation:**
```sql
-- Separate table for chat messages
CREATE TABLE workspace_chat_messages (
  message_id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(workspace_id),
  message JSONB,
  created_at TIMESTAMP,
  INDEX (workspace_id, created_at DESC)
);

-- Separate table for canvas pages
CREATE TABLE workspace_canvas_pages (
  page_id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(workspace_id),
  page_data JSONB,
  updated_at TIMESTAMP,
  INDEX (workspace_id, updated_at DESC)
);

-- Workspace table only keeps references
ALTER TABLE workspaces DROP COLUMN chat_messages;
ALTER TABLE workspaces DROP COLUMN canvas_state;

-- Add references (optional, for quick access)
ALTER TABLE workspaces ADD COLUMN latest_chat_message_id UUID;
ALTER TABLE workspaces ADD COLUMN active_canvas_pages UUID[];
```

##### Solution 3: JSONB Compression & Indexing

**Strategy:**
- **Gzip compression** cho large JSONB (PostgreSQL native)
- **Partial indexes** cho frequently queried paths
- **JSONB path indexes**

**Implementation:**
```sql
-- Partial index for active pages
CREATE INDEX idx_workspace_active_pages 
ON workspaces 
USING gin ((canvas_state->'pages')) 
WHERE canvas_state->'pages' IS NOT NULL;

-- Index for recent messages query
CREATE INDEX idx_chat_messages_recent 
ON workspace_chat_messages (workspace_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## II. VẤN ĐỀ HIỆU SUẤT & CHI PHÍ

### 2.1. Chi Phí LLM & Embeddings

#### Vấn Đề:
- **High API costs** với frequent updates
- **Re-embedding** khi chỉ có small changes
- **Model choice** (768 vs 1536 dimensions)

#### ✅ Giải Pháp:

##### Solution 1: Smart Caching & Change Detection

**Strategy:**
- **Content hash** để detect changes
- **Only re-embed if content changed**
- **Cache embeddings** with hash

**Implementation:**
```typescript
import crypto from 'crypto';

interface CachedEmbedding {
  content_hash: string;
  embedding_vector: number[];
  model_version: string;
  created_at: timestamp;
}

async function getOrGenerateEmbedding(
  content: string,
  chapterId: string
): Promise<number[]> {
  // 1. Calculate content hash
  const contentHash = crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
  
  // 2. Check cache
  const cached = await db.cached_embeddings.findOne({
    where: { chapter_id: chapterId, content_hash: contentHash },
  });
  
  if (cached && cached.model_version === CURRENT_EMBEDDING_MODEL) {
    // Cache hit - return cached
    return cached.embedding_vector;
  }
  
  // 3. Generate new embedding
  const embedding = await vertexAI.embedContent(content);
  
  // 4. Save to cache
  await db.cached_embeddings.upsert({
    chapter_id: chapterId,
    content_hash: contentHash,
    embedding_vector: embedding,
    model_version: CURRENT_EMBEDDING_MODEL,
  });
  
  return embedding;
}

// Usage
async function updateChapter(chapterId: string, newContent: string) {
  const oldHash = await getContentHash(chapterId);
  const newHash = calculateHash(newContent);
  
  if (oldHash === newHash) {
    // No change - skip embedding
    return;
  }
  
  // Content changed - regenerate
  const embedding = await getOrGenerateEmbedding(newContent, chapterId);
  await saveChapter(chapterId, { content: newContent, embedding });
}
```

##### Solution 2: Incremental Embedding Updates

**Strategy:**
- **Detect changes** in content (diff algorithm)
- **Only re-embed changed sections**
- **Merge embeddings** for chapter

**Implementation:**
```typescript
// Detect changes (simplified)
interface ContentChange {
  type: 'added' | 'deleted' | 'modified';
  section: string;
  old_content: string;
  new_content: string;
}

async function updateChapterEmbedding(
  chapterId: string,
  oldContent: string,
  newContent: string
): Promise<number[]> {
  // 1. Detect changes
  const changes = detectChanges(oldContent, newContent);
  
  // 2. If changes are small (<20% of content), use incremental
  const changeRatio = calculateChangeRatio(changes);
  
  if (changeRatio < 0.2) {
    // Small change - incremental update
    const changedSections = extractChangedSections(changes);
    const oldEmbedding = await getEmbedding(chapterId);
    
    // Re-embed only changed sections
    const newSectionEmbeddings = await Promise.all(
      changedSections.map(section => 
        vertexAI.embedContent(section.new_content)
      )
    );
    
    // Merge embeddings (weighted average)
    const mergedEmbedding = mergeEmbeddings(
      oldEmbedding,
      newSectionEmbeddings,
      changes
    );
    
    return mergedEmbedding;
  } else {
    // Large change - full re-embed
    return await vertexAI.embedContent(newContent);
  }
}
```

##### Solution 3: Model Selection Strategy

**Strategy:**
- **768 dimensions** cho most cases (faster, cheaper)
- **1536 dimensions** cho critical queries (better accuracy)
- **Hybrid approach** - 768 for search, 1536 for critical results

**Implementation:**
```typescript
// Hybrid embedding strategy
async function getEmbedding(
  content: string,
  useCase: 'search' | 'critical'
): Promise<number[]> {
  if (useCase === 'search') {
    // Use 768 for general semantic search
    return await vertexAI.embedContent(content, {
      model: 'text-embedding-004-768',
    });
  } else {
    // Use 1536 for critical accuracy needs
    return await vertexAI.embedContent(content, {
      model: 'text-embedding-004-1536',
    });
  }
}

// Usage
// Storage 2: Use 768 for chapters (general search)
const chapterEmbedding = await getEmbedding(chapterContent, 'search');

// Critical queries: Use 1536
const criticalEmbedding = await getEmbedding(queryText, 'critical');
```

##### Solution 4: Batch Processing & Rate Limiting

**Strategy:**
- **Batch API calls** để reduce costs
- **Rate limiting** để avoid quota issues
- **Queue system** cho async processing

**Implementation:**
```typescript
// Batch embedding generation
class EmbeddingQueue {
  private queue: EmbeddingTask[] = [];
  private processing = false;
  private batchSize = 10;
  
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
      
      // Process batch in parallel (respect rate limits)
      await Promise.all(
        batch.map(task => this.processEmbedding(task))
      );
      
      // Rate limit: wait between batches
      await sleep(1000); // 1 second between batches
    }
    
    this.processing = false;
  }
}
```

---

### 2.2. pgvector Performance

#### Vấn Đề:
- **Index optimization** (ivfflat lists parameter)
- **Performance với large datasets**
- **Query optimization**

#### ✅ Giải Pháp:

##### Solution 1: Dynamic Index Tuning

**Strategy:**
- **Monitor query performance**
- **Auto-tune ivfflat lists** parameter
- **Rebuild index** when needed

**Implementation:**
```sql
-- Calculate optimal lists for ivfflat
-- Rule of thumb: lists = sqrt(rows / 1000)
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
```

##### Solution 2: Partitioning by Book

**Strategy:**
- **Partition table** by book_id
- **Query only relevant partition**
- **Better performance** với many books

**Implementation:**
```sql
-- Partition by book_id (simplified approach)
CREATE INDEX idx_recent_chapters_book_embedding
ON recent_chapters (book_id, embedding_vector);

-- Query strategy: Always filter by book_id first
SELECT *
FROM recent_chapters
WHERE book_id = $1  -- Filter first
  AND embedding_vector <=> $2::vector < 0.7  -- Then similarity search
ORDER BY embedding_vector <=> $2::vector
LIMIT 10;
```

##### Solution 3: Hybrid Search (Vector + Keyword)

**Strategy:**
- **Combine vector similarity** với keyword search
- **Post-filter** results
- **Better recall** than pure vector

**Implementation:**
```sql
-- Hybrid search query
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
SELECT DISTINCT v.chapter_id, v.distance
FROM vector_results v
LEFT JOIN keyword_results k ON v.chapter_id = k.chapter_id
ORDER BY 
  CASE WHEN k.chapter_id IS NOT NULL THEN 0 ELSE 1 END,  -- Boost keyword matches
  v.distance
LIMIT 10;
```

---

### 2.3. Latency & Async Processing

#### Vấn Đề:
- **High latency** khi import book
- **User experience** issues với long waits
- **API dependencies** block UI

#### ✅ Giải Pháp:

##### Solution 1: Progressive Processing

**Strategy:**
- **Show immediate feedback** - basic data first
- **Process in background** - full analysis later
- **Progress updates** - keep user informed

**Implementation:**
```typescript
// Progressive processing workflow
async function importBookAsync(bookId: string): Promise<void> {
  // Phase 1: Immediate (fast)
  await updateStatus(bookId, 'processing', 10);
  await saveBasicBookInfo(bookId); // Title, word count, etc.
  
  // Phase 2: Quick extraction (medium)
  await updateStatus(bookId, 'processing', 30);
  await extractQuickSummary(bookId); // Fast, simple summary
  
  // Phase 3: Detailed analysis (slow, background)
  await updateStatus(bookId, 'processing', 50);
  await extractDetailedContext(bookId); // Full analysis
  
  // Phase 4: Chapters processing (slow)
  await updateStatus(bookId, 'processing', 70);
  await processChapters(bookId); // Extract metadata
  
  // Phase 5: Embeddings (slowest)
  await updateStatus(bookId, 'processing', 90);
  await generateEmbeddings(bookId);
  
  // Complete
  await updateStatus(bookId, 'completed', 100);
}

// User experience
async function importBook(bookData: BookData): Promise<Book> {
  // 1. Create book immediately
  const book = await createBook(bookData);
  
  // 2. Show to user immediately
  await notifyUser('Book created, analyzing...', book.id);
  
  // 3. Start async processing
  importBookAsync(book.id).catch(error => {
    updateStatus(book.id, 'failed');
    notifyUser('Analysis failed', book.id);
  });
  
  return book; // Return immediately
}
```

##### Solution 2: Background Job Queue

**Strategy:**
- **Job queue** (Bull, BullMQ, or custom)
- **Worker processes** handle heavy tasks
- **Status API** for progress tracking

**Implementation:**
```typescript
// Job queue setup
import Queue from 'bull';

const processingQueue = new Queue('book-processing', {
  redis: { host: 'localhost', port: 6379 },
});

// Add job
async function queueBookProcessing(bookId: string): Promise<void> {
  await processingQueue.add({
    bookId,
    type: 'full_analysis',
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

// Worker process
processingQueue.process(async (job) => {
  const { bookId } = job.data;
  
  // Update progress
  job.progress(10);
  await extractBookContext(bookId);
  
  job.progress(50);
  await processChapters(bookId);
  
  job.progress(90);
  await generateEmbeddings(bookId);
  
  job.progress(100);
  return { status: 'completed' };
});

// Status endpoint
app.get('/api/books/:id/status', async (req, res) => {
  const job = await processingQueue.getJob(req.params.id);
  const progress = job?.progress() || 0;
  const status = job?.getState() || 'pending';
  
  res.json({ progress, status });
});
```

---

## III. VẤN ĐỀ THIẾT KẾ & KHẢ NĂNG MỞ RỘNG

### 3.1. Handling Very Long Chapters

#### Vấn Đề:
- **Token limits** của embedding models
- **Semantic dilution** với very long chapters
- **Retrieval strategy** for chunks vs. full chapter

#### ✅ Giải Pháp:

##### Solution 1: Hierarchical Embedding Strategy

**Strategy:**
- **Chapter-level embedding** (summary-based)
- **Chunk-level embeddings** (for detailed search)
- **Hybrid retrieval** strategy

**Implementation:**
```typescript
interface ChapterEmbeddings {
  chapter_id: string;
  chapter_embedding: number[]; // From summary
  chunks: ChunkEmbedding[];
}

interface ChunkEmbedding {
  chunk_id: string;
  chunk_text: string;
  chunk_embedding: number[];
  chunk_index: number; // Position in chapter
  word_count: number;
}

async function embedLongChapter(
  chapterId: string,
  content: string
): Promise<ChapterEmbeddings> {
  // 1. Generate chapter summary
  const summary = await llm.generateSummary(content);
  
  // 2. Chapter-level embedding (from summary)
  const chapterEmbedding = await vertexAI.embedContent(summary);
  
  // 3. Chunk content (500-800 words per chunk)
  const chunks = chunkText(content, { maxWords: 800, overlap: 100 });
  
  // 4. Embed each chunk
  const chunkEmbeddings = await Promise.all(
    chunks.map(async (chunk, index) => ({
      chunk_id: `${chapterId}_chunk_${index}`,
      chunk_text: chunk.text,
      chunk_embedding: await vertexAI.embedContent(chunk.text),
      chunk_index: index,
      word_count: chunk.wordCount,
    }))
  );
  
  return {
    chapter_id: chapterId,
    chapter_embedding: chapterEmbedding,
    chunks: chunkEmbeddings,
  };
}
```

##### Solution 2: Retrieval Strategy

**Strategy:**
- **Two-stage search**: Chapter-level → Chunk-level
- **Context expansion**: Return chunks around matches
- **Ranking**: Combine chapter relevance + chunk relevance

**Implementation:**
```typescript
async function semanticSearch(
  query: string,
  bookId: string
): Promise<SearchResult[]> {
  // 1. Embed query
  const queryEmbedding = await vertexAI.embedContent(query);
  
  // 2. Chapter-level search (fast, broad)
  const relevantChapters = await db.query(`
    SELECT chapter_id, chapter_embedding <=> $1::vector AS distance
    FROM chapter_embeddings
    WHERE book_id = $2
    ORDER BY chapter_embedding <=> $1::vector
    LIMIT 10
  `, [queryEmbedding, bookId]);
  
  // 3. Chunk-level search within relevant chapters (precise)
  const chapterIds = relevantChapters.map(ch => ch.chapter_id);
  const relevantChunks = await db.query(`
    SELECT 
      ce.chunk_id,
      ce.chunk_text,
      ce.chunk_index,
      ce.chapter_id,
      ce.chunk_embedding <=> $1::vector AS chunk_distance,
      ce.chapter_embedding <=> $1::vector AS chapter_distance,
      (ce.chunk_embedding <=> $1::vector + ce.chapter_embedding <=> $1::vector) / 2 AS combined_distance
    FROM chunk_embeddings ce
    WHERE ce.chapter_id = ANY($2::uuid[])
    ORDER BY combined_distance
    LIMIT 20
  `, [queryEmbedding, chapterIds]);
  
  // 4. Expand context (get surrounding chunks)
  const results = await expandContext(relevantChunks);
  
  return results;
}

// Context expansion
async function expandContext(
  chunks: ChunkResult[]
): Promise<ExpandedResult[]> {
  return chunks.map(chunk => {
    // Get previous and next chunks for context
    const contextChunks = [
      ...getChunksInRange(chunk.chapter_id, chunk.chunk_index - 1, chunk.chunk_index),
      chunk,
      ...getChunksInRange(chunk.chapter_id, chunk.chunk_index, chunk.chunk_index + 1),
    ];
    
    return {
      match: chunk,
      context: contextChunks,
      full_text: contextChunks.map(c => c.chunk_text).join('\n\n'),
    };
  });
}
```

---

### 3.2. Agent Query Strategy

#### Vấn Đề:
- **When to use Storage 1 vs Storage 2?**
- **How to combine** contexts effectively?
- **Query routing** logic

#### ✅ Giải Pháp:

##### Solution 1: Query Classification & Routing

**Strategy:**
- **Classify query intent** - book-level or chapter-level?
- **Route to appropriate storage**
- **Combine contexts** intelligently

**Implementation:**
```typescript
enum QueryType {
  BOOK_LEVEL = 'book_level',      // "Who is the main character?"
  CHAPTER_LEVEL = 'chapter_level', // "What happens in this scene?"
  MIXED = 'mixed',                // "How has character X changed?"
}

function classifyQuery(query: string): QueryType {
  // Simple keyword-based classification
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
  
  // Default: use both
  return QueryType.MIXED;
}

async function getContextForQuery(
  bookId: string,
  query: string
): Promise<AgentContext> {
  const queryType = classifyQuery(query);
  
  let bookContext = null;
  let recentChapters = null;
  let semanticResults = null;
  
  switch (queryType) {
    case QueryType.BOOK_LEVEL:
      // Only need book context
      bookContext = await getBookContext(bookId);
      break;
      
    case QueryType.CHAPTER_LEVEL:
      // Only need recent chapters
      recentChapters = await getRecentChapters(bookId);
      // + semantic search if needed
      semanticResults = await semanticSearch(query, bookId);
      break;
      
    case QueryType.MIXED:
    default:
      // Need both
      [bookContext, recentChapters] = await Promise.all([
        getBookContext(bookId),
        getRecentChapters(bookId),
      ]);
      semanticResults = await semanticSearch(query, bookId);
      break;
  }
  
  return {
    book_context: bookContext,
    recent_chapters: recentChapters,
    semantic_results: semanticResults,
    query_type: queryType,
  };
}
```

##### Solution 2: Context Fusion & Prompt Construction

**Strategy:**
- **Merge contexts** from multiple sources
- **Prioritize** recent information
- **Construct optimized prompt** for LLM

**Implementation:**
```typescript
function constructAgentPrompt(
  userQuery: string,
  context: AgentContext
): string {
  let prompt = `You are a writing assistant helping the author.\n\n`;
  
  // Add book-level context (background)
  if (context.book_context) {
    prompt += `## Book Context:\n`;
    prompt += `Title: ${context.book_context.title}\n`;
    prompt += `Summary: ${context.book_context.summary}\n`;
    prompt += `Characters: ${JSON.stringify(context.book_context.characters)}\n`;
    prompt += `Writing Style: ${JSON.stringify(context.book_context.writing_style)}\n\n`;
  }
  
  // Add recent chapters (immediate context)
  if (context.recent_chapters && context.recent_chapters.length > 0) {
    prompt += `## Recent Chapters (Most Relevant Context):\n`;
    context.recent_chapters.forEach((chapter, index) => {
      prompt += `\n### Chapter ${chapter.chapter_number}: ${chapter.title}\n`;
      prompt += `Summary: ${chapter.summary}\n`;
      prompt += `Key Scenes: ${JSON.stringify(chapter.key_scenes)}\n`;
      if (index === 0) {
        // Most recent chapter - include full content
        prompt += `Full Content: ${chapter.content.substring(0, 2000)}...\n`;
      }
    });
    prompt += `\n`;
  }
  
  // Add semantic search results (specific matches)
  if (context.semantic_results && context.semantic_results.length > 0) {
    prompt += `## Relevant Passages (from semantic search):\n`;
    context.semantic_results.forEach(result => {
      prompt += `\n${result.full_text}\n`;
    });
    prompt += `\n`;
  }
  
  // Add user query
  prompt += `## User Query:\n${userQuery}\n\n`;
  prompt += `Please provide helpful writing assistance based on the context above.`;
  
  return prompt;
}
```

---

### 3.3. Model Version Management

#### Vấn Đề:
- **Model upgrades** require re-embedding
- **Version tracking** và migration
- **Cost** of re-embedding everything

#### ✅ Giải Pháp:

##### Solution 1: Version Tracking & Migration Strategy

**Strategy:**
- **Track embedding version** với each record
- **Gradual migration** - only migrate when needed
- **Dual storage** during transition

**Implementation:**
```sql
-- Version tracking
CREATE TABLE embedding_models (
  model_version TEXT PRIMARY KEY,
  model_name TEXT,
  dimensions INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

ALTER TABLE recent_chapters 
ADD COLUMN embedding_version TEXT REFERENCES embedding_models(model_version);

-- Migration tracking
CREATE TABLE embedding_migrations (
  migration_id UUID PRIMARY KEY,
  from_version TEXT,
  to_version TEXT,
  status TEXT, -- 'pending' | 'in_progress' | 'completed' | 'failed'
  progress INTEGER, -- 0-100
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

```typescript
// Gradual migration strategy
async function migrateEmbeddings(
  fromVersion: string,
  toVersion: string
): Promise<void> {
  // 1. Create migration record
  const migration = await createMigration(fromVersion, toVersion);
  
  // 2. Find all records with old version
  const chapters = await db.recent_chapters.findMany({
    where: { embedding_version: fromVersion },
  });
  
  // 3. Process in batches (to avoid overwhelming API)
  const batchSize = 10;
  let processed = 0;
  
  for (let i = 0; i < chapters.length; i += batchSize) {
    const batch = chapters.slice(i, i + batchSize);
    
    // Re-embed with new model
    await Promise.all(
      batch.map(async chapter => {
        const newEmbedding = await vertexAI.embedContent(
          chapter.content,
          { model: toVersion }
        );
        
        await db.recent_chapters.update({
          where: { chapter_id: chapter.chapter_id },
          data: {
            embedding_vector: newEmbedding,
            embedding_version: toVersion,
          },
        });
      })
    );
    
    processed += batch.length;
    await updateMigrationProgress(migration.id, 
      Math.floor((processed / chapters.length) * 100));
  }
  
  // 4. Mark migration complete
  await completeMigration(migration.id);
}
```

##### Solution 2: Lazy Migration

**Strategy:**
- **Migrate on-demand** - only when accessed
- **Cache migration results**
- **Background batch** for frequently accessed items

**Implementation:**
```typescript
// Lazy migration
async function getEmbedding(
  chapterId: string,
  targetVersion: string
): Promise<number[]> {
  const chapter = await db.recent_chapters.findOne({
    where: { chapter_id: chapterId },
  });
  
  // Check if migration needed
  if (chapter.embedding_version === targetVersion) {
    // Already correct version
    return chapter.embedding_vector;
  }
  
  // Migration needed - do it on-demand
  const newEmbedding = await vertexAI.embedContent(
    chapter.content,
    { model: targetVersion }
  );
  
  // Update with new version
  await db.recent_chapters.update({
    where: { chapter_id: chapterId },
    data: {
      embedding_vector: newEmbedding,
      embedding_version: targetVersion,
    },
  });
  
  return newEmbedding;
}
```

---

## IV. IMPLEMENTATION RECOMMENDATIONS

### Priority 1: Core Stability
1. ✅ **Content hash** cho change detection
2. ✅ **Archive strategy** cho rolling window
3. ✅ **Async processing** với status tracking
4. ✅ **Validation layer** cho LLM output

### Priority 2: Performance & Cost
1. ✅ **Smart caching** cho embeddings
2. ✅ **Batch processing** cho API calls
3. ✅ **Incremental updates** thay vì full re-extraction
4. ✅ **Model selection** strategy (768 vs 1536)

### Priority 3: UX & Scalability
1. ✅ **Progressive loading** - show basic data first
2. ✅ **Job queue** cho heavy tasks
3. ✅ **Context fusion** cho agent queries
4. ✅ **Version management** cho model upgrades

### Priority 4: Advanced Features
1. ✅ **Hierarchical embeddings** cho long chapters
2. ✅ **Hybrid search** (vector + keyword)
3. ✅ **Query classification** cho routing
4. ✅ **Dual storage** during migrations

---

## 📊 Updated Architecture Summary

### Storage 1: Book Context
- **Data**: Summary, characters, world, style, arc
- **Update**: Manual trigger hoặc change detection
- **Validation**: Schema validation, confidence scoring
- **No embeddings**: Structured JSON only

### Storage 2: Recent Chapters
- **Data**: Full text, metadata, embeddings
- **Update**: Time-based rolling window (updated_at)
- **Embeddings**: 768 dimensions (cheaper), cached with hash
- **Archive**: Move to archive table, not delete
- **Chunking**: For long chapters (>800 words)

### Storage 3: Workspace
- **Data**: UI state, messages, settings
- **Size limits**: Auto-truncate (50 messages, 20 pages)
- **Separate tables**: For large data (chat_messages, canvas_pages)
- **Performance**: JSONB indexes, compression

---

*Tài liệu này giải quyết các vấn đề tiềm ẩn bạn đã nêu. Bạn có muốn tôi detail hóa phần nào không?*


