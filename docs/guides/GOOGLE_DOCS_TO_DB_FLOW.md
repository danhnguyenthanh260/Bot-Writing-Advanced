# Quy Trình Chuyển Dữ Liệu Từ Google Docs Vào PostgreSQL

## Tổng Quan

Quy trình này mô tả cách hệ thống lấy dữ liệu từ Google Docs, xử lý và chuyển đổi thành cấu trúc có thể lưu trữ trong PostgreSQL. Quy trình được chia thành 7 bước chính với xử lý đồng bộ và bất đồng bộ.

## Kiến Trúc Tổng Thể

```
Google Docs API → Xử Lý & Chuyển Đổi → PostgreSQL
                      ↓
              Background Jobs (Async)
                      ↓
         Embeddings & Metadata Extraction
```

## Chi Tiết Các Bước

### BƯỚC 1: Xác Thực và Kết Nối Google Docs API

**File liên quan:** `services/googleDocsService.ts`

#### 1.1. Thiết Lập Xác Thực

Hệ thống hỗ trợ hai phương thức xác thực:

**a) Service Account (JWT)**
```typescript
// Sử dụng Service Account khi có GOOGLE_SERVICE_ACCOUNT_EMAIL và GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
const auth = new google.auth.JWT({
  email: serviceAccountEmail,
  key: normalizePrivateKey(serviceAccountKey),
  scopes: ['https://www.googleapis.com/auth/documents.readonly'],
});
```

**b) OAuth2 Client**
```typescript
// Sử dụng OAuth2 khi có GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, và GOOGLE_REFRESH_TOKEN
const oAuthClient = new google.auth.OAuth2({
  clientId,
  clientSecret,
  redirectUri,
});
oAuthClient.setCredentials({ refresh_token: refreshToken });
```

#### 1.2. Trích Xuất Document ID

Hệ thống tự động nhận diện Document ID từ:
- URL đầy đủ: `https://docs.google.com/document/d/{docId}/edit`
- Document ID trực tiếp: `abc123xyz`

```typescript
extractDocumentId(input: string): string {
  // Kiểm tra nếu là ID trực tiếp
  if (/^[a-zA-Z0-9_-]+$/.test(input)) {
    return input;
  }
  
  // Trích xuất từ URL
  const urlMatch = input.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return urlMatch?.[1] || throw new Error('Không thể xác định docId');
}
```

### BƯỚC 2: Lấy Dữ Liệu Từ Google Docs API

**File liên quan:** `services/googleDocsService.ts` - `loadDocument()`

#### 2.1. Gọi API

```typescript
const docsApi = google.docs({ version: 'v1', auth });
const document = await docsApi.documents.get({ documentId });
```

#### 2.2. Cấu Trúc Dữ Liệu Trả Về

Google Docs API trả về cấu trúc phức tạp:
- `body.content[]`: Mảng các phần tử cấu trúc
- Mỗi phần tử có thể là: `paragraph`, `table`, `sectionBreak`, etc.
- Paragraph chứa `elements[]` với `textRun`, `inlineObjectElement`, etc.

### BƯỚC 3: Chuyển Đổi và Làm Sạch Dữ Liệu

**File liên quan:** `services/googleDocsService.ts` - `buildOutline()`

#### 3.1. Phân Tích Cấu Trúc Document

Hệ thống xây dựng outline từ các phần tử:

```typescript
private buildOutline(elements: docs_v1.Schema$StructuralElement[]): StructuredGoogleDoc['outline'] {
  const outline = [];
  let currentSection = null;
  
  for (const element of elements) {
    const paragraph = element.paragraph;
    if (!paragraph) continue;
    
    // Trích xuất text từ các textRun
    const text = paragraph.elements
      .map(el => el.textRun?.content ?? '')
      .join('')
      .replace(/\s+$/g, '')      // Loại bỏ trailing whitespace
      .replace(/\s+/g, ' ');      // Normalize whitespace
    
    // Xác định heading level
    const namedStyle = paragraph.paragraphStyle?.namedStyleType ?? '';
    const headingLevel = this.resolveHeadingLevel(namedStyle);
    
    if (headingLevel !== null) {
      // Tạo section mới
      pushSection();
      currentSection = {
        heading: text.trim(),
        level: headingLevel,
        paragraphs: [],
      };
    } else {
      // Thêm vào section hiện tại
      if (!currentSection) {
        currentSection = { heading: 'Giới thiệu', level: 0, paragraphs: [] };
      }
      currentSection.paragraphs.push(text.trim());
    }
  }
  
  return outline;
}
```

#### 3.2. Xử Lý Heading Levels

```typescript
private resolveHeadingLevel(namedStyle: string): number | null {
  if (namedStyle === 'TITLE') return 0;
  const match = namedStyle.match(/HEADING_(\d)/);
  return match ? Number(match[1]) : null;
}
```

#### 3.3. Tạo Structured Document

```typescript
private toStructuredDocument(documentId: string, document: docs_v1.Schema$Document): StructuredGoogleDoc {
  const outline = this.buildOutline(document.body?.content ?? []);
  const plainText = outline
    .flatMap(section => section.paragraphs)
    .join('\n\n');
  const wordCount = plainText.trim().split(/\s+/).length;
  
  return {
    docId: documentId,
    title: document.title ?? 'Tài liệu không tiêu đề',
    revisionId: document.revisionId,
    plainText,
    wordCount,
    outline,
  };
}
```

#### 3.4. Các Vấn Đề Xử Lý

**a) Whitespace Normalization**
- Loại bỏ trailing whitespace
- Chuẩn hóa multiple spaces thành single space
- Giữ nguyên line breaks giữa paragraphs

**b) Empty Content Handling**
- Bỏ qua paragraphs rỗng
- Tạo section mặc định nếu không có heading
- Fallback message nếu document hoàn toàn trống

**c) Special Characters**
- Giữ nguyên Unicode characters
- Xử lý emoji và ký tự đặc biệt
- Preserve formatting markers nếu cần

### BƯỚC 4: Lưu Trữ Dữ Liệu Thô Vào Database

**File liên quan:** `server/routes/googleDocs.ts` - `/ingest` endpoint

#### 4.1. Tạo/Cập Nhật Book Record

```typescript
// Kiểm tra book đã tồn tại
let book = await getBookByGoogleDocId(doc.docId);

if (!book) {
  // Tạo mới
  book = await createBook({
    google_doc_id: doc.docId,
    title: doc.title,
    total_word_count: doc.wordCount,
    total_chapters: doc.outline.length,
  });
} else {
  // Cập nhật metadata
  await updateBook(book.book_id, {
    title: doc.title,
    total_word_count: doc.wordCount,
    total_chapters: doc.outline.length,
  });
}
```

**Schema:** `books` table
```sql
CREATE TABLE books (
  book_id UUID PRIMARY KEY,
  google_doc_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  total_word_count INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2. Tạo Chapter Records

```typescript
const chapterIds: string[] = [];
for (let i = 0; i < doc.outline.length; i++) {
  const section = doc.outline[i];
  const chapterContent = section.paragraphs.join('\n\n');
  const contentHash = calculateContentHash(chapterContent);
  
  const chapterResult = await db.query(
    `INSERT INTO recent_chapters 
     (chapter_id, book_id, chapter_number, title, content, content_hash)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
     ON CONFLICT (book_id, chapter_number)
     DO UPDATE SET 
       content = EXCLUDED.content, 
       content_hash = EXCLUDED.content_hash,
       title = COALESCE(EXCLUDED.title, recent_chapters.title)
     RETURNING chapter_id`,
    [book.book_id, i + 1, section.heading, chapterContent, contentHash]
  );
  
  chapterIds.push(chapterResult.rows[0].chapter_id);
}
```

**Schema:** `recent_chapters` table
```sql
CREATE TABLE recent_chapters (
  chapter_id UUID PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(book_id),
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  summary TEXT,
  key_scenes JSONB,
  character_appearances JSONB,
  plot_points JSONB,
  writing_notes JSONB,
  embedding_vector vector(384),
  embedding_version TEXT,
  extraction_model_version TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, chapter_number)
);
```

#### 4.3. Content Hash cho Change Detection

```typescript
// server/utils/contentHash.ts
export function calculateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}
```

**Mục đích:**
- Phát hiện thay đổi nội dung chapter
- Tránh xử lý lại nội dung không đổi
- Tối ưu hóa performance

### BƯỚC 5: Queue Background Processing Jobs

**File liên quan:** `server/jobs/bookProcessingJob.ts`, `server/jobs/chapterProcessingJob.ts`

#### 5.1. Book Processing Job

```typescript
const bookJobId = await queueBookProcessing({
  bookId: book.book_id,
  googleDocId: doc.docId,
  title: doc.title,
  content: doc.plainText,
});
```

**Quy trình xử lý:**

**Phase 1: Tạo/Get Book (10%)**
```typescript
await updateProcessingStatus(googleDocId, 'book', 'processing', 10);
// Đảm bảo book record tồn tại
```

**Phase 2: Extract Book Context (30%)**
```typescript
const extractionResult = await extractBookContext(content, title);
// Sử dụng Gemini AI để trích xuất:
// - Summary
// - Characters (main, supporting, minor)
// - World setting (locations, rules, timeline)
// - Writing style (tone, POV, voice)
// - Story arc (act1, act2, act3)
```

**Phase 3: Lưu Book Context (70%)**
```typescript
await db.query(
  `INSERT INTO book_contexts (
    book_id, summary, characters, world_setting, 
    writing_style, story_arc, extraction_model_version
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (book_id) DO UPDATE SET ...`,
  [bookId, summary, charactersJSON, worldSettingJSON, ...]
);
```

**Phase 4: Complete (100%)**
```typescript
await updateProcessingStatus(finalBookId, 'book', 'completed', 100);
```

#### 5.2. Chapter Processing Jobs

```typescript
for (let i = 0; i < chapterIds.length; i++) {
  const chapterJobId = await queueChapterProcessing({
    chapterId: chapterIds[i],
    bookId: book.book_id,
    chapterNumber: i + 1,
    title: section.heading,
    content: chapterContent,
  });
}
```

**Quy trình xử lý:**

**Phase 1: Change Detection (10%)**
```typescript
const change = await detectChapterChange(bookId, chapterNumber, content);
if (!change.hasChanged) {
  // Skip nếu không có thay đổi
  return { status: 'completed', cached: true };
}
```

**Phase 2: Extract Metadata (30%)**
```typescript
const extractionResult = await extractChapterMetadata(
  content,
  chapterNumber,
  title
);
// Trích xuất:
// - Summary (~200 words)
// - Key scenes
// - Character appearances
// - Plot points (events, conflicts, resolutions)
// - Writing notes
```

**Phase 3: Update Chapter (50%)**
```typescript
await db.query(
  `UPDATE recent_chapters
   SET summary = $1,
       key_scenes = $2,
       character_appearances = $3,
       plot_points = $4,
       writing_notes = $5,
       content_hash = $6,
       extraction_timestamp = CURRENT_TIMESTAMP
   WHERE chapter_id = $7`,
  [summary, scenesJSON, charactersJSON, plotPointsJSON, notesJSON, hash, chapterId]
);
```

**Phase 4: Generate Embeddings (70%)**
```typescript
const embeddings = await generateHierarchicalEmbeddings(
  content,
  chapterNumber,
  title
);
// Tạo embeddings cho:
// - Full chapter
// - Chunks (đoạn văn)
// - Key scenes
```

**Phase 5: Save Embeddings (90%)**
```typescript
await saveHierarchicalEmbeddings(
  chapterId,
  bookId,
  chapterNumber,
  embeddings,
  'all-MiniLM-L6-v2'
);
// Lưu vào:
// - recent_chapters.embedding_vector (chapter-level)
// - chapter_chunks (chunk-level)
```

**Phase 6: Complete (100%)**
```typescript
await updateProcessingStatus(chapterId, 'chapter', 'completed', 100);
```

### BƯỚC 6: Xử Lý Dữ Liệu với AI (Extraction Service)

**File liên quan:** `server/services/extractionService.ts`

#### 6.1. Book Context Extraction

```typescript
export async function extractBookContext(
  fullText: string,
  title: string
): Promise<ExtractionResult<BookContext>> {
  // Truncate nếu quá dài (giới hạn 50000 chars)
  const truncatedText = fullText.length > 50000 
    ? fullText.substring(0, 50000) + '... (truncated)'
    : fullText;
  
  const prompt = `Analyze this book and extract structured information in JSON format.
  Book Title: ${title}
  Full Text: ${truncatedText}
  
  Extract:
  1. summary: 500-1000 words
  2. characters: Array with name, role, description, relationships
  3. world_setting: locations, rules, timeline
  4. writing_style: tone, pov, voice
  5. story_arc: act1, act2, act3
  
  Return ONLY valid JSON.`;
  
  const result = await genAI.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  });
  
  // Parse và validate JSON
  const extractedData = JSON.parse(jsonText) as BookContext;
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

#### 6.2. Chapter Metadata Extraction

```typescript
export async function extractChapterMetadata(
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
  
  // Tương tự như book context extraction
}
```

#### 6.3. Validation và Error Handling

```typescript
// Validate schema
const validation = validateBookContextSchema(extractedData);

// Calculate confidence score
const confidence = calculateConfidence(validation);

// Return với errors và warnings
return {
  data: extractedData,
  confidence,
  errors: validation.errors,
  warnings: validation.warnings,
};
```

### BƯỚC 7: Lưu Trữ Embeddings và Metadata

**File liên quan:** `server/services/hierarchicalEmbeddingService.ts`

#### 7.1. Generate Hierarchical Embeddings

```typescript
export async function generateHierarchicalEmbeddings(
  content: string,
  chapterNumber: number,
  title?: string
): Promise<HierarchicalEmbeddings> {
  // 1. Chapter-level embedding
  const chapterEmbedding = await generateEmbedding(
    `Chapter ${chapterNumber}: ${title}\n\n${content}`
  );
  
  // 2. Chunk-level embeddings
  const chunks = splitIntoChunks(content, { maxLength: 500, overlap: 50 });
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

#### 7.2. Save Embeddings

```typescript
export async function saveHierarchicalEmbeddings(
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

## Các Vấn Đề Thường Gặp và Cách Xử Lý

### 1. Vấn Đề Xác Thực Google Docs API

**Vấn đề:**
- 403 Forbidden: Không có quyền truy cập
- 401 Unauthorized: Token hết hạn hoặc không hợp lệ
- 404 Not Found: Document ID không tồn tại

**Giải pháp:**
```typescript
// server/routes/googleDocs.ts
catch (error: any) {
  const status = error?.code ?? error?.response?.status;
  if (status === 403 || status === 401) {
    return res.status(403).json({ 
      error: 'Google Docs từ chối truy cập. Hãy kiểm tra quyền chia sẻ hoặc token OAuth.' 
    });
  }
  if (status === 404) {
    return res.status(404).json({ 
      error: 'Không tìm thấy tài liệu Google Docs. Hãy kiểm tra lại liên kết.' 
    });
  }
  return res.status(500).json({ 
    error: 'Lỗi không xác định khi kết nối với Google Docs.' 
  });
}
```

**Giải pháp đã triển khai:**

```typescript
// services/googleDocsService.ts
// ✅ Token refresh tự động cho OAuth2
private async refreshAuthClient(): Promise<void> {
  if (this.authClient && 'refreshAccessToken' in this.authClient) {
    const { credentials } = await (this.authClient as OAuth2Client).refreshAccessToken();
    (this.authClient as OAuth2Client).setCredentials(credentials);
    this.lastTokenRefresh = new Date();
  }
}

// ✅ Retry với token refresh
async loadDocument(input: string, retries: number = 3): Promise<StructuredGoogleDoc> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // ... load document
    } catch (error: any) {
      if ((status === 401 || status === 403) && attempt < retries) {
        await this.refreshAuthClient(); // Tự động refresh token
        continue;
      }
      throw error;
    }
  }
}
```

**Best Practices:**
- ✅ Token refresh tự động mỗi 50 phút cho OAuth2
- ✅ Retry mechanism với token refresh khi gặp 401/403
- ✅ Cache auth client để tránh tạo lại nhiều lần
- ✅ Sử dụng Service Account cho production (không cần refresh)
- ✅ Đảm bảo document được share với service account email

### 2. Vấn Đề Xử Lý Dữ Liệu Lớn

**Vấn đề:**
- Document quá lớn (>50,000 words)
- Timeout khi gọi AI API
- Memory issues khi xử lý

**Giải pháp đã triển khai:**

```typescript
// server/utils/textProcessing.ts
// ✅ Intelligent truncation tại sentence boundaries
export function truncateTextForAI(text: string, maxLength: number = 50000): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );
  
  if (lastSentenceEnd > maxLength * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1) + '... (truncated)';
  }
  return truncated + '... (truncated)';
}

// ✅ Memory estimation và validation
export function isTextTooLarge(text: string, maxMemoryMB: number = 50): boolean {
  const memoryBytes = estimateMemoryUsage(text);
  return (memoryBytes / (1024 * 1024)) > maxMemoryMB;
}

// ✅ Timeout handling cho AI calls
// server/services/extractionService.ts
const result = await retryWithTimeout(
  async () => await genAI.models.generateContent({...}),
  {
    maxAttempts: 3,
    timeoutMs: 60000, // 60 seconds
    initialDelayMs: 2000,
  }
);

// ✅ Chunking với sentence preservation
const chunks = chunkText(content, {
  maxWords: 800,
  overlapWords: 100,
  preserveSentences: true, // Giữ nguyên câu
});
```

### 3. Vấn Đề Formatting và Encoding

**Vấn đề:**
- Special characters bị lỗi encoding
- Whitespace không nhất quán
- Line breaks bị mất

**Giải pháp đã triển khai:**

```typescript
// services/googleDocsService.ts
// ✅ Unicode normalization (NFC)
const text = (paragraph.elements ?? [])
  .map(el => el.textRun?.content ?? '')
  .join('')
  .normalize('NFC') // Combine diacritics into single code points
  .replace(/\s+$/g, '')
  .replace(/\s+/g, ' ');

// server/utils/textProcessing.ts
// ✅ Comprehensive text cleaning
export function normalizeText(text: string): string {
  return text
    .normalize('NFC') // Unicode normalization
    .replace(/\r\n/g, '\n')  // Windows line endings
    .replace(/\r/g, '\n')    // Old Mac line endings
    .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
}

// ✅ Encoding validation
export function validateEncoding(text: string): EncodingValidation {
  const issues: string[] = [];
  
  if (text.includes('\0')) {
    issues.push('Contains null bytes');
  }
  
  // Check for invalid UTF-8 sequences
  try {
    Buffer.from(text, 'utf8').toString('utf8');
  } catch (error) {
    issues.push('Invalid UTF-8 sequences detected');
  }
  
  return { valid: issues.length === 0, issues, encoding: 'UTF-8' };
}

// ✅ Clean text for database storage
export function cleanTextForStorage(text: string): string {
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .normalize('NFC'); // Normalize Unicode
}
```

### 4. Vấn Đề Duplicate và Conflict

**Vấn đề:**
- Import cùng document nhiều lần
- Chapter number conflict
- Content hash mismatch

**Giải pháp đã triển khai:**

```typescript
// server/routes/googleDocs.ts
// ✅ Transaction handling cho atomicity
const { withTransaction } = await import('../utils/dbTransaction');

await withTransaction(async (client) => {
  // Tất cả chapter inserts trong một transaction
  for (let i = 0; i < doc.outline.length; i++) {
    // ... insert/update với ON CONFLICT
  }
});

// ✅ Cache invalidation khi content thay đổi
if (existingChapter.rows.length > 0) {
  const oldHash = existingChapter.rows[0].content_hash;
  if (oldHash && oldHash !== contentHash) {
    // Content changed - invalidate cache
    await invalidateCacheEntries([oldHash]);
  }
}

// ✅ Change detection với skip processing
const change = await detectChapterChange(bookId, chapterNumber, content);
if (!change.hasChanged) {
  // Skip processing - không tạo embeddings lại
  return { status: 'completed', cached: true };
}

// server/utils/dbTransaction.ts
// ✅ Row locking để tránh concurrent updates
export async function lockRowForUpdate(
  table: string,
  whereClause: string,
  params: any[]
): Promise<boolean> {
  const result = await db.query(
    `SELECT * FROM ${table} WHERE ${whereClause} FOR UPDATE NOWAIT`,
    params
  );
  return result.rows.length > 0;
}
```

### 5. Vấn Đề AI Extraction Errors

**Vấn đề:**
- JSON parsing errors
- Invalid schema
- Low confidence scores

**Giải pháp đã triển khai:**

```typescript
// server/services/extractionService.ts
// ✅ Retry với timeout
const result = await retryWithTimeout(
  async () => await genAI.models.generateContent({...}),
  {
    maxAttempts: 3,
    timeoutMs: 60000, // 60 seconds
    initialDelayMs: 2000,
  }
);

// ✅ JSON parsing với fallback
let extractedData: BookContext;
try {
  extractedData = JSON.parse(jsonMatch[0]) as BookContext;
} catch (parseError: any) {
  // Fallback: create minimal structure
  console.warn('JSON parse error, using fallback structure:', parseError);
  extractedData = createFallbackBookContext(title, truncatedText);
}

// ✅ Confidence threshold check
const confidence = calculateConfidence(validation);
if (confidence < MIN_CONFIDENCE_THRESHOLD) { // 0.5
  console.warn(`Low confidence (${confidence.toFixed(2)}), using fallback`);
  extractedData = createFallbackBookContext(title, truncatedText);
}

// ✅ Fallback structure khi extraction fails hoàn toàn
function createFallbackBookContext(title: string, text: string): BookContext {
  const words = text.split(/\s+/);
  const summary = words.slice(0, 500).join(' ') + (words.length > 500 ? '...' : '');
  
  return {
    summary,
    characters: [],
    world_setting: {},
    writing_style: { pov: 'third' },
    story_arc: {},
  };
}
```

### 6. Vấn Đề Performance

**Vấn đề:**
- Xử lý chậm với document lớn
- Database queries chậm
- Embedding generation tốn thời gian

**Giải pháp đã triển khai:**

```typescript
// ✅ Async processing với queue
const bookJobId = await queueBookProcessing({...});
// Return ngay, xử lý background

// ✅ Cache invalidation khi content thay đổi
// server/services/embeddingCacheService.ts
export async function invalidateCacheEntries(contentHashes: string[]): Promise<number> {
  const placeholders = contentHashes.map((_, i) => `$${i + 1}`).join(', ');
  const result = await db.query(
    `DELETE FROM embedding_cache WHERE content_hash IN (${placeholders})`,
    contentHashes
  );
  return result.rowCount || 0;
}

// ✅ Caching với automatic invalidation
const cached = await getCachedEmbedding(content, modelVersion);
if (cached) return cached;

// Generate và cache
const embedding = await generateEmbedding(content);
await cacheEmbedding(content, embedding, modelVersion);

// ✅ Data integrity checks
// server/utils/dataIntegrity.ts
export async function verifyChapterEmbedding(chapterId: string): Promise<{
  valid: boolean;
  issues: string[];
  validation?: EmbeddingValidation;
}> {
  // Validate dimensions, NaN/Infinity, magnitude
  const validation = validateEmbedding(embedding, 384);
  return { valid: validation.valid, issues: validation.issues, validation };
}

// ✅ Content hash verification
export async function verifyContentHash(chapterId: string): Promise<{
  valid: boolean;
  hashMatches: boolean;
}> {
  const storedHash = await getStoredHash(chapterId);
  const calculatedHash = calculateContentHash(content);
  return { valid: true, hashMatches: storedHash === calculatedHash };
}
```

## Công Cụ và Tự Động Hóa

### 1. Job Queue System

**File:** `server/jobs/simpleQueue.ts`

- Xử lý bất đồng bộ
- Retry mechanism
- Status tracking
- Error handling

### 2. Change Detection Service

**File:** `server/services/changeDetectionService.ts`

- So sánh content hash
- Phát hiện thay đổi
- Tránh xử lý lại không cần thiết

### 3. Embedding Cache

**File:** `server/services/embeddingCacheService.ts`

- ✅ Cache embeddings theo content hash
- ✅ Giảm API calls
- ✅ Tăng tốc độ xử lý
- ✅ **Cache invalidation** khi content thay đổi
- ✅ **Automatic cleanup** của old cache entries

### 4. Status Tracking

**File:** `server/services/statusService.ts`

- Theo dõi progress
- Error reporting
- Status updates cho frontend

## Monitoring và Debugging

### 1. Logging

```typescript
console.error('Failed to ingest Google Doc:', error);
console.error('Book processing error:', error);
console.error('Chapter processing error:', error);
```

### 2. Status Queries

```sql
-- Kiểm tra processing status
SELECT * FROM processing_status 
WHERE entity_type = 'book' 
  AND status = 'processing';

-- Kiểm tra failed jobs
SELECT * FROM processing_status 
WHERE status = 'failed' 
ORDER BY started_at DESC;
```

### 3. Content Hash Verification

```typescript
// server/utils/dataIntegrity.ts
// ✅ Verify content integrity
const hashCheck = await verifyContentHash(chapterId);
if (!hashCheck.hashMatches) {
  // Content đã thay đổi, cần reprocess
}

// ✅ Verify embedding integrity
const embeddingCheck = await verifyChapterEmbedding(chapterId);
if (!embeddingCheck.valid) {
  // Embedding có vấn đề, cần regenerate
  console.error('Embedding issues:', embeddingCheck.issues);
}

// ✅ Comprehensive integrity check
const integrity = await checkChapterIntegrity(chapterId);
if (!integrity.valid) {
  console.error('Data integrity issues:', integrity.issues);
}
```

### 4. Text Processing Utilities

**File:** `server/utils/textProcessing.ts`

- ✅ Unicode normalization (NFC)
- ✅ Intelligent text truncation
- ✅ Memory estimation
- ✅ Encoding validation
- ✅ Text cleaning for storage

### 5. Timeout and Retry Utilities

**File:** `server/utils/timeout.ts`

- ✅ Timeout handling cho long-running operations
- ✅ Retry với exponential backoff
- ✅ Configurable timeout và retry attempts

### 6. Database Transaction Utilities

**File:** `server/utils/dbTransaction.ts`

- ✅ Transaction wrapper cho atomicity
- ✅ Row locking để tránh concurrent updates
- ✅ Upsert với conflict handling

## Kết Luận

Quy trình chuyển dữ liệu từ Google Docs vào PostgreSQL là một pipeline phức tạp với nhiều bước xử lý:

1. **Xác thực và lấy dữ liệu** từ Google Docs API
2. **Chuyển đổi và làm sạch** dữ liệu thô
3. **Lưu trữ ban đầu** vào database
4. **Xử lý bất đồng bộ** với background jobs
5. **Trích xuất metadata** bằng AI
6. **Tạo embeddings** cho semantic search
7. **Lưu trữ cuối cùng** với đầy đủ metadata và embeddings

Hệ thống được thiết kế để:
- Xử lý documents lớn hiệu quả
- Phát hiện và xử lý thay đổi
- Tối ưu hóa performance với caching và batching
- Xử lý lỗi và retry tự động
- Theo dõi progress và status

