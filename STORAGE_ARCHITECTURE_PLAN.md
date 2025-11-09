# Storage Architecture Plan - Book Context & Workspace Management

## 📋 Tổng Quan Plan Của Bạn

Bạn muốn có 3 loại storage với PostgreSQL:

1. **Book Context Storage** - Lưu thông tin quan trọng về toàn bộ book (whole thing)
2. **Visualization/Specification Storage** - Lưu chi tiết cho 5 chapters gần nhất
3. **Workspace Storage** - Lưu workspace state để persist khi user quay lại

## 💭 Phân Tích & Đánh Giá Plan

### ✅ Điểm Mạnh

1. **Separation of Concerns** - Tách biệt rõ ràng giữa:
   - Deep context (whole book) vs. Recent context (5 chapters)
   - Book data vs. Workspace state

2. **Performance Optimization** - 
   - Storage 1: Lightweight, query nhanh cho toàn bộ book
   - Storage 2: Focus 5 chapters gần nhất → reduce memory/compute cho AI agent

3. **Scalability** - 
   - Storage 1 không tăng trưởng quá nhiều khi book dài
   - Storage 2 chỉ giữ recent chapters → manageable size

### 🤔 Điểm Cần Xem Xét

1. **Data Consistency** - 
   - Làm sao đảm bảo Storage 1 và Storage 2 sync?
   - Khi chapter mới được thêm, làm sao update Storage 2 (rolling window của 5 chapters)?

2. **Query Strategy** - 
   - Khi nào query Storage 1 vs. Storage 2?
   - Agent cần access cả 2 storage không?

3. **Embedding Strategy** - 
   - Có cần embeddings cho cả 2 storage?
   - Hay chỉ Storage 2 (5 chapters) cần embeddings cho semantic search?

## 🏗️ Đề Xuất Architecture

### Storage 1: Book Context (Lightweight, Whole Book)

**Mục đích:** 
- Store "essential DNA" của book
- Dùng cho initial understanding, overview, book-level decisions
- Không cần embeddings (too expensive, not needed)

**Data Structure:**
```
book_context:
- book_id (PK)
- title, author, genre, theme
- summary (tóm tắt book, ~500-1000 words)
- characters (JSON: name, role, description, relationships)
- world_setting (JSON: locations, rules, timeline)
- writing_style (JSON: tone, POV, voice characteristics)
- story_arc (JSON: act1_summary, act2_summary, act3_summary)
- metadata (word_count, chapter_count, last_updated)
- embedding? → KHÔNG, quá expensive cho toàn bộ book
```

**Normalization Strategy:**
- **Text Summarization** - Dùng LLM để extract:
  - Summary từ full text → 500-1000 words
  - Characters → structured JSON
  - World building → structured JSON
  - Story arc → structured JSON
  
- **Key Extraction** - Chỉ lưu những gì **quan trọng cho writing decisions:**
  - Character names, roles, relationships
  - Important locations, world rules
  - Writing style patterns
  - Story structure overview

**Query Pattern:**
- Get book context for initial understanding
- Fast lookup by book_id
- No semantic search needed (structured data)

### Storage 2: Recent Chapters (Detailed, 5 Chapters Window)

**Mục đích:**
- Store chi tiết của 5 chapters gần nhất
- Dùng cho immediate writing context
- Semantic search với embeddings cho agent assistance

**Data Structure:**
```
recent_chapters:
- chapter_id (PK)
- book_id (FK)
- chapter_number (integer)
- title
- content (full text của chapter)
- summary (~200 words)
- key_scenes (JSON: scene descriptions)
- character_appearances (JSON: characters in chapter)
- plot_points (JSON: events, conflicts, resolutions)
- writing_notes (JSON: author notes, AI suggestions)
- embedding_vector (vector, 768 or 1536 dimensions)
- created_at, updated_at
- window_position (1-5, rolling window)
```

**Normalization Strategy:**
- **Full Text Storage** - Giữ nguyên content của 5 chapters gần nhất
- **Structured Metadata** - Extract:
  - Key scenes
  - Character appearances
  - Plot points
  - Writing notes
  
- **Embedding Generation** - 
  - Generate embeddings cho full chapter content
  - Dùng Vertex AI embeddings (text-embedding-004 hoặc textembedding-gecko@003)
  - Store vector trong PostgreSQL với pgvector extension

**Query Pattern:**
- Get 5 most recent chapters by book_id
- Semantic search trong 5 chapters (dùng vector similarity)
- Update rolling window khi có chapter mới

**Rolling Window Logic:**
```sql
-- Khi chapter mới được thêm:
-- 1. Delete chapter với window_position = 5 (oldest)
-- 2. Shift window_position: 4→5, 3→4, 2→3, 1→2
-- 3. Insert new chapter với window_position = 1
```

### Storage 3: Workspace State

**Mục đích:**
- Persist workspace state khi user quay lại
- Store user preferences, UI state, project selection

**Data Structure:**
```
workspaces:
- workspace_id (PK)
- user_id (FK to users)
- name
- selected_book_id
- selected_chapter_id
- canvas_state (JSON: pages positions, sizes, zoom)
- chat_messages (JSON: recent messages, max 50)
- settings (JSON: theme, preferences)
- created_at, updated_at
- last_accessed_at

workspace_projects:
- project_id (PK)
- workspace_id (FK)
- book_id (FK)
- project_name
- project_state (JSON: current phase, notes)
- created_at, updated_at
```

**Normalization Strategy:**
- **JSON Storage** - Store UI state, messages, settings as JSON
- **Reference Data** - Link to books, chapters, users
- **Soft Delete** - Mark deleted, không hard delete

**Query Pattern:**
- Load workspace by user_id
- Update workspace state on changes
- Cleanup old messages (keep last 50)

## 🔄 Data Flow & Normalization Process

### Input: Raw Google Docs Content

**Raw Data:**
```
{
  doc_id: "...",
  title: "...",
  plain_text: "...", // Full book text
  outline: [...],    // Chapters structure
  word_count: 10000
}
```

### Step 1: Book-Level Analysis (Storage 1)

**Process:**
1. **Send to LLM** (Gemini) với prompt:
   ```
   Analyze this book and extract:
   - Summary (500-1000 words)
   - Characters (names, roles, relationships)
   - World setting (locations, rules)
   - Writing style (tone, POV, voice)
   - Story arc (3-act structure)
   ```

2. **Parse LLM Response** → Structured JSON

3. **Store in book_context table**

**Normalization Techniques:**
- **Summarization** - Dùng LLM để compress full text → summary
- **Structured Extraction** - Dùng LLM với structured output (JSON schema)
- **Key Information Only** - Chỉ lưu những gì ảnh hưởng đến writing decisions

### Step 2: Chapter-Level Processing (Storage 2)

**Process:**
1. **Split by Chapters** - Dựa vào outline hoặc chapter markers

2. **For Each Chapter (current + 4 previous):**
   - **Full Text** → Store trong `content`
   - **Generate Summary** → LLM summary (~200 words)
   - **Extract Metadata** → LLM extract:
     - Key scenes
     - Character appearances
     - Plot points
   
3. **Generate Embeddings:**
   - **Dùng Vertex AI Embeddings API**
   - Input: Full chapter content hoặc summary (tùy accuracy/speed tradeoff)
   - Output: Vector (768 hoặc 1536 dimensions)
   - Store trong `embedding_vector` column

4. **Store in recent_chapters** với `window_position`

**Normalization Techniques:**
- **Chunking** - Nếu chapter quá dài (>2000 words), chunk và embed riêng
- **Hybrid Embedding** - 
  - Full chapter embedding (for semantic search)
  - Scene-level embeddings (for fine-grained search)
- **Metadata Extraction** - Structured JSON từ LLM

### Step 3: Workspace Persistence

**Process:**
1. **User Interactions** → Update workspace state
2. **Save to workspace table** on changes
3. **Load from workspace table** on login

## 🤖 Vertex AI Embeddings - Nên Dùng Không?

### ✅ Nên Dùng Cho Storage 2 (Recent Chapters)

**Lý do:**
1. **Semantic Search** - Agent cần tìm "similar scenes" hoặc "context about character X"
2. **Manageable Size** - Chỉ 5 chapters → reasonable embedding cost
3. **Performance** - Vector similarity search rất nhanh với pgvector
4. **Quality** - Vertex AI embeddings tốt cho Vietnamese text

**Recommendation:**
- **Model:** `text-embedding-004` hoặc `textembedding-gecko@003`
- **Dimensions:** 768 hoặc 1536 (tùy accuracy/speed tradeoff)
- **Input:** Chapter content hoặc chapter summary
- **Storage:** PostgreSQL với `pgvector` extension

### ❌ KHÔNG Nên Cho Storage 1 (Book Context)

**Lý do:**
1. **Structured Data** - Book context là JSON structured, không cần semantic search
2. **Query Pattern** - Lookup by book_id, không cần similarity search
3. **Cost** - Embedding toàn bộ book content quá expensive
4. **Unnecessary** - Key-value lookup đủ cho use case

## 📊 Database Schema Proposal

### Schema Structure

```sql
-- Books table (core)
books (
  book_id UUID PRIMARY KEY,
  google_doc_id TEXT UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  total_word_count INTEGER,
  total_chapters INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Storage 1: Book Context (lightweight)
book_contexts (
  book_id UUID PRIMARY KEY REFERENCES books(book_id),
  summary TEXT,  -- ~500-1000 words
  characters JSONB,  -- {name, role, description, relationships}
  world_setting JSONB,  -- {locations, rules, timeline}
  writing_style JSONB,  -- {tone, pov, voice}
  story_arc JSONB,  -- {act1, act2, act3}
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Storage 2: Recent Chapters (detailed + embeddings)
recent_chapters (
  chapter_id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(book_id),
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,  -- Full chapter text
  summary TEXT,  -- ~200 words
  key_scenes JSONB,
  character_appearances JSONB,
  plot_points JSONB,
  writing_notes JSONB,
  embedding_vector vector(768),  -- pgvector
  window_position INTEGER CHECK (window_position BETWEEN 1 AND 5),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(book_id, window_position)
);

-- Index for semantic search
CREATE INDEX ON recent_chapters USING ivfflat (embedding_vector vector_cosine_ops);

-- Storage 3: Workspaces
workspaces (
  workspace_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  name TEXT,
  selected_book_id UUID REFERENCES books(book_id),
  selected_chapter_id UUID REFERENCES recent_chapters(chapter_id),
  canvas_state JSONB,  -- {pages: [...], zoom, pan}
  chat_messages JSONB,  -- [{id, role, text, timestamp}, ...]
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_accessed_at TIMESTAMP
);
```

## 🔄 Normalization Workflow

### Workflow 1: New Book Imported

1. **Extract from Google Docs:**
   - Full text
   - Outline (chapters)
   - Metadata (title, word count)

2. **Generate Book Context (Storage 1):**
   - Send to LLM: "Analyze this book and extract..."
   - Parse structured response
   - Save to `book_contexts`

3. **Process Recent Chapters (Storage 2):**
   - Split into chapters
   - For last 5 chapters (hoặc tất cả nếu < 5):
     - Generate summary
     - Extract metadata
     - Generate embeddings (Vertex AI)
     - Save to `recent_chapters` with window_position

4. **Create/Update Workspace:**
   - Create workspace entry
   - Set selected_book_id
   - Initialize canvas_state

### Workflow 2: New Chapter Added

1. **Process New Chapter:**
   - Full text → `content`
   - Generate summary
   - Extract metadata
   - Generate embedding

2. **Update Rolling Window:**
   - Delete chapter với `window_position = 5`
   - Shift positions: 4→5, 3→4, 2→3, 1→2
   - Insert new chapter với `window_position = 1`

3. **Update Book Context (if needed):**
   - Update `total_chapters`
   - Optionally: Update summary nếu chapter quan trọng

### Workflow 3: Agent Query (Writing Assistance)

1. **Get Book Context (Storage 1):**
   - Query `book_contexts` by book_id
   - Get: summary, characters, world_setting, writing_style

2. **Get Recent Context (Storage 2):**
   - Query `recent_chapters` by book_id
   - Get: 5 most recent chapters với full content

3. **Semantic Search (if needed):**
   - User query → Generate embedding
   - Vector similarity search trong `recent_chapters.embedding_vector`
   - Return relevant chapters/scenes

4. **Combine Context:**
   - Book-level context (Storage 1)
   - Recent chapters context (Storage 2)
   - Semantic search results (nếu có)
   - Send to LLM for writing assistance

## 💡 Recommendations

### 1. Storage Strategy

✅ **Tốt:**
- Separate lightweight (Storage 1) vs. detailed (Storage 2)
- Rolling window cho recent chapters (Storage 2)
- Workspace persistence (Storage 3)

💡 **Đề xuất thêm:**
- **Cache Layer** - Redis cache cho frequent queries
- **Archive Storage** - Move old chapters từ Storage 2 sang archive table

### 2. Embedding Strategy

✅ **Dùng Vertex AI Embeddings:**
- **Cho Storage 2** (recent chapters)
- Model: `text-embedding-004` hoặc `textembedding-gecko@003`
- **KHÔNG dùng cho Storage 1** (unnecessary, too expensive)

💡 **Optimization:**
- **Chunk long chapters** - If chapter > 2000 words, split và embed chunks
- **Hybrid search** - Combine vector similarity với keyword search
- **Cache embeddings** - Don't regenerate if chapter unchanged

### 3. Normalization Strategy

✅ **Tách biệt extraction layers:**
- **Level 1:** Raw extraction (Google Docs → structured data)
- **Level 2:** LLM analysis (full text → summary, metadata)
- **Level 3:** Embedding generation (content → vectors)

💡 **Best Practices:**
- **Batch processing** - Process multiple chapters cùng lúc
- **Incremental updates** - Chỉ update khi có changes
- **Validation** - Validate LLM output trước khi save
- **Fallback** - Nếu LLM fails, keep raw data

### 4. Query Performance

✅ **Indexes:**
- `book_id` indexes trên cả 3 storage
- Vector index cho `embedding_vector`
- `window_position` index cho rolling window queries

💡 **Query optimization:**
- **Materialized views** - Pre-compute frequent queries
- **Partitioning** - Partition chapters by book_id nếu nhiều data

## 🎯 Final Recommendations

### Architecture Decision

1. **Storage 1 (Book Context):**
   - ✅ Structured JSON, no embeddings
   - ✅ LLM extraction cho normalization
   - ✅ Fast lookup by book_id

2. **Storage 2 (Recent Chapters):**
   - ✅ Full text + structured metadata
   - ✅ **Vertex AI embeddings** cho semantic search
   - ✅ Rolling window (5 chapters)
   - ✅ pgvector extension

3. **Storage 3 (Workspace):**
   - ✅ JSON state storage
   - ✅ Soft delete
   - ✅ Automatic save/load

### Normalization Pipeline

```
Google Docs Input
    ↓
[Extract Raw Data]
    ↓
    ├─→ [LLM Analysis] → Storage 1 (Book Context)
    │      (Summary, Characters, World, Style, Arc)
    │
    └─→ [Split Chapters] → [Process Each Chapter]
                              ├─→ Generate Summary (LLM)
                              ├─→ Extract Metadata (LLM)
                              └─→ Generate Embedding (Vertex AI)
                                   → Storage 2 (Recent Chapters)
```

### Cost Optimization

1. **Embeddings:**
   - Chỉ generate cho Storage 2 (5 chapters)
   - Cache embeddings (don't regenerate if unchanged)
   - Batch processing để reduce API calls

2. **LLM Calls:**
   - Batch analysis cho multiple chapters
   - Cache summaries nếu chapter unchanged
   - Use cheaper models cho simple extraction

3. **Storage:**
   - Archive old chapters (move out of Storage 2)
   - Compress JSONB fields nếu lớn
   - Index optimization

## ❓ Questions to Consider

1. **How to handle very long chapters?**
   - Chunk và embed separately?
   - Or embed full chapter?

2. **Update frequency?**
   - When to regenerate book context?
   - When to update embeddings?

3. **Multiple books per user?**
   - How to handle workspace với multiple books?

4. **Chapter ordering?**
   - How to determine "5 most recent"? By chapter_number or by updated_at?

---

*Đây là high-level architecture plan. Bạn có muốn tôi chi tiết hóa phần nào không?*






