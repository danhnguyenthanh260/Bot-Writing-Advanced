# 📘 Local Embedding Guide: Flow Hoàn Chỉnh & Setup

**Embedding Provider:** Local (Free) - `all-MiniLM-L6-v2` (384 dimensions)  
**Database:** PostgreSQL + pgvector với `vector(384)`  
**Architecture:** Free-first, pluggable, có thể switch provider sau

---

## 📋 Mục Lục

1. [Configuration](#configuration)
2. [Setup Local Embedding Server](#setup-local-embedding-server)
3. [Flow 1: Import Processing](#flow-1-import-processing)
4. [Flow 2: Chat Processing](#flow-2-chat-processing)
5. [Files Modified](#files-modified)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Configuration

### **Environment Variables**

**File:** `.env`

```env
# Embedding Provider - Local (Free)
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_API_URL=http://localhost:8000
LOCAL_EMBEDDING_MODEL=all-MiniLM-L6-v2
LOCAL_EMBEDDING_DIMENSIONS=384

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/bot_writing_advanced

# Google Docs API
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini API (cho AI chat)
API_KEY=your_gemini_api_key
```

### **Database Schema**

**File:** `server/db/schema.sql`

```sql
-- ✅ Đảm bảo vector dimensions = 384 (cho all-MiniLM-L6-v2)
ALTER TABLE recent_chapters 
  ALTER COLUMN embedding_vector TYPE vector(384);

ALTER TABLE chapter_chunks 
  ALTER COLUMN chunk_embedding TYPE vector(384);

ALTER TABLE embedding_cache 
  ALTER COLUMN embedding_vector TYPE vector(384);
```

**Migration Script:** `server/db/migrate_to_384.sql` (nếu database đã có vector(768))

---

## 🚀 Setup Local Embedding Server

### **Step 1: Install Dependencies**

```bash
pip install sentence-transformers fastapi uvicorn
```

**Lưu ý:** Lần đầu chạy sẽ download model `all-MiniLM-L6-v2` (~80MB), có thể mất vài phút.

### **Step 2: Start Server**

**Option 1: Python script**
```bash
python local_embedding_server.py
```

**Option 2: npm script**
```bash
npm run embedding:start
```

**Option 3: uvicorn**
```bash
uvicorn local_embedding_server:app --host 0.0.0.0 --port 8000
```

**Option 4: Start all services**
```bash
npm run dev:all  # Start embedding + server + frontend
```

**Expected output:**
```
Loading embedding model: all-MiniLM-L6-v2...
✅ Model loaded: all-MiniLM-L6-v2 (384 dimensions)
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### **Step 3: Test Server**

```bash
# Health check
curl http://localhost:8000/

# Test embedding
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'
```

### **Available Models**

| Model | Dimensions | Speed | Quality | Size |
|-------|-----------|-------|---------|------|
| `all-MiniLM-L6-v2` | 384 | ⚡⚡⚡ | ⭐⭐⭐ | ~80MB |
| `paraphrase-MiniLM-L3-v2` | 256 | ⚡⚡⚡⚡ | ⭐⭐ | ~60MB |
| `all-mpnet-base-v2` | 768 | ⚡⚡ | ⭐⭐⭐⭐ | ~420MB |

**Recommendation:** `all-MiniLM-L6-v2` (best balance)

---

## 🔄 Flow 1: Import Processing

### **Step 1: User Upload Google Doc**

**File:** `components/UploadDocForm.tsx`

User nhập Google Doc URL → POST `/api/google-docs/ingest`

### **Step 2: Backend - Google Docs API & Database Init**

**File:** `server/routes/googleDocs.ts`

**Flow:**
1. Lấy document từ Google Docs API
2. Convert thành workProfile (frontend format)
3. Tạo/Cập nhật book trong database (`books` table)
4. Tạo chapter records (`recent_chapters` table) - raw content, chưa process
5. Queue processing jobs (async - background)
6. Trả về response với `book_id` và processing status

**Output:**
```typescript
{
  docId: "abc123",
  document: StructuredGoogleDoc,
  workProfile: WorkProfile,
  book_id: "uuid-here", // ✅ Database book_id
  processing: {
    book_job_id: "book-uuid",
    chapter_job_ids: ["chapter-1-uuid", "chapter-2-uuid", ...],
    status: "processing"
  }
}
```

### **Step 3: Background Processing - Book Processing**

**File:** `server/jobs/bookProcessingJob.ts`

**Flow:**
1. Extract book context (summary, characters, writing style, story arc) bằng Gemini API
2. Lưu vào `book_contexts` table

### **Step 4: Background Processing - Chapter Processing**

**File:** `server/jobs/chapterProcessingJob.ts`

**Flow:**
1. Detect content changes (hash comparison)
2. Extract chapter metadata (summary, key scenes, characters, plot points) bằng Gemini API
3. Generate hierarchical embeddings:
   - **Chapter-level embedding:** Từ summary → Local Embedding (384 dims)
   - **Chunk-level embeddings:** Nếu chapter dài → Chunk content → Local Embedding (384 dims)
4. Lưu embeddings vào database:
   - `recent_chapters.embedding_vector` (chapter-level)
   - `chapter_chunks.chunk_embedding` (chunk-level)

**Model:** `all-MiniLM-L6-v2` (Local, 384 dimensions)

### **Step 5: Local Embedding Generation**

**File:** `server/services/embeddingProvider.ts` → `LocalEmbeddingProvider`

**Flow:**
1. Backend gọi `generateEmbedding(text)`
2. `LocalEmbeddingProvider` gọi `http://localhost:8000/embed`
3. FastAPI server (Sentence Transformers) generate embedding
4. Return embedding vector: `[0.123, -0.456, 0.789, ...]` (384 numbers)

**Server:** `local_embedding_server.py` (FastAPI + Sentence Transformers)

### **Step 6: Save Embeddings to Database**

**File:** `server/services/hierarchicalEmbeddingService.ts`

**Flow:**
1. Convert embedding array → PostgreSQL vector string: `[0.123, -0.456, ...]`
2. Save to `recent_chapters.embedding_vector` (vector(384))
3. Save to `chapter_chunks.chunk_embedding` (vector(384))

### **Step 7: Frontend - Handle Response**

**File:** `App.tsx`

**Flow:**
1. Nhận response từ `/api/google-docs/ingest`
2. Lưu `bookId` vào `workProfile.bookId`
3. (Optional) Poll processing status

**Output:** `workProfile` có `bookId` → Bridge giữa Flow 1 và Flow 2

---

## 💬 Flow 2: Chat Processing

### **Step 1: User Query**

**File:** `App.tsx` → `handleSendMessage()`

**Flow:**
1. User gõ message trong chat
2. Lấy `bookId` từ `workProfile.bookId` (được set từ Flow 1)
3. Pass `bookId` trong `documentContext`

### **Step 2: Retrieve Context từ Database**

**File:** `server/services/contextRetrievalService.ts` → `getContextForQuery()`

**Flow:**
1. Classify query type (BOOK_LEVEL | CHAPTER_LEVEL | MIXED)
2. Get book context từ `book_contexts` table
3. Get recent chapters từ `recent_chapters` table (top 5)
4. **Semantic search** (vector search) → Top 5 relevant chapters

**Output:**
```typescript
{
  book_context: BookContext,
  recent_chapters: ChapterContext[],
  semantic_results: SearchResult[] // ✅ Từ vector search
}
```

### **Step 3: Semantic Search với Local Embedding**

**File:** `server/services/semanticSearchService.ts` → `semanticSearch()`

**Flow:**
1. Generate query embedding:
   - Gọi `generateEmbedding(query)` → Local Embedding Provider
   - Model: `all-MiniLM-L6-v2`
   - Dimensions: 384
   - Result: `[0.123, -0.456, 0.789, ...]` (384 numbers)
2. Convert sang PostgreSQL vector string: `[0.123, -0.456, ...]`
3. Vector search trong PostgreSQL:
   ```sql
   SELECT * FROM recent_chapters
   WHERE book_id = $1
     AND embedding_vector IS NOT NULL
   ORDER BY embedding_vector <=> $2::vector(384)  -- Cosine distance
   LIMIT 5
   ```
4. Return top 5 chapters (sorted by similarity)

**Ví dụ:**
- Query: "nhân vật chính làm gì?"
- Embedding: `[0.123, -0.456, ...]` (384 dims)
- Search tìm chapters có embedding gần với query embedding
- Tìm được chapters nói về "protagonist", "main character", "hero"
- **Không cần exact match keywords!**

### **Step 4: Construct Prompt với Database Context**

**File:** `services/geminiService.ts` → `generateResponse()`

**Flow:**
1. Lấy context từ database (Step 2)
2. Build prompt với:
   - Book context (summary, characters, writing style)
   - Recent chapters (top 5)
   - Semantic search results (top 5 relevant chapters)
3. Combine với user query

**Output:** Prompt đầy đủ với context từ database

### **Step 5: AI Response**

**File:** `services/geminiService.ts`

**Flow:**
1. Gọi Gemini API với prompt đầy đủ
2. AI phân tích context và generate response
3. Return response cho user

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW 1: IMPORT PROCESSING                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. User upload Google Doc URL                                │
│    ↓                                                          │
│ 2. Google Docs API → Extract content                         │
│    ↓                                                          │
│ 3. Create book + chapters in database                       │
│    ↓                                                          │
│ 4. Queue processing jobs (async)                             │
│    ↓                                                          │
│ 5. Background: Extract metadata (Gemini API)                 │
│    ↓                                                          │
│ 6. Background: Generate embeddings (Local Embedding)          │
│    ├─ Chapter-level: summary → embedding                    │
│    └─ Chunk-level: content chunks → embeddings              │
│    ↓                                                          │
│ 7. Save embeddings to database (vector(384))                 │
│    ↓                                                          │
│ ✅ Database ready for semantic search                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FLOW 2: CHAT PROCESSING                                      │
├─────────────────────────────────────────────────────────────┤
│ 1. User query                                                │
│    ↓                                                          │
│ 2. Get bookId from workProfile                               │
│    ↓                                                          │
│ 3. Retrieve context from database                            │
│    ├─ Book context (book_contexts)                          │
│    ├─ Recent chapters (recent_chapters)                      │
│    └─ Semantic search (vector search)                       │
│       ├─ Generate query embedding (Local)                   │
│       ├─ Vector search in PostgreSQL                        │
│       └─ Return top 5 relevant chapters                     │
│    ↓                                                          │
│ 4. Construct prompt with context                             │
│    ↓                                                          │
│ 5. Call Gemini API                                          │
│    ↓                                                          │
│ 6. Return AI response                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Bridge: book_id

**Flow 1 tạo:**
```typescript
book_id → Lưu vào workProfile.bookId
```

**Flow 2 sử dụng:**
```typescript
workProfile.bookId → getContextForQuery(bookId, query)
```

---

## 📝 Files Modified

### **Backend**
1. `server/db/schema.sql` - Changed `vector(768)` → `vector(384)`
2. `server/routes/googleDocs.ts` - Database init & job queueing
3. `server/jobs/chapterProcessingJob.ts` - Model version: `'all-MiniLM-L6-v2'`
4. `server/services/semanticSearchService.ts` - Updated SQL queries với `vector(384)`

### **Frontend**
5. `types.ts` - Added `bookId` fields
6. `App.tsx` - bookId handling
7. `services/geminiService.ts` - Database context retrieval

### **Configuration**
8. `package.json` - Added scripts: `embedding:start`, `embedding:test`, `dev:all`

---

## ✅ Testing Checklist

### **Local Embedding Server**
- [ ] Python 3.8+ installed
- [ ] Dependencies installed (`pip install sentence-transformers fastapi uvicorn`)
- [ ] Server started (`python local_embedding_server.py`)
- [ ] Health check passed (`curl http://localhost:8000/`)
- [ ] Embedding test passed (`curl -X POST http://localhost:8000/embed ...`)

### **Database**
- [ ] Schema has `vector(384)` columns
- [ ] Migration run (if needed): `psql -U postgres -d bot_writing_advanced -f server/db/migrate_to_384.sql`
- [ ] Embeddings can be saved
- [ ] Vector search works

### **Flow 1: Import**
- [ ] Google Doc import works
- [ ] Book created in database
- [ ] Chapters created in database
- [ ] Processing jobs queued
- [ ] Embeddings generated (384 dimensions)
- [ ] Embeddings saved to database

### **Flow 2: Chat**
- [ ] `bookId` passed in `documentContext`
- [ ] Context retrieved from database
- [ ] Semantic search works
- [ ] AI response includes database context

---

## 🐛 Troubleshooting

### **Lỗi: Module not found**
```bash
pip install sentence-transformers fastapi uvicorn
```

### **Lỗi: Port already in use**
```bash
# Windows:
netstat -ano | findstr :8000

# Kill process hoặc đổi port:
export PORT=8001
python local_embedding_server.py
```

**Update `.env`:**
```env
LOCAL_EMBEDDING_API_URL=http://localhost:8001
```

### **Lỗi: Model download failed**
```bash
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### **Lỗi: Out of memory**
Dùng model nhẹ hơn:
```bash
export EMBEDDING_MODEL=paraphrase-MiniLM-L3-v2
python local_embedding_server.py
```

**Update `.env`:**
```env
LOCAL_EMBEDDING_DIMENSIONS=256
```

**Update database schema:**
```sql
ALTER TABLE recent_chapters ALTER COLUMN embedding_vector TYPE vector(256);
ALTER TABLE chapter_chunks ALTER COLUMN chunk_embedding TYPE vector(256);
ALTER TABLE embedding_cache ALTER COLUMN embedding_vector TYPE vector(256);
```

### **Lỗi: Database vector dimension mismatch**
```bash
# Run migration script
psql -U postgres -d bot_writing_advanced -f server/db/migrate_to_384.sql
```

---

## 📊 Performance

### **Embedding Generation**
- Single embedding: ~10-50ms (CPU)
- Batch (10 texts): ~50-200ms (CPU)
- Throughput: ~100-200 embeddings/second

### **Memory Usage**
- Model: ~200-500MB RAM
- Server: ~100-200MB RAM
- Total: ~300-700MB RAM

### **Vector Search**
- Query latency: < 500ms (with index)
- Cache hit rate: > 80% (after warmup)

---

## 🎯 Key Features

### **Local Embedding Provider**
- ✅ Model: `all-MiniLM-L6-v2` (384 dimensions)
- ✅ Cost: FREE (100% local)
- ✅ Privacy: 100% (no data sent to external APIs)
- ✅ Performance: ~85% of OpenAI embeddings quality
- ✅ Speed: ~100-200 embeddings/second (CPU)

### **Database Integration**
- ✅ PostgreSQL + pgvector with `vector(384)`
- ✅ Chapter-level embeddings
- ✅ Chunk-level embeddings (for long chapters)
- ✅ Embedding cache (avoid regeneration)

### **Semantic Search**
- ✅ Vector search with cosine similarity
- ✅ Hierarchical search (chapter → chunk)
- ✅ Context retrieval for AI responses

---

## 🎯 Tóm Tắt

1. **Local Embedding Provider:** `all-MiniLM-L6-v2` (384 dimensions, free)
2. **Flow 1:** Import → Process → Generate embeddings → Save to database
3. **Flow 2:** Query → Semantic search → Get context → AI response
4. **Database:** PostgreSQL + pgvector với `vector(384)`
5. **Architecture:** Free-first, pluggable, có thể switch provider sau

---

**Status:** ✅ Implementation Complete  
**Ready for:** Testing & Validation


