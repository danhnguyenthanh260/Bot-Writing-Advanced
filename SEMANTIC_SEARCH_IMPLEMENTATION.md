# 🎯 Semantic Vector Search Implementation Guide

**Tình trạng hiện tại:** ✅ Đã implement với Local Embedding Provider (all-MiniLM-L6-v2)

> **📘 Xem hướng dẫn chi tiết:** [LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md)

---

## 📊 Tình Trạng Hiện Tại

### ✅ Đã Implement (Complete)

1. **PostgreSQL + pgvector:**
   - Extension `vector` đã enable
   - Tables với cột `embedding_vector vector(384)` ✅
   - Indexes cho vector search

2. **Database Schema:**
   ```sql
   -- recent_chapters table
   embedding_vector vector(384)  -- ✅ Updated for Local Embedding
   
   -- chapter_chunks table  
   chunk_embedding vector(384)  -- ✅ Updated for Local Embedding
   
   -- embedding_cache table
   embedding_vector vector(384)  -- ✅ Updated for Local Embedding
   ```

3. **Services Đã Tạo:**
   - `semanticSearchService.ts` - Semantic search logic ✅
   - `embeddingProvider.ts` - Pluggable embedding providers ✅
   - `vertexEmbeddingService.ts` - Uses Local/OpenAI/Vertex AI ✅
   - `hybridSearchService.ts` - Hybrid search ✅
   - `embeddingCacheService.ts` - Caching ✅
   - `hierarchicalEmbeddingService.ts` - Hierarchical search ✅

### ✅ Current Implementation

**Local Embedding Provider (Default - Free):**
- Model: `all-MiniLM-L6-v2` (384 dimensions)
- Cost: FREE (100% local)
- Performance: ~85% of OpenAI embeddings quality
- See: [LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md) for complete setup

---

## 🎯 Mục Tiêu

> **Tích hợp semantic vector search thực sự** vào hệ thống, cho phép tìm kiếm nội dung "theo ý nghĩa" thay vì chỉ từ khóa.

**✅ Current Flow (Local Embedding - Default):**
```
[User Query]
    ↓
[Local Embedding Provider] → Semantic embedding (384 dims) ✅
    ↓
[PostgreSQL + pgvector] → Vector search (cosine similarity)
    ↓
[Backend TypeScript] → Trả kết quả semantic
```

**Alternative Flows (Paid Options):**
```
[User Query]
    ↓
[OpenAI / Vertex AI] → Semantic embedding (1536/768 dims)
    ↓
[PostgreSQL + pgvector] → Vector search (cosine similarity)
    ↓
[Backend TypeScript] → Trả kết quả semantic
```

> **📘 For Local Embedding setup:** See [LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md)

---

## 🔧 Option 0: Local Embedding (Free - Default) ✅

**Status:** ✅ Implemented and Active

> **📘 Complete guide:** [LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md)

**Quick Setup:**
```bash
# Install Python dependencies
pip install sentence-transformers fastapi uvicorn

# Start Local Embedding Server
python local_embedding_server.py

# Configure .env
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_API_URL=http://localhost:8000
```

**Features:**
- Model: `all-MiniLM-L6-v2` (384 dimensions)
- Cost: FREE (100% local)
- Privacy: 100% (no data sent to external APIs)
- Performance: ~85% of OpenAI embeddings quality

---

## 🔧 Option 1: Google Vertex AI (Paid - Alternative)

### 1.1. Setup Google Vertex AI

**File:** `server/services/vertexEmbeddingService.ts`

```typescript
import { VertexAI } from '@google-cloud/aiplatform';
import { getCachedEmbedding, cacheEmbedding } from './embeddingCacheService';

const EMBEDDING_DIMENSIONS = 768;
const MODEL_NAME = 'text-embedding-004'; // Google's embedding model

// Initialize Vertex AI client
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: 'us-central1',
});

/**
 * Generate semantic embedding using Google Vertex AI
 */
export async function generateEmbedding(
  content: string,
  modelVersion: string = MODEL_NAME
): Promise<number[]> {
  try {
    // Check cache first
    const cached = await getCachedEmbedding(content, modelVersion);
    if (cached) {
      return cached;
    }
    
    // Generate embedding via Vertex AI
    const model = vertexAI.preview.getGenerativeModel({
      model: modelVersion,
    });
    
    // For embeddings, use the embedding API
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1/publishers/google/models/${modelVersion}:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{ content }],
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Vertex AI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const embedding = data.predictions[0].embeddings.values;
    
    // Validate dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`);
    }
    
    // Cache the embedding
    await cacheEmbedding(content, embedding, modelVersion);
    
    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

/**
 * Get access token for Vertex AI
 */
async function getAccessToken(): Promise<string> {
  // Use service account or application default credentials
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token!;
}
```

### 1.2. Environment Variables

**File:** `.env`

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Or use service account email/key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 1.3. Install Dependencies

```bash
npm install @google-cloud/aiplatform google-auth-library
```

---

## 🔧 Option 2: OpenAI Embeddings (Alternative)

Nếu muốn dùng OpenAI thay vì Google Vertex AI:

### 2.1. Update Service

**File:** `server/services/openaiEmbeddingService.ts` (tạo mới)

```typescript
import OpenAI from 'openai';
import { getCachedEmbedding, cacheEmbedding } from './embeddingCacheService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_DIMENSIONS = 1536; // OpenAI text-embedding-3-small
const MODEL_NAME = 'text-embedding-3-small';

/**
 * Generate semantic embedding using OpenAI
 */
export async function generateEmbedding(
  content: string,
  modelVersion: string = MODEL_NAME
): Promise<number[]> {
  try {
    // Check cache first
    const cached = await getCachedEmbedding(content, modelVersion);
    if (cached) {
      return cached;
    }
    
    // Generate embedding via OpenAI
    const response = await openai.embeddings.create({
      model: modelVersion,
      input: content,
    });
    
    const embedding = response.data[0].embedding;
    
    // Validate dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`);
    }
    
    // Cache the embedding
    await cacheEmbedding(content, embedding, modelVersion);
    
    return embedding;
  } catch (error) {
    console.error('OpenAI embedding generation error:', error);
    throw error;
  }
}

/**
 * Generate embeddings in batch
 */
export async function generateEmbeddingsBatch(
  contents: string[],
  modelVersion: string = MODEL_NAME
): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: modelVersion,
      input: contents,
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('OpenAI batch embedding error:', error);
    throw error;
  }
}
```

### 2.2. Update Database Schema

Nếu dùng OpenAI (1536 dims), cần update schema:

```sql
-- Update embedding dimensions
ALTER TABLE recent_chapters 
  ALTER COLUMN embedding_vector TYPE vector(1536);

ALTER TABLE chapter_chunks 
  ALTER COLUMN chunk_embedding TYPE vector(1536);

ALTER TABLE embedding_cache 
  ALTER COLUMN embedding_vector TYPE vector(1536);
```

### 2.3. Environment Variables

```env
OPENAI_API_KEY=sk-...
```

### 2.4. Install Dependencies

```bash
npm install openai
```

---

## 🔧 Option 3: Google Gemini Embeddings (Simplest - Đã có Gemini API)

Nếu đã có Gemini API key, có thể dùng Gemini để generate embeddings:

**File:** `server/services/geminiEmbeddingService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCachedEmbedding, cacheEmbedding } from './embeddingCacheService';

const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate embedding using Gemini (via embedding API)
 * Note: Gemini doesn't have direct embedding API, but we can use it for semantic tasks
 * For actual embeddings, use Vertex AI or OpenAI
 */
export async function generateEmbedding(
  content: string
): Promise<number[]> {
  // Gemini doesn't have embedding API directly
  // Use Vertex AI embedding API instead
  // This is a placeholder - implement with Vertex AI
  throw new Error('Use Vertex AI embedding service instead');
}
```

**Recommendation:** Dùng Vertex AI (Option 1) vì đã có Google Cloud setup

---

## 📝 Implementation Steps

### Step 1: Chọn Embedding Provider

- **Option A:** Google Vertex AI (recommended - phù hợp với hệ thống)
- **Option B:** OpenAI (nếu muốn đơn giản hơn)
- **Option C:** Cohere, HuggingFace, etc.

### Step 2: Update `vertexEmbeddingService.ts`

Thay thế placeholder code bằng implementation thực sự (theo Option 1 hoặc 2)

### Step 3: Update Environment Variables

Thêm credentials vào `.env`

### Step 4: Test Embedding Generation

```typescript
// Test script
import { generateEmbedding } from './server/services/vertexEmbeddingService';

(async () => {
  const embedding = await generateEmbedding("Test content");
  console.log('Embedding dimensions:', embedding.length);
  console.log('First 5 values:', embedding.slice(0, 5));
})();
```

### Step 5: Test Semantic Search

```typescript
// Test semantic search
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

### Step 6: Update Processing Jobs

Đảm bảo `bookProcessingJob.ts` và `chapterProcessingJob.ts` sử dụng embedding service mới

---

## 🧪 Testing

### Test 1: Embedding Generation

```bash
npm run test:embedding
```

**Expected:**
- Embedding có đúng dimensions (768 hoặc 1536)
- Embedding không phải zero vector
- Embedding được cache

### Test 2: Semantic Search

```bash
npm run test:semantic-search
```

**Expected:**
- Tìm được documents liên quan (không chỉ exact match)
- Results sorted by similarity
- Distance scores hợp lý

### Test 3: Performance

```bash
npm run test:search-performance
```

**Expected:**
- Query latency < 500ms
- Cache hit rate > 80%

---

## 📊 So Sánh Options

| Feature | **Local (Default)** | Vertex AI | OpenAI | Gemini |
|---------|---------------------|-----------|--------|--------|
| **Dimensions** | 384 | 768 | 1536 | N/A |
| **Cost** | ✅ FREE | $$ | $$ | N/A |
| **Setup** | Easy | Medium | Easy | N/A |
| **Privacy** | ✅ 100% local | ❌ Cloud | ❌ Cloud | N/A |
| **Integration** | ✅ Ready | ✅ Phù hợp | ⚠️ Cần update schema | ❌ Không có embedding API |
| **Multilingual** | ✅ | ✅ | ✅ | ✅ |
| **Performance** | ⭐⭐⭐ (85%) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | N/A |

**Recommendation:** 
- **Default:** **Local (Free)** - Best for privacy, cost, and ease of setup
- **Alternative:** **Vertex AI** - If you need higher quality and have Google Cloud setup
- **Alternative:** **OpenAI** - If you need best quality and don't mind cost

---

## ✅ Checklist Implementation

### **Local Embedding (Default - Free)** ✅
- [x] Chọn embedding provider: Local (all-MiniLM-L6-v2)
- [x] Update `embeddingProvider.ts` với LocalEmbeddingProvider
- [x] Update database schema: `vector(384)`
- [x] Add environment variables
- [x] Install Python dependencies
- [x] Test embedding generation
- [x] Test semantic search
- [x] Update processing jobs
- [x] Documentation: [LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md)

### **Alternative Providers (Optional)**
- [ ] Chọn embedding provider (Vertex AI / OpenAI)
- [ ] Update `.env` với provider credentials
- [ ] Update database schema nếu cần (vector dimensions)
- [ ] Test embedding generation
- [ ] Test semantic search

---

## 🔗 Tài Liệu Liên Quan

- **[LOCAL_EMBEDDING_GUIDE.md](./LOCAL_EMBEDDING_GUIDE.md)** - ✅ Complete guide for Local Embedding (Default)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Tình trạng dự án
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [server/services/semanticSearchService.ts](./server/services/semanticSearchService.ts) - Search service
- [server/services/embeddingProvider.ts](./server/services/embeddingProvider.ts) - Embedding provider (pluggable)

---

## 💡 Next Steps

1. **✅ Complete:** Local Embedding Provider implemented
2. **Optional:** Switch to Vertex AI or OpenAI if needed (change `.env`)
3. **Short-term:** Test và optimize semantic search
4. **Long-term:** Add hybrid search (semantic + keyword), improve caching

---

**Status:** ✅ Implementation Complete (Local Embedding)  
**Default Provider:** Local (Free) - `all-MiniLM-L6-v2` (384 dimensions)  
**Alternative:** Vertex AI / OpenAI (Paid) - Switch via `.env`

