# 🤖 Desktop App - AI Requirements & Architecture

**Câu hỏi:** Desktop app local có cần API không?

**Trả lời:** Có, nhưng chỉ cho **AI Chat/Conversation**. Embedding có thể local hoàn toàn.

---

## 📊 Phân Tích Requirements

### ✅ Có Thể Local (Không Cần API)

| Component | Status | Technology |
|-----------|--------|------------|
| **Embedding** | ✅ Local | Sentence Transformers / @xenova/transformers |
| **Vector Search** | ✅ Local | PostgreSQL + pgvector |
| **Database** | ✅ Local | PostgreSQL / SQLite |
| **UI/UX** | ✅ Local | React (Electron) |
| **Backend Server** | ✅ Local | Express (embedded) |

### ⚠️ Vẫn Cần API (Cho AI Features)

| Component | Status | API Required |
|-----------|--------|--------------|
| **AI Chat** | ⚠️ Cần API | Gemini API / OpenAI API |
| **Text Generation** | ⚠️ Cần API | Gemini API / OpenAI API |
| **Content Analysis** | ⚠️ Cần API | Gemini API / OpenAI API |
| **Critique/Feedback** | ⚠️ Cần API | Gemini API / OpenAI API |

---

## 🎯 Kiến Trúc Hybrid (Local + API)

```
┌─────────────────────────────────────────┐
│      Desktop App (Electron)            │
│  ────────────────────────────────────  │
│  ✅ Local Components:                  │
│  ├─ Embedding (Sentence Transformers)  │
│  ├─ Vector Search (PostgreSQL)         │
│  ├─ Database (PostgreSQL/SQLite)        │
│  └─ UI/Backend (React/Express)         │
│  ────────────────────────────────────  │
│  ⚠️ API Components (Internet Required): │
│  ├─ AI Chat → Gemini API               │
│  ├─ Text Generation → Gemini API       │
│  └─ Content Analysis → Gemini API      │
└─────────────────────────────────────────┘
            ↓ (Internet)
┌─────────────────────────────────────────┐
│      Cloud APIs                         │
│  ├─ Google Gemini API                  │
│  └─ OpenAI API (optional)              │
└─────────────────────────────────────────┘
```

---

## 💡 Giải Pháp: Optional API Mode

### Mode 1: Full Online (Default)

**Features:**
- ✅ Full AI chat/conversation
- ✅ Text generation
- ✅ Content analysis
- ✅ Critique/feedback

**Requirements:**
- Internet connection
- Gemini API key (hoặc OpenAI API key)

**Config:**
```env
API_KEY=your_gemini_api_key
EMBEDDING_PROVIDER=local  # Embedding vẫn local
```

### Mode 2: Limited Offline

**Features:**
- ✅ Vector search (local)
- ✅ Document storage (local)
- ✅ Basic UI
- ❌ No AI chat
- ❌ No text generation
- ❌ No AI analysis

**Requirements:**
- No internet needed
- No API key needed

**Config:**
```env
API_KEY=
OFFLINE_MODE=true
EMBEDDING_PROVIDER=local
```

### Mode 3: Hybrid (Recommended)

**Features:**
- ✅ Vector search (local, no API)
- ✅ Document storage (local)
- ⚠️ AI chat (API, optional)
- ⚠️ Text generation (API, optional)

**Behavior:**
- Nếu có API key → Full features
- Nếu không có API key → Limited features (no AI chat)

---

## 🔧 Implementation: Graceful Degradation

### Update Gemini Service

**File:** `services/geminiService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.API_KEY 
  ? new GoogleGenerativeAI(process.env.API_KEY)
  : null;

export async function generateResponse(
  prompt: string,
  user: User | null,
  context?: string,
  documentContext?: DocumentContextForAI
): Promise<string> {
  // Check if API is available
  if (!genAI || !process.env.API_KEY) {
    return getOfflineResponse(prompt);
  }

  try {
    // Normal API call
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    // ... existing code
  } catch (error) {
    // Fallback to offline mode
    console.warn('API unavailable, using offline mode');
    return getOfflineResponse(prompt);
  }
}

/**
 * Offline fallback response
 */
function getOfflineResponse(prompt: string): string {
  // Check if it's a search query
  if (isSearchQuery(prompt)) {
    return 'Tôi có thể giúp bạn tìm kiếm trong tài liệu. Hãy sử dụng tính năng tìm kiếm ngữ nghĩa (semantic search) để tìm nội dung liên quan.';
  }

  // Generic offline message
  return `Hiện tại tôi đang ở chế độ offline. Một số tính năng AI cần kết nối internet và API key.

Tính năng vẫn hoạt động:
- ✅ Tìm kiếm ngữ nghĩa trong tài liệu
- ✅ Lưu trữ và quản lý tài liệu
- ✅ Xem và chỉnh sửa nội dung

Để sử dụng AI chat, vui lòng:
1. Thêm API_KEY vào cấu hình
2. Đảm bảo có kết nối internet
3. Khởi động lại ứng dụng`;
}

function isSearchQuery(prompt: string): boolean {
  const searchKeywords = ['tìm', 'search', 'tìm kiếm', 'where', 'find'];
  return searchKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
}
```

---

## 📝 Configuration Options

### Option 1: API Key Required (Strict)

```env
# .env
API_KEY=your_gemini_api_key  # Required
OFFLINE_MODE=false
```

**Behavior:** App yêu cầu API key để chạy.

### Option 2: API Key Optional (Flexible)

```env
# .env
API_KEY=  # Optional, empty = offline mode
OFFLINE_MODE=auto  # Auto-detect
```

**Behavior:** 
- Có API key → Full features
- Không có API key → Limited features (no AI chat)

### Option 3: Offline Only

```env
# .env
API_KEY=
OFFLINE_MODE=true
EMBEDDING_PROVIDER=local
```

**Behavior:** Hoàn toàn offline, không gọi API nào.

---

## 🎯 Recommended Setup cho Desktop App

### Default Configuration

```env
# Embedding: Local (free, no API)
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_API_URL=http://localhost:8000

# AI Chat: Optional (cần API key)
API_KEY=  # User có thể thêm sau
OFFLINE_MODE=auto

# Database: Local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bot_writing_advanced
```

### User Experience

1. **First Launch:**
   - App chạy được ngay (offline mode)
   - Hiển thị message: "Để sử dụng AI chat, thêm API key trong Settings"

2. **With API Key:**
   - User thêm API key trong Settings
   - App tự động enable AI features
   - Full functionality

3. **Without API Key:**
   - App vẫn hoạt động
   - Vector search hoạt động
   - Document management hoạt động
   - AI chat disabled (hiển thị message)

---

## 🔄 API Usage Summary

### Không Cần API (100% Local)

- ✅ **Embedding generation** → Sentence Transformers (local)
- ✅ **Vector search** → PostgreSQL + pgvector (local)
- ✅ **Document storage** → PostgreSQL (local)
- ✅ **UI/Backend** → Electron (local)

### Cần API (Internet Required)

- ⚠️ **AI Chat** → Gemini API / OpenAI API
- ⚠️ **Text Generation** → Gemini API / OpenAI API
- ⚠️ **Content Analysis** → Gemini API / OpenAI API
- ⚠️ **Critique/Feedback** → Gemini API / OpenAI API

---

## 💰 Cost Considerations

### Free Components (Local)

- Embedding: $0 (Sentence Transformers)
- Vector Search: $0 (PostgreSQL local)
- Database: $0 (PostgreSQL local)

### Paid Components (API)

- Gemini API: ~$0.00025 per 1K characters
- OpenAI API: ~$0.0001 per 1K tokens

**Estimate:** 
- Light usage: ~$1-5/month
- Heavy usage: ~$10-50/month

---

## ✅ Implementation Checklist

### Core Features (No API)

- [x] Embedding service (local)
- [x] Vector search (local)
- [x] Database (local)
- [x] Document management (local)

### AI Features (Need API)

- [ ] Graceful degradation khi không có API key
- [ ] Offline mode detection
- [ ] Settings UI để thêm API key
- [ ] Error handling cho API failures
- [ ] Fallback messages

---

## 🎯 Recommended Approach

**Hybrid Mode (Best UX):**

1. **Default:** App chạy offline (no API key required)
2. **Optional:** User có thể thêm API key để enable AI features
3. **Graceful:** App tự động detect và adjust features

**Benefits:**
- ✅ User có thể dùng app ngay (no setup)
- ✅ User có thể upgrade lên AI features (optional)
- ✅ App vẫn hữu ích ngay cả khi offline

---

## 📋 Summary

| Feature | Local? | API Required? |
|---------|--------|---------------|
| Embedding | ✅ Yes | ❌ No |
| Vector Search | ✅ Yes | ❌ No |
| Document Storage | ✅ Yes | ❌ No |
| AI Chat | ❌ No | ✅ Yes (Gemini/OpenAI) |
| Text Generation | ❌ No | ✅ Yes (Gemini/OpenAI) |
| Content Analysis | ❌ No | ✅ Yes (Gemini/OpenAI) |

**Kết luận:** 
- **Embedding & Search:** 100% local, không cần API ✅
- **AI Chat & Generation:** Cần API, nhưng có thể optional ⚠️

---

**Status:** Ready to implement  
**Priority:** HIGH  
**Estimated Time:** 2-3 hours

