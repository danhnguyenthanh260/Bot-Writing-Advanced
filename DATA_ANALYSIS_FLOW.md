# 🔍 Flow Phân Tích Dữ Liệu & Phản Hồi User

## ❓ Câu Hỏi: "Cái gì phân tích dữ liệu và phản hồi user?"

---

## 📊 Kiến Trúc Phân Tích & Phản Hồi

### Flow Hiện Tại (Với API)

```
User Query
    ↓
[Frontend: App.tsx]
    ↓
[Lấy Context từ Database (Local)]
    ├─ Book context (summary, characters, style)
    ├─ Recent chapters
    └─ Semantic search results (vector search)
    ↓
[Xây dựng Prompt với Context]
    ↓
[Gemini API] ← 🎯 ĐÂY LÀ PHẦN PHÂN TÍCH & PHẢN HỒI
    ├─ Phân tích context
    ├─ Hiểu user query
    ├─ Tạo phản hồi thông minh
    └─ Trả về response
    ↓
[Frontend hiển thị response]
```

---

## 🧩 Các Thành Phần

### 1. **Gemini API** - Phân Tích & Phản Hồi Chính

**File:** `services/geminiService.ts`

**Chức năng:**
- ✅ Phân tích user query
- ✅ Phân tích document context
- ✅ Hiểu ý nghĩa và ngữ cảnh
- ✅ Tạo phản hồi thông minh, có ngữ cảnh
- ✅ Đưa ra gợi ý, critique, feedback

**Ví dụ:**
```
User: "Đánh giá chương 5 của tôi"
    ↓
Gemini API nhận:
- Context: Chương 5 content, summary, key scenes
- Query: "Đánh giá chương 5"
    ↓
Gemini phân tích:
- Điểm mạnh: ...
- Điểm cần cải thiện: ...
- Gợi ý: ...
    ↓
Response: "Chương 5 của bạn có những điểm mạnh... Tuy nhiên..."
```

### 2. **Semantic Search** - Tìm Kiếm (Local, Không Phân Tích)

**File:** `server/services/semanticSearchService.ts`

**Chức năng:**
- ✅ Tìm các đoạn văn liên quan (vector search)
- ✅ Trả về kết quả tìm kiếm
- ❌ KHÔNG phân tích ý nghĩa
- ❌ KHÔNG tạo phản hồi

**Ví dụ:**
```
User: "Tìm đoạn nói về nhân vật A"
    ↓
Semantic Search:
- Tìm trong database (vector similarity)
- Trả về: "Chapter 3, line 45-60: 'Nhân vật A xuất hiện...'"
    ↓
Chỉ là kết quả tìm kiếm, không có phân tích
```

### 3. **Context Retrieval** - Lấy Dữ Liệu (Local)

**File:** `server/services/contextRetrievalService.ts`

**Chức năng:**
- ✅ Lấy book context từ database
- ✅ Lấy recent chapters
- ✅ Gọi semantic search
- ❌ KHÔNG phân tích
- ❌ KHÔNG phản hồi

**Ví dụ:**
```
getContextForQuery(bookId, query)
    ↓
Trả về:
- book_context: { summary, characters, ... }
- recent_chapters: [...]
- semantic_results: [...]
```

### 4. **Prompt Construction** - Xây Dựng Prompt (Local)

**File:** `server/services/promptConstructionService.ts`

**Chức năng:**
- ✅ Kết hợp context + user query
- ✅ Tạo prompt cho AI
- ❌ KHÔNG phân tích
- ❌ KHÔNG phản hồi

---

## 🎯 Tóm Tắt: Ai Làm Gì?

| Component | Chức Năng | Local? | API? |
|-----------|-----------|--------|------|
| **Gemini API** | 🧠 Phân tích & Phản hồi | ❌ | ✅ Required |
| **Semantic Search** | 🔍 Tìm kiếm (không phân tích) | ✅ | ❌ |
| **Context Retrieval** | 📚 Lấy dữ liệu | ✅ | ❌ |
| **Prompt Construction** | 📝 Xây dựng prompt | ✅ | ❌ |

---

## ⚠️ Vấn Đề: Nếu Không Có API?

### Scenario 1: Có API (Gemini)

```
User: "Đánh giá chương 5"
    ↓
[Context Retrieval] → Lấy chương 5 từ DB
    ↓
[Prompt Construction] → Tạo prompt với context
    ↓
[Gemini API] → 🧠 PHÂN TÍCH & PHẢN HỒI
    ↓
Response: "Chương 5 có điểm mạnh... Gợi ý..."
```

### Scenario 2: Không Có API (Offline)

```
User: "Đánh giá chương 5"
    ↓
[Context Retrieval] → Lấy chương 5 từ DB
    ↓
[Semantic Search] → Tìm các đoạn liên quan
    ↓
[Offline Response] → ❌ KHÔNG CÓ PHÂN TÍCH
    ↓
Response: "Hiện tại tôi đang offline. Bạn có thể tìm kiếm trong tài liệu..."
```

**Vấn đề:** Không có AI để phân tích và phản hồi thông minh!

---

## 💡 Giải Pháp: Hybrid Approach

### Option 1: Rule-Based Analysis (Local, Limited)

Tạo một số rules đơn giản để phân tích cơ bản:

```typescript
function analyzeChapterOffline(chapter: ChapterContext): string {
  const wordCount = chapter.content.split(/\s+/).length;
  const sentences = chapter.content.split(/[.!?]+/).length;
  const avgSentenceLength = wordCount / sentences;
  
  let feedback = `Chương ${chapter.chapter_number}:\n`;
  feedback += `- Độ dài: ${wordCount} từ\n`;
  
  if (avgSentenceLength > 25) {
    feedback += `- Gợi ý: Câu văn hơi dài, nên chia nhỏ\n`;
  }
  
  if (wordCount < 500) {
    feedback += `- Gợi ý: Chương khá ngắn, nên mở rộng thêm\n`;
  }
  
  return feedback;
}
```

**Hạn chế:** Chỉ phân tích cơ bản, không thông minh như AI.

### Option 2: Local LLM (Ollama, LM Studio)

Chạy LLM local trên máy:

```typescript
// Use Ollama local API
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama2',
    prompt: constructedPrompt,
  }),
});
```

**Ưu điểm:**
- ✅ Hoàn toàn local
- ✅ Không cần internet
- ✅ Không tốn phí

**Nhược điểm:**
- ⚠️ Cần model lớn (vài GB)
- ⚠️ Cần GPU để chạy nhanh
- ⚠️ Chất lượng thấp hơn Gemini/OpenAI

### Option 3: Hybrid (Recommended)

**Kết hợp:**
- **Semantic Search:** Local (đã có)
- **Basic Analysis:** Rule-based (local)
- **Advanced Analysis:** Gemini API (optional)

```typescript
async function analyzeWithFallback(chapter: ChapterContext) {
  // Try API first
  if (hasAPIKey()) {
    return await analyzeWithGemini(chapter);
  }
  
  // Fallback to local analysis
  return analyzeChapterOffline(chapter);
}
```

---

## 📋 Flow Chi Tiết

### Full Flow (Với API)

```
1. User Query
   "Đánh giá chương 5"
    ↓
2. Frontend (App.tsx)
   - Lấy activeProfile
   - Tạo documentContext
    ↓
3. Context Retrieval (Local)
   - getBookLevelContext()
   - getChapterLevelContext()
   - semanticSearch() → Tìm liên quan
    ↓
4. Prompt Construction (Local)
   - Kết hợp context + query
   - Tạo prompt đầy đủ
    ↓
5. Gemini API ← 🎯 PHÂN TÍCH & PHẢN HỒI
   - Nhận prompt với context
   - Phân tích document
   - Hiểu user intent
   - Tạo response thông minh
    ↓
6. Response Processing
   - Parse actions
   - Update UI
   - Hiển thị response
```

### Limited Flow (Không Có API)

```
1. User Query
   "Đánh giá chương 5"
    ↓
2. Frontend (App.tsx)
   - Lấy activeProfile
   - Tạo documentContext
    ↓
3. Context Retrieval (Local)
   - getChapterLevelContext() → Lấy chương 5
   - semanticSearch() → Tìm liên quan
    ↓
4. Offline Analysis (Local, Rule-based)
   - Phân tích cơ bản (word count, sentence length)
   - Tạo feedback đơn giản
    ↓
5. Response
   - Hiển thị kết quả tìm kiếm
   - Hiển thị phân tích cơ bản
   - Message: "Để phân tích chi tiết, cần API key"
```

---

## 🎯 Kết Luận

### Phần Phân Tích & Phản Hồi Chính:

**🧠 Gemini API** (hoặc OpenAI API)
- Phân tích document context
- Hiểu user query
- Tạo phản hồi thông minh
- Đưa ra gợi ý, critique, feedback

### Phần Hỗ Trợ (Local):

**🔍 Semantic Search**
- Tìm kiếm trong tài liệu
- Trả về kết quả liên quan
- KHÔNG phân tích, chỉ tìm

**📚 Context Retrieval**
- Lấy dữ liệu từ database
- Chuẩn bị context cho AI
- KHÔNG phân tích

---

## 💡 Recommendation

**Cho Desktop App:**

1. **Default:** Offline mode với rule-based analysis cơ bản
2. **Optional:** User thêm API key → Full AI analysis
3. **Hybrid:** Kết hợp local search + basic analysis + optional AI

**Code Pattern:**
```typescript
if (hasAPIKey()) {
  // Full AI analysis
  return await analyzeWithGemini(context);
} else {
  // Basic local analysis + search results
  return {
    searchResults: await semanticSearch(query),
    basicAnalysis: analyzeOffline(context),
    message: "Để phân tích chi tiết, thêm API key"
  };
}
```

---

**Tóm lại:** 
- **Gemini API** là phần phân tích & phản hồi chính
- **Semantic Search** chỉ tìm kiếm, không phân tích
- **Nếu không có API:** Chỉ có search results + basic analysis, không có AI thông minh

