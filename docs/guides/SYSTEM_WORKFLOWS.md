# 🔄 Các Luồng Hoạt Động Hệ Thống - Dei8 AI Writing Studio

**Cập nhật:** 2024  
**Mục đích:** Tài liệu chi tiết mô tả tất cả các luồng hoạt động chính của hệ thống

---

## 📋 Mục Lục

1. [Tổng Quan Kiến Trúc](#tổng-quan-kiến-trúc)
2. [Luồng 1: Google Docs Ingestion](#luồng-1-google-docs-ingestion)
3. [Luồng 2: Data Processing & AI Extraction](#luồng-2-data-processing--ai-extraction)
4. [Luồng 3: Query & Semantic Search](#luồng-3-query--semantic-search)
5. [Luồng 4: Chat & AI Response](#luồng-4-chat--ai-response)
6. [Luồng 5: Workspace Management](#luồng-5-workspace-management)
7. [Luồng 6: Background Jobs & Async Processing](#luồng-6-background-jobs--async-processing)
8. [Error Handling & Recovery](#error-handling--recovery)

---

## 🏗️ Tổng Quan Kiến Trúc

### Kiến Trúc Tổng Thể

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│   Backend       │
│   (Express)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│Google  │ │PostgreSQL│
│Docs API│ │+ pgvector│
└────────┘ └──────────┘
    │
    ↓
┌─────────┐
│Gemini AI│
│  API    │
└─────────┘
```

### Các Thành Phần Chính

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Express 4, TypeScript
- **Database:** PostgreSQL 15+ với pgvector extension
- **AI Services:** Google Gemini API, Vertex AI (embeddings)
- **External APIs:** Google Docs API

---

## 📥 Luồng 1: Google Docs Ingestion

### Tổng Quan

Luồng này mô tả quá trình người dùng upload Google Docs URL và hệ thống xử lý, lưu trữ vào database.

### Flow Diagram

```
User Input (Google Docs URL)
    ↓
[Frontend: UploadDocForm.tsx]
    ├─ Validate URL format
    ├─ Show loading state
    └─ POST /api/google-docs/ingest
         ↓
[Backend: server/routes/googleDocs.ts]
    ├─ Extract document ID
    ├─ Authenticate with Google
    └─ Call googleDocsService.loadDocument()
         ↓
[Service: services/googleDocsService.ts]
    ├─ Setup authentication (OAuth/Service Account)
    ├─ Call Google Docs API
    ├─ Parse document structure
    ├─ Build outline (headings, paragraphs)
    └─ Return StructuredGoogleDoc
         ↓
[Backend: server/routes/googleDocs.ts]
    ├─ Create/Update book record
    ├─ Create/Update chapter records
    ├─ Calculate content hash
    └─ Queue background jobs
         ↓
[Database: PostgreSQL]
    ├─ books table
    ├─ recent_chapters table
    └─ processing_status table
         ↓
[Job Queue]
    ├─ Book processing job
    └─ Chapter processing jobs (async)
```

### Chi Tiết Từng Bước

#### Bước 1: User Input & Frontend Validation

**File:** `components/UploadDocForm.tsx`

```typescript
// User nhập Google Docs URL
const handleSubmit = async (url: string) => {
  // Validate URL format
  const docId = extractDocumentId(url);
  if (!docId) {
    showError('URL không hợp lệ');
    return;
  }
  
  // Show loading state
  setLoading(true);
  
  // Call API
  const response = await fetch('/api/google-docs/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  
  // Handle response
  if (response.ok) {
    const data = await response.json();
    // Update UI với work profile
  } else {
    // Show error message
  }
};
```

#### Bước 2: Backend Route Handler

**File:** `server/routes/googleDocs.ts`

```typescript
router.post('/ingest', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Extract document ID
    const docId = extractDocumentId(url);
    
    // Load document từ Google Docs
    const structuredDoc = await googleDocsService.loadDocument(docId);
    
    // Lưu vào database
    const book = await saveToDatabase(structuredDoc);
    
    // Queue background processing
    await queueProcessingJobs(book);
    
    // Return response
    res.json({
      success: true,
      bookId: book.book_id,
      workProfile: convertToWorkProfile(structuredDoc),
    });
  } catch (error) {
    // Error handling
    handleError(error, res);
  }
});
```

#### Bước 3: Google Docs Service

**File:** `services/googleDocsService.ts`

```typescript
async loadDocument(input: string): Promise<StructuredGoogleDoc> {
  // 1. Extract document ID
  const docId = extractDocumentId(input);
  
  // 2. Setup authentication
  const auth = await this.getAuthClient();
  
  // 3. Call Google Docs API
  const docsApi = google.docs({ version: 'v1', auth });
  const document = await docsApi.documents.get({ documentId: docId });
  
  // 4. Parse structure
  const outline = this.buildOutline(document.body?.content ?? []);
  
  // 5. Create structured document
  return this.toStructuredDocument(docId, document);
}
```

**Xử lý đặc biệt:**
- **Authentication:** Hỗ trợ OAuth2 và Service Account
- **Token Refresh:** Tự động refresh token khi hết hạn
- **Retry Logic:** Retry khi gặp lỗi 401/403
- **Error Handling:** Xử lý các lỗi từ Google API

#### Bước 4: Database Storage

**File:** `server/routes/googleDocs.ts`

```typescript
async function saveToDatabase(doc: StructuredGoogleDoc) {
  // 1. Create/Update book
  let book = await getBookByGoogleDocId(doc.docId);
  if (!book) {
    book = await createBook({
      google_doc_id: doc.docId,
      title: doc.title,
      total_word_count: doc.wordCount,
      total_chapters: doc.outline.length,
    });
  } else {
    await updateBook(book.book_id, {
      title: doc.title,
      total_word_count: doc.wordCount,
      total_chapters: doc.outline.length,
    });
  }
  
  // 2. Create/Update chapters
  const chapterIds: string[] = [];
  for (let i = 0; i < doc.outline.length; i++) {
    const section = doc.outline[i];
    const content = section.paragraphs.join('\n\n');
    const hash = calculateContentHash(content);
    
    const chapter = await upsertChapter({
      book_id: book.book_id,
      chapter_number: i + 1,
      title: section.heading,
      content,
      content_hash: hash,
    });
    
    chapterIds.push(chapter.chapter_id);
  }
  
  return { book, chapterIds };
}
```

#### Bước 5: Queue Background Jobs

**File:** `server/routes/googleDocs.ts`

```typescript
async function queueProcessingJobs(book: Book, chapterIds: string[]) {
  // 1. Queue book processing
  await queueBookProcessing({
    bookId: book.book_id,
    googleDocId: book.google_doc_id,
    title: book.title,
    content: book.plainText,
  });
  
  // 2. Queue chapter processing (parallel)
  for (const chapterId of chapterIds) {
    await queueChapterProcessing({
      chapterId,
      bookId: book.book_id,
      // ... other params
    });
  }
}
```

### Error Handling

- **403 Forbidden:** Document không được share với service account
- **401 Unauthorized:** Token hết hạn → Auto refresh
- **404 Not Found:** Document ID không tồn tại
- **Network Errors:** Retry với exponential backoff

---

## 🤖 Luồng 2: Data Processing & AI Extraction

### Tổng Quan

Luồng này mô tả quá trình xử lý dữ liệu với AI để trích xuất metadata, tạo embeddings, và lưu trữ vào database.

### Flow Diagram

```
Background Job Triggered
    ↓
[Job Queue: simpleQueue.ts]
    ├─ Book Processing Job
    └─ Chapter Processing Jobs
         ↓
[Job Processor: bookProcessingJob.ts]
    ├─ Extract book context (Gemini AI)
    ├─ Parse JSON response
    ├─ Validate schema
    └─ Save to book_contexts table
         ↓
[Job Processor: chapterProcessingJob.ts]
    ├─ Change detection (content hash)
    ├─ Extract metadata (Gemini AI)
    ├─ Generate embeddings (Vertex AI)
    ├─ Save metadata
    └─ Save embeddings
         ↓
[Database Updates]
    ├─ book_contexts table
    ├─ recent_chapters table
    └─ chapter_chunks table
```

### Chi Tiết Book Processing

#### Bước 1: Book Processing Job

**File:** `server/jobs/bookProcessingJob.ts`

```typescript
async function processBook(job: BookProcessingJob) {
  const { bookId, googleDocId, title, content } = job.data;
  
  // Update status: processing (10%)
  await updateProcessingStatus(googleDocId, 'book', 'processing', 10);
  
  // Extract book context với Gemini AI
  const extractionResult = await extractBookContext(content, title);
  
  // Update status: extracting (30%)
  await updateProcessingStatus(googleDocId, 'book', 'processing', 30);
  
  // Validate và calculate confidence
  const validation = validateBookContextSchema(extractionResult.data);
  const confidence = calculateConfidence(validation);
  
  // Save to database (70%)
  await saveBookContext(bookId, extractionResult.data, confidence);
  
  // Update status: completed (100%)
  await updateProcessingStatus(googleDocId, 'book', 'completed', 100);
}
```

#### Bước 2: Book Context Extraction

**File:** `server/services/extractionService.ts`

```typescript
async function extractBookContext(
  fullText: string,
  title: string
): Promise<ExtractionResult<BookContext>> {
  // Truncate nếu quá dài
  const truncated = truncateTextForAI(fullText, 50000);
  
  // Build prompt
  const prompt = `Analyze this book and extract structured information in JSON format.
  Book Title: ${title}
  Full Text: ${truncated}
  
  Extract:
  1. summary: 500-1000 words
  2. characters: Array with name, role, description, relationships
  3. world_setting: locations, rules, timeline
  4. writing_style: tone, pov, voice
  5. story_arc: act1, act2, act3
  
  Return ONLY valid JSON.`;
  
  // Call Gemini API
  const result = await genAI.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  });
  
  // Parse JSON
  const jsonText = extractJSONFromResponse(result.text);
  const extractedData = JSON.parse(jsonText) as BookContext;
  
  // Validate
  const validation = validateBookContextSchema(extractedData);
  const confidence = calculateConfidence(validation);
  
  return {
    data: extractedData,
    confidence,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}
```

**Trích xuất thông tin:**
- **Summary:** Tóm tắt toàn bộ câu chuyện (500-1000 từ)
- **Characters:** Danh sách nhân vật với role, description, relationships
- **World Setting:** Locations, rules, timeline
- **Writing Style:** Tone, POV, voice
- **Story Arc:** Act 1, Act 2, Act 3

### Chi Tiết Chapter Processing

#### Bước 1: Chapter Processing Job

**File:** `server/jobs/chapterProcessingJob.ts`

```typescript
async function processChapter(job: ChapterProcessingJob) {
  const { chapterId, bookId, chapterNumber, title, content } = job.data;
  
  // Update status: processing (10%)
  await updateProcessingStatus(chapterId, 'chapter', 'processing', 10);
  
  // Change detection
  const change = await detectChapterChange(bookId, chapterNumber, content);
  if (!change.hasChanged) {
    // Skip nếu không có thay đổi
    return { status: 'completed', cached: true };
  }
  
  // Extract metadata (30%)
  const metadata = await extractChapterMetadata(content, chapterNumber, title);
  
  // Update chapter với metadata (50%)
  await updateChapterMetadata(chapterId, metadata);
  
  // Generate embeddings (70%)
  const embeddings = await generateHierarchicalEmbeddings(
    content,
    chapterNumber,
    title
  );
  
  // Save embeddings (90%)
  await saveHierarchicalEmbeddings(chapterId, bookId, chapterNumber, embeddings);
  
  // Update status: completed (100%)
  await updateProcessingStatus(chapterId, 'chapter', 'completed', 100);
}
```

#### Bước 2: Chapter Metadata Extraction

**File:** `server/services/extractionService.ts`

```typescript
async function extractChapterMetadata(
  chapterContent: string,
  chapterNumber: number,
  chapterTitle?: string
): Promise<ExtractionResult<ChapterMetadata>> {
  const prompt = `Analyze this chapter and extract structured information.
  Chapter: ${chapterNumber} - ${chapterTitle || 'Untitled'}
  Content: ${chapterContent}
  
  Extract:
  1. summary: ~200 words
  2. key_scenes: important scenes with description, significance
  3. character_appearances: characters with actions, dialogue
  4. plot_points: events, conflicts, resolutions
  5. writing_notes: notable patterns or suggestions
  
  Return ONLY valid JSON.`;
  
  // Similar to book context extraction
  // ...
}
```

**Trích xuất thông tin:**
- **Summary:** Tóm tắt chapter (~200 từ)
- **Key Scenes:** Các cảnh quan trọng với mô tả và ý nghĩa
- **Character Appearances:** Nhân vật xuất hiện với actions, dialogue
- **Plot Points:** Events, conflicts, resolutions
- **Writing Notes:** Patterns hoặc suggestions

#### Bước 3: Embedding Generation

**File:** `server/services/hierarchicalEmbeddingService.ts`

```typescript
async function generateHierarchicalEmbeddings(
  content: string,
  chapterNumber: number,
  title?: string
): Promise<HierarchicalEmbeddings> {
  // 1. Chapter-level embedding
  const chapterText = `Chapter ${chapterNumber}: ${title}\n\n${content}`;
  const chapterEmbedding = await generateEmbedding(chapterText);
  
  // 2. Chunk-level embeddings
  const chunks = splitIntoChunks(content, {
    maxLength: 500,
    overlap: 50,
    preserveSentences: true,
  });
  
  const chunkEmbeddings = await Promise.all(
    chunks.map(chunk => generateEmbedding(chunk.text))
  );
  
  return {
    chapter: chapterEmbedding,
    chunks: chunkEmbeddings.map((emb, idx) => ({
      index: idx,
      text: chunks[idx].text,
      embedding: emb,
    })),
  };
}
```

**Embedding Strategy:**
- **Chapter-level:** Embedding cho toàn bộ chapter
- **Chunk-level:** Embeddings cho từng đoạn văn (500 từ, overlap 50)
- **Model:** Vertex AI hoặc local embedding model
- **Dimensions:** 384 hoặc 768 tùy model

#### Bước 4: Save Embeddings

**File:** `server/services/hierarchicalEmbeddingService.ts`

```typescript
async function saveHierarchicalEmbeddings(
  chapterId: string,
  bookId: string,
  chapterNumber: number,
  embeddings: HierarchicalEmbeddings,
  modelVersion: string
): Promise<void> {
  // 1. Update chapter-level embedding
  await db.query(
    `UPDATE recent_chapters
     SET embedding_vector = $1,
         embedding_version = $2,
         embedding_timestamp = CURRENT_TIMESTAMP
     WHERE chapter_id = $3`,
    [embeddings.chapter, modelVersion, chapterId]
  );
  
  // 2. Delete old chunks
  await db.query(
    'DELETE FROM chapter_chunks WHERE chapter_id = $1',
    [chapterId]
  );
  
  // 3. Insert new chunks
  for (const chunk of embeddings.chunks) {
    await db.query(
      `INSERT INTO chapter_chunks 
       (chapter_id, chunk_index, chunk_text, chunk_embedding, word_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        chapterId,
        chunk.index,
        chunk.text,
        chunk.embedding,
        chunk.text.split(/\s+/).length,
      ]
    );
  }
}
```

### Change Detection

**File:** `server/services/changeDetectionService.ts`

```typescript
async function detectChapterChange(
  bookId: string,
  chapterNumber: number,
  newContent: string
): Promise<ChangeDetectionResult> {
  // Get existing chapter
  const existing = await getChapter(bookId, chapterNumber);
  
  if (!existing) {
    return { hasChanged: true, reason: 'new_chapter' };
  }
  
  // Calculate hash
  const newHash = calculateContentHash(newContent);
  
  // Compare
  if (existing.content_hash === newHash) {
    return { hasChanged: false, reason: 'no_change' };
  }
  
  return {
    hasChanged: true,
    reason: 'content_changed',
    oldHash: existing.content_hash,
    newHash,
  };
}
```

**Mục đích:**
- Tránh xử lý lại nội dung không thay đổi
- Tối ưu performance
- Giảm API costs

---

## 🔍 Luồng 3: Query & Semantic Search

### Tổng Quan

Luồng này mô tả quá trình xử lý query từ user, tìm kiếm semantic, và trả về kết quả liên quan.

### Flow Diagram

```
User Query
    ↓
[Frontend: ChatWidget.tsx]
    └─ POST /api/context/query
         ↓
[Backend: server/routes/contextRoutes.ts]
    ├─ Parse query
    ├─ Classify query type
    └─ Call contextRetrievalService
         ↓
[Service: contextRetrievalService.ts]
    ├─ Get book context
    ├─ Get recent chapters
    └─ Semantic search
         ↓
[Service: semanticSearchService.ts]
    ├─ Generate query embedding
    ├─ Vector similarity search
    └─ Return top results
         ↓
[Response]
    └─ Return context + search results
```

### Chi Tiết Từng Bước

#### Bước 1: Query Classification

**File:** `server/services/queryClassificationService.ts`

```typescript
async function classifyQuery(query: string): Promise<QueryType> {
  // Analyze query để xác định intent
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('tìm') || lowerQuery.includes('search')) {
    return 'search';
  }
  
  if (lowerQuery.includes('đánh giá') || lowerQuery.includes('critique')) {
    return 'critique';
  }
  
  if (lowerQuery.includes('tóm tắt') || lowerQuery.includes('summary')) {
    return 'summary';
  }
  
  // Default: general
  return 'general';
}
```

#### Bước 2: Context Retrieval

**File:** `server/services/contextRetrievalService.ts`

```typescript
async function getContextForQuery(
  bookId: string,
  query: string
): Promise<QueryContext> {
  // 1. Get book-level context
  const bookContext = await getBookContext(bookId);
  
  // 2. Get recent chapters (5 most recent)
  const recentChapters = await getRecentChapters(bookId, 5);
  
  // 3. Semantic search
  const searchResults = await semanticSearch(bookId, query, {
    limit: 10,
    threshold: 0.7,
  });
  
  return {
    bookContext,
    recentChapters,
    searchResults,
  };
}
```

#### Bước 3: Semantic Search

**File:** `server/services/semanticSearchService.ts`

```typescript
async function semanticSearch(
  bookId: string,
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Search in chapter_chunks
  const results = await db.query(
    `SELECT 
       cc.chunk_text,
       cc.chunk_index,
       rc.chapter_number,
       rc.title as chapter_title,
       1 - (cc.chunk_embedding <=> $1::vector) as similarity
     FROM chapter_chunks cc
     JOIN recent_chapters rc ON cc.chapter_id = rc.chapter_id
     WHERE rc.book_id = $2
       AND 1 - (cc.chunk_embedding <=> $1::vector) >= $3
     ORDER BY similarity DESC
     LIMIT $4`,
    [queryEmbedding, bookId, options.threshold, options.limit]
  );
  
  // 3. Format results
  return results.rows.map(row => ({
    text: row.chunk_text,
    chapterNumber: row.chapter_number,
    chapterTitle: row.chapter_title,
    similarity: row.similarity,
    chunkIndex: row.chunk_index,
  }));
}
```

**Search Strategy:**
- **Vector Similarity:** Sử dụng pgvector `<=>` operator (cosine distance)
- **Threshold:** Chỉ trả về results với similarity >= threshold (default: 0.7)
- **Limit:** Giới hạn số lượng results (default: 10)
- **Multi-level:** Search cả chapter-level và chunk-level

#### Bước 4: Hybrid Search (Optional)

**File:** `server/services/hybridSearchService.ts`

```typescript
async function hybridSearch(
  bookId: string,
  query: string,
  options: HybridSearchOptions
): Promise<SearchResult[]> {
  // 1. Semantic search
  const semanticResults = await semanticSearch(bookId, query, {
    limit: options.limit * 2,
    threshold: options.semanticThreshold,
  });
  
  // 2. Keyword search (full-text search)
  const keywordResults = await keywordSearch(bookId, query, {
    limit: options.limit * 2,
  });
  
  // 3. Combine và re-rank
  const combined = combineResults(semanticResults, keywordResults);
  const reranked = rerankResults(combined, query);
  
  // 4. Return top results
  return reranked.slice(0, options.limit);
}
```

---

## 💬 Luồng 4: Chat & AI Response

### Tổng Quan

Luồng này mô tả quá trình user chat với AI, hệ thống xây dựng prompt với context, và trả về phản hồi thông minh.

### Flow Diagram

```
User Chat Message
    ↓
[Frontend: ChatWidget.tsx]
    └─ POST /api/chat
         ↓
[Backend: server/routes/chatRoutes.ts]
    ├─ Get user context
    ├─ Get document context
    └─ Call geminiService
         ↓
[Service: promptConstructionService.ts]
    ├─ Get context for query
    ├─ Build prompt với context
    └─ Return constructed prompt
         ↓
[Service: geminiService.ts]
    ├─ Call Gemini API
    ├─ Parse response
    └─ Extract actions
         ↓
[Response Processing]
    ├─ Parse ACTION blocks
    ├─ Update UI state
    └─ Return formatted response
```

### Chi Tiết Từng Bước

#### Bước 1: Chat Request

**File:** `components/ChatWidget.tsx`

```typescript
const handleSendMessage = async (message: string) => {
  // Add user message to chat
  addMessage({ role: 'user', content: message });
  
  // Call API
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      bookId: activeBook?.book_id,
      context: documentContext,
    }),
  });
  
  // Handle response
  const data = await response.json();
  addMessage({ role: 'assistant', content: data.response });
  
  // Process actions
  if (data.actions) {
    processActions(data.actions);
  }
};
```

#### Bước 2: Prompt Construction

**File:** `server/services/promptConstructionService.ts`

```typescript
async function buildPromptForQuery(
  query: string,
  bookId: string,
  context?: DocumentContext
): Promise<string> {
  // 1. Get context
  const queryContext = await getContextForQuery(bookId, query);
  
  // 2. Build prompt
  let prompt = `You are a professional writing assistant helping an author with their manuscript.

Book Context:
- Title: ${queryContext.bookContext.title}
- Summary: ${queryContext.bookContext.summary}
- Characters: ${JSON.stringify(queryContext.bookContext.characters)}
- Writing Style: ${JSON.stringify(queryContext.bookContext.writing_style)}

Recent Chapters:
${queryContext.recentChapters.map(ch => 
  `Chapter ${ch.chapter_number}: ${ch.title}\n${ch.summary}`
).join('\n\n')}

Relevant Content (from semantic search):
${queryContext.searchResults.map(r => 
  `Chapter ${r.chapterNumber}: ${r.text}`
).join('\n\n')}

User Query: ${query}

Please provide a helpful, contextual response. If the query is about critique, provide specific feedback.`;

  return prompt;
}
```

#### Bước 3: Gemini API Call

**File:** `services/geminiService.ts`

```typescript
async function getAIResponse(
  prompt: string,
  options?: GeminiOptions
): Promise<AIResponse> {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
  const model = genAI.getGenerativeModel({
    model: options?.model || 'gemini-2.0-flash-exp',
  });
  
  const result = await model.generateContent({
    contents: prompt,
    generationConfig: {
      temperature: options?.temperature || 0.7,
      maxOutputTokens: options?.maxTokens || 2048,
    },
  });
  
  const responseText = result.response.text();
  
  // Parse actions
  const actions = parseActions(responseText);
  
  return {
    text: responseText,
    actions,
  };
}
```

#### Bước 4: Action Parsing

**File:** `services/actionSchema.ts`

```typescript
function parseActions(responseText: string): Action[] {
  const actions: Action[] = [];
  
  // Parse ACTION blocks
  const actionRegex = /```action\s+(\w+)\s*\n([\s\S]*?)```/g;
  let match;
  
  while ((match = actionRegex.exec(responseText)) !== null) {
    const actionType = match[1] as ActionType;
    const actionData = JSON.parse(match[2]);
    
    actions.push({
      type: actionType,
      data: actionData,
    });
  }
  
  return actions;
}
```

**Action Types:**
- `ACTION_CRITIQUE_DRAFT`: Critique một chapter
- `ACTION_SUGGEST_IMPROVEMENT`: Gợi ý cải thiện
- `ACTION_ANALYZE_CHARACTER`: Phân tích nhân vật
- `ACTION_SUMMARIZE`: Tóm tắt

---

## 📚 Luồng 5: Workspace Management

### Tổng Quan

Luồng này mô tả quá trình quản lý workspace, persistence, và sync giữa frontend và backend.

### Flow Diagram

```
User Action (Create/Update Workspace)
    ↓
[Frontend: App.tsx]
    ├─ Update local state
    └─ Sync to server (if authenticated)
         ↓
[Backend: server/routes/workspace.ts]
    ├─ Validate request
    ├─ Save to PostgreSQL
    └─ Return updated workspace
         ↓
[Database: PostgreSQL]
    ├─ workspaces table
    ├─ workspace_chat_messages table
    └─ workspace_canvas_pages table
```

### Chi Tiết

#### Bước 1: Workspace Creation

**File:** `components/App.tsx`

```typescript
const createWorkspace = async (workProfile: WorkProfile) => {
  // 1. Create workspace in local state
  const workspace = {
    id: generateId(),
    workProfile,
    pages: [
      { id: 'draft', type: 'draft', content: '' },
      { id: 'critique', type: 'critique', content: '' },
      { id: 'final', type: 'final', content: '' },
    ],
    messages: [],
  };
  
  // 2. Save to localStorage
  saveToLocalStorage(workspace);
  
  // 3. Sync to server (if authenticated)
  if (isAuthenticated) {
    await syncWorkspaceToServer(workspace);
  }
};
```

#### Bước 2: Server Sync

**File:** `server/routes/workspace.ts`

```typescript
router.post('/sync', authenticateUser, async (req, res) => {
  const { workspace } = req.body;
  const userId = req.user.id;
  
  // Save workspace snapshot
  await db.query(
    `INSERT INTO workspaces (user_id, workspace_id, snapshot, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, workspace_id)
     DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = CURRENT_TIMESTAMP`,
    [userId, workspace.id, JSON.stringify(workspace)]
  );
  
  // Save chat messages
  for (const message of workspace.messages) {
    await db.query(
      `INSERT INTO workspace_chat_messages 
       (workspace_id, role, content, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [workspace.id, message.role, message.content, message.timestamp]
    );
  }
  
  res.json({ success: true });
});
```

#### Bước 3: Workspace Restoration

**File:** `components/App.tsx`

```typescript
const restoreWorkspace = async (workspaceId: string) => {
  // 1. Try localStorage first
  let workspace = loadFromLocalStorage(workspaceId);
  
  // 2. If not found and authenticated, load from server
  if (!workspace && isAuthenticated) {
    workspace = await loadWorkspaceFromServer(workspaceId);
    
    // Save to localStorage
    if (workspace) {
      saveToLocalStorage(workspace);
    }
  }
  
  return workspace;
};
```

---

## ⚙️ Luồng 6: Background Jobs & Async Processing

### Tổng Quan

Luồng này mô tả hệ thống job queue, xử lý bất đồng bộ, và status tracking.

### Flow Diagram

```
Job Queued
    ↓
[Job Queue: simpleQueue.ts]
    ├─ Add job to queue
    └─ Return job ID
         ↓
[Job Processor]
    ├─ Process job
    ├─ Update status
    └─ Handle errors
         ↓
[Status Tracking]
    ├─ processing_status table
    └─ Progress updates
```

### Chi Tiết

#### Job Queue System

**File:** `server/jobs/simpleQueue.ts`

```typescript
class SimpleQueue {
  private queue: Job[] = [];
  private processing: Set<string> = new Set();
  
  async enqueue(job: Job): Promise<string> {
    const jobId = generateJobId();
    const jobWithId = { ...job, id: jobId, status: 'pending' };
    
    this.queue.push(jobWithId);
    this.processNext();
    
    return jobId;
  }
  
  private async processNext() {
    if (this.processing.size >= this.maxConcurrency) {
      return;
    }
    
    const job = this.queue.shift();
    if (!job) return;
    
    this.processing.add(job.id);
    
    try {
      await this.executeJob(job);
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      
      // Retry logic
      if (job.retries < this.maxRetries) {
        job.retries++;
        this.queue.push(job);
      }
    } finally {
      this.processing.delete(job.id);
      this.processNext();
    }
  }
}
```

#### Status Tracking

**File:** `server/services/statusService.ts`

```typescript
async function updateProcessingStatus(
  entityId: string,
  entityType: 'book' | 'chapter',
  status: ProcessingStatus,
  progress: number
): Promise<void> {
  await db.query(
    `INSERT INTO processing_status 
     (entity_id, entity_type, status, progress, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (entity_id, entity_type)
     DO UPDATE SET 
       status = EXCLUDED.status,
       progress = EXCLUDED.progress,
       updated_at = CURRENT_TIMESTAMP`,
    [entityId, entityType, status, progress]
  );
}
```

---

## 🛡️ Error Handling & Recovery

### Error Types & Handling

#### 1. Google Docs API Errors

```typescript
// 403 Forbidden
if (error.code === 403) {
  return {
    error: 'Google Docs từ chối truy cập',
    solution: 'Kiểm tra quyền chia sẻ hoặc token OAuth',
  };
}

// 401 Unauthorized
if (error.code === 401) {
  // Auto refresh token
  await refreshAuthToken();
  // Retry request
  return retryRequest();
}
```

#### 2. AI API Errors

```typescript
// Timeout
if (error.name === 'TimeoutError') {
  // Retry with longer timeout
  return retryWithTimeout(60000);
}

// Rate limit
if (error.code === 429) {
  // Exponential backoff
  await delay(Math.pow(2, retryCount) * 1000);
  return retryRequest();
}
```

#### 3. Database Errors

```typescript
// Connection error
if (error.code === 'ECONNREFUSED') {
  // Retry connection
  await reconnectDatabase();
  return retryQuery();
}

// Constraint violation
if (error.code === '23505') {
  // Handle duplicate
  return handleDuplicate();
}
```

### Recovery Mechanisms

- **Retry Logic:** Exponential backoff cho transient errors
- **Fallback Values:** Sử dụng default values khi extraction fails
- **Graceful Degradation:** Continue với limited functionality
- **Error Logging:** Log errors để debugging

---

## 📊 Performance Optimization

### Caching Strategy

- **Embedding Cache:** Cache embeddings theo content hash
- **Context Cache:** Cache book context và recent chapters
- **Query Cache:** Cache semantic search results

### Batch Processing

- **Chapter Processing:** Process chapters in parallel
- **Embedding Generation:** Batch embedding generation
- **Database Updates:** Batch inserts/updates

### Database Optimization

- **Indexes:** pgvector indexes cho similarity search
- **Connection Pooling:** Reuse database connections
- **Query Optimization:** Optimize queries với EXPLAIN ANALYZE

---

## 🔗 Tài Liệu Liên Quan

- [GOOGLE_DOCS_TO_DB_FLOW.md](./GOOGLE_DOCS_TO_DB_FLOW.md) - Chi tiết Google Docs ingestion
- [DATA_ANALYSIS_FLOW.md](./DATA_ANALYSIS_FLOW.md) - Chi tiết data analysis flow
- [../implementation/IMPLEMENTATION_PHASES.md](../implementation/IMPLEMENTATION_PHASES.md) - Implementation phases

---

**Last Updated:** 2024

