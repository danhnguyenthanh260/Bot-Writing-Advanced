# 🎯 Free-First Architecture - Semantic Search

**Mục tiêu:** Hệ thống Semantic Search hoạt động hoàn toàn local, không phụ thuộc cloud API trả phí, nhưng có cấu trúc sẵn để sau này bật OpenAI/Vertex AI chỉ bằng 1 config.

**Fixed Architecture Pattern** - Có thể áp dụng lại cho các dự án khác.

---

## 🧩 Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────┐
│     TypeScript Backend              │
│  ─────────────────────────────────  │
│  semanticSearchService.ts           │
│  hybridSearchService.ts             │
│  embeddingProvider.ts (pluggable)   │
│  ─────────────────────────────────  │
│  Embedding Provider Layer           │
│  ├─ Local (free, default)           │
│  ├─ OpenAI (paid, optional)         │
│  └─ Vertex AI (paid, optional)     │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Local Embedding Server (Python)    │
│  FastAPI + Sentence Transformers    │
│  Port: 8000                         │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  PostgreSQL + pgvector (Docker)     │
│  Local database, vector index       │
└─────────────────────────────────────┘
```

---

## ✅ Ưu Điểm Kiến Trúc Free-First

| Ưu điểm | Mô tả |
|---------|-------|
| 💸 **Không tốn chi phí** | Không gọi API trả phí nào |
| 🔒 **Bảo mật tuyệt đối** | Toàn bộ dữ liệu ở local |
| 🧠 **Mô hình embedding khá mạnh** | MiniLM đạt ~85% hiệu năng OpenAI |
| ⚙️ **Cấu trúc mở rộng dễ** | Sẵn sàng bật Vertex/OpenAI khi cần |
| 🧩 **Thử nghiệm offline** | Dễ debug, không phụ thuộc mạng |
| 🔄 **Fixed architecture** | Pattern có thể tái sử dụng |

---

## 🚀 Setup Local-First (Free)

### Bước 1: Setup PostgreSQL + pgvector (Docker)

```bash
# Chạy PostgreSQL với pgvector
docker run -d \
  --name pgvector-local \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bot_writing_advanced \
  -p 5432:5432 \
  ankane/pgvector

# Verify
docker ps | grep pgvector-local
```

**Lưu ý:** Nếu đã có PostgreSQL local, chỉ cần enable extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Bước 2: Setup Local Embedding Server (Python)

**Cài đặt dependencies:**
```bash
# Python 3.8+ required
pip install sentence-transformers fastapi uvicorn
```

**Chạy embedding server:**
```bash
# Từ thư mục project root
python local_embedding_server.py

# Hoặc với uvicorn
uvicorn local_embedding_server:app --host 0.0.0.0 --port 8000
```

**Verify server:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","model":"all-MiniLM-L6-v2"}
```

### Bước 3: Update Database Schema (nếu cần)

**Local model dùng 384 dimensions:**
```sql
-- Update schema nếu đang dùng 768 dims
ALTER TABLE recent_chapters 
  ALTER COLUMN embedding_vector TYPE vector(384);

ALTER TABLE chapter_chunks 
  ALTER COLUMN chunk_embedding TYPE vector(384);

ALTER TABLE embedding_cache 
  ALTER COLUMN embedding_vector TYPE vector(384);
```

**Hoặc giữ 768 và dùng model lớn hơn:**
```bash
# Set environment variable
export EMBEDDING_MODEL=all-mpnet-base-v2  # 768 dims
python local_embedding_server.py
```

### Bước 4: Configure Backend

**File:** `.env`

```env
# Embedding Provider (free-first)
EMBEDDING_PROVIDER=local

# Local Embedding Server URL
LOCAL_EMBEDDING_API_URL=http://localhost:8000

# Database (local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bot_writing_advanced
```

### Bước 5: Test

```bash
# Start backend
npm run server

# Test embedding generation
# (sẽ tự động dùng local provider)
```

---

## 🔄 Switch Provider (Sau Này)

### Option 1: Switch to OpenAI

**File:** `.env`
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Update schema to 1536 dims
# ALTER TABLE ... ALTER COLUMN embedding_vector TYPE vector(1536);
```

**Code tự động switch** - không cần thay đổi code!

### Option 2: Switch to Vertex AI

**File:** `.env`
```env
EMBEDDING_PROVIDER=vertex-ai
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Schema: 768 dims (default)
```

**Code tự động switch** - không cần thay đổi code!

---

## 📊 So Sánh Providers

| Provider | Dimensions | Cost | Setup | Performance | Data Privacy |
|----------|-----------|------|-------|-------------|--------------|
| **Local** | 384/768 | 💰 Free | Medium | ~85% OpenAI | 🔒 100% Local |
| **OpenAI** | 1536 | 💰💰 Paid | Easy | 100% | ⚠️ Cloud |
| **Vertex AI** | 768 | 💰💰 Paid | Medium | ~95% OpenAI | ⚠️ Cloud |

---

## 🧪 Testing

### Test 1: Local Embedding Server

```bash
# Health check
curl http://localhost:8000/health

# Single embedding
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "test embedding"}'

# Batch embeddings
curl -X POST http://localhost:8000/embed/batch \
  -H "Content-Type: application/json" \
  -d '{"texts": ["text 1", "text 2"]}'
```

### Test 2: Backend Integration

```typescript
// Test script
import { generateEmbedding, getEmbeddingModelInfo } from './server/services/vertexEmbeddingService';

(async () => {
  const info = getEmbeddingModelInfo();
  console.log('Provider:', info.provider);
  console.log('Model:', info.model);
  console.log('Dimensions:', info.dimensions);
  
  const embedding = await generateEmbedding("Test semantic search");
  console.log('Embedding length:', embedding.length);
  console.log('First 5 values:', embedding.slice(0, 5));
})();
```

### Test 3: Semantic Search

```typescript
import { semanticSearch } from './server/services/semanticSearchService';

(async () => {
  const results = await semanticSearch(
    "tìm kiếm ngữ nghĩa với cơ sở dữ liệu",
    "book-id-here",
    5
  );
  console.log('Search results:', results);
})();
```

---

## 📝 Environment Variables

### Local Provider (Default)
```env
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_API_URL=http://localhost:8000
EMBEDDING_MODEL=all-MiniLM-L6-v2  # Optional, for Python server
```

### OpenAI Provider
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### Vertex AI Provider
```env
EMBEDDING_PROVIDER=vertex-ai
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

---

## 🔧 Architecture Pattern (Fixed & Reusable)

### Provider Interface

```typescript
interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddingsBatch(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
  getModelName(): string;
  getProvider(): EmbeddingProvider;
}
```

### Factory Pattern

```typescript
function createEmbeddingProvider(): IEmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER || 'local';
  
  switch (provider) {
    case 'local': return new LocalEmbeddingProvider();
    case 'openai': return new OpenAIEmbeddingProvider();
    case 'vertex-ai': return new VertexAIEmbeddingProvider();
    default: return new LocalEmbeddingProvider();
  }
}
```

**Pattern này có thể tái sử dụng cho bất kỳ dự án nào!**

---

## 📦 Dependencies

### Backend (TypeScript)
```json
{
  "dependencies": {
    "pg": "^8.16.3",
    "@types/pg": "^8.15.6"
  },
  "optionalDependencies": {
    "openai": "^4.0.0",  // Only if using OpenAI
    "google-auth-library": "^9.0.0"  // Only if using Vertex AI
  }
}
```

### Local Embedding Server (Python)
```txt
sentence-transformers>=2.2.0
fastapi>=0.100.0
uvicorn>=0.23.0
```

---

## 🎯 Checklist Implementation

- [ ] Setup PostgreSQL + pgvector (Docker hoặc local)
- [ ] Install Python dependencies
- [ ] Start local embedding server
- [ ] Update `.env` với `EMBEDDING_PROVIDER=local`
- [ ] Update database schema (384 dims nếu cần)
- [ ] Test embedding generation
- [ ] Test semantic search
- [ ] Verify không có API calls ra ngoài
- [ ] Document cho team

---

## 🔗 Tài Liệu Liên Quan

- [SEMANTIC_SEARCH_IMPLEMENTATION.md](./SEMANTIC_SEARCH_IMPLEMENTATION.md) - Implementation details
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Project status

---

## 💡 Best Practices

1. **Development:** Dùng local provider (free, fast iteration)
2. **Production:** Có thể switch sang cloud provider nếu cần scale
3. **Testing:** Luôn test với local provider trước
4. **Migration:** Dễ dàng migrate embeddings giữa providers (cùng dimensions)

---

**Status:** ✅ Ready to implement  
**Priority:** HIGH  
**Estimated Time:** 1-2 hours setup

