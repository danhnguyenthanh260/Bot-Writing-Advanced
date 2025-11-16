# Hướng Dẫn Xem Kết Quả Đã Xử Lý

Sau khi đưa dữ liệu từ Google Docs vào hệ thống, bạn có thể xem các kết quả đã được xử lý thông qua các API endpoints sau:

## 1. Xem Tất Cả Kết Quả Của Một Book

**Endpoint:** `GET /api/results/books/:book_id`

**Mô tả:** Lấy tất cả kết quả đã xử lý của một book bao gồm:
- Book context (summary, characters, world_setting, writing_style, story_arc)
- Tất cả chapters với metadata (summary, key_scenes, character_appearances, plot_points)
- Embeddings cho chapters và chunks
- Processing status

**Ví dụ:**
```bash
curl http://localhost:3001/api/results/books/{book_id}
```

**Response:**
```json
{
  "book": {
    "book_id": "...",
    "title": "...",
    "total_chapters": 10,
    "processing_status": {
      "status": "completed",
      "progress": 100
    }
  },
  "book_context": {
    "summary": "...",
    "characters": [...],
    "world_setting": {...},
    "writing_style": {...},
    "story_arc": {...}
  },
  "chapters": [
    {
      "chapter_id": "...",
      "chapter_number": 1,
      "title": "...",
      "summary": "...",
      "key_scenes": [...],
      "character_appearances": [...],
      "plot_points": {...},
      "has_embedding": true,
      "chunks": [...],
      "chunks_count": 5
    }
  ],
  "statistics": {
    "total_chapters": 10,
    "processed_chapters": 10,
    "chapters_with_embeddings": 10,
    "has_book_context": true,
    "processing_complete": true
  }
}
```

## 2. Xem Summary Ngắn Gọn

**Endpoint:** `GET /api/results/books/:book_id/summary`

**Mô tả:** Lấy summary ngắn gọn của kết quả xử lý (nhẹ hơn, phù hợp cho quick check)

**Ví dụ:**
```bash
curl http://localhost:3001/api/results/books/{book_id}/summary
```

**Response:**
```json
{
  "book": {
    "book_id": "...",
    "title": "...",
    "total_chapters": 10
  },
  "book_context": {
    "summary": "...",
    "extracted_at": "2024-01-01T00:00:00Z"
  },
  "chapters": [
    {
      "chapter_number": 1,
      "title": "...",
      "summary": "...",
      "is_processed": true,
      "has_embedding": true
    }
  ],
  "processing": {
    "status": "completed",
    "progress": 100
  }
}
```

## 3. Xem Kết Quả Của Một Chapter Cụ Thể

**Endpoint:** `GET /api/results/chapters/:chapter_id`

**Mô tả:** Lấy chi tiết kết quả đã xử lý của một chapter cụ thể

**Ví dụ:**
```bash
curl http://localhost:3001/api/results/chapters/{chapter_id}
```

**Response:**
```json
{
  "chapter": {
    "chapter_id": "...",
    "chapter_number": 1,
    "title": "...",
    "content": "...",
    "summary": "...",
    "key_scenes": [...],
    "character_appearances": [...],
    "plot_points": {...},
    "writing_notes": [...],
    "has_embedding": true,
    "embedding_version": "all-MiniLM-L6-v2"
  },
  "book": {
    "book_id": "...",
    "book_title": "..."
  },
  "chunks": [
    {
      "chunk_id": "...",
      "chunk_index": 0,
      "chunk_text": "...",
      "word_count": 500,
      "has_embedding": true
    }
  ],
  "processing": {
    "status": "completed",
    "progress": 100
  }
}
```

## 4. Kiểm Tra Processing Status

**Endpoint:** `GET /api/processing/books/:book_id/status`

**Mô tả:** Kiểm tra trạng thái xử lý của book và các chapters

**Ví dụ:**
```bash
curl http://localhost:3001/api/processing/books/{book_id}/status
```

**Response:**
```json
{
  "status": "processing",
  "book": {
    "status": "completed",
    "progress": 100
  },
  "chapters": [
    {
      "chapter_number": 1,
      "status": {
        "status": "completed",
        "progress": 100
      }
    }
  ],
  "progress": 75
}
```

## Quy Trình Sử Dụng

### Bước 1: Ingest Google Doc
```bash
POST /api/google-docs/ingest
{
  "url": "https://docs.google.com/document/d/...",
  "docId": "..."
}
```

Response sẽ trả về `book_id` và `processing` status:
```json
{
  "book_id": "...",
  "processing": {
    "book_job_id": "...",
    "chapter_job_ids": [...],
    "status": "processing"
  }
}
```

### Bước 2: Kiểm Tra Processing Status (Polling)
```bash
GET /api/processing/books/{book_id}/status
```

Lặp lại cho đến khi `status` là `"completed"` hoặc `"failed"`.

### Bước 3: Xem Kết Quả Đã Xử Lý
```bash
# Xem summary nhanh
GET /api/results/books/{book_id}/summary

# Hoặc xem đầy đủ
GET /api/results/books/{book_id}
```

## Các Trường Dữ Liệu Quan Trọng

### Book Context
- **summary**: Tóm tắt toàn bộ cuốn sách (500-1000 từ)
- **characters**: Danh sách nhân vật với role, description, relationships
- **world_setting**: Bối cảnh thế giới (locations, rules, timeline)
- **writing_style**: Phong cách viết (tone, POV, voice)
- **story_arc**: Cấu trúc cốt truyện (act1, act2, act3)

### Chapter Metadata
- **summary**: Tóm tắt chapter (~200 từ)
- **key_scenes**: Các cảnh quan trọng với description và significance
- **character_appearances**: Nhân vật xuất hiện với actions và dialogue
- **plot_points**: Điểm cốt truyện (events, conflicts, resolutions)
- **writing_notes**: Ghi chú về phong cách viết

### Embeddings
- **has_embedding**: Boolean cho biết chapter có embedding chưa
- **embedding_version**: Version của model embedding (ví dụ: "all-MiniLM-L6-v2")
- **chunks**: Các chunks của chapter với embeddings riêng

## Lưu Ý

1. **Processing là async**: Sau khi ingest, processing chạy background. Cần poll status để biết khi nào hoàn thành.

2. **Thời gian xử lý**: 
   - Book context: ~30-60 giây
   - Mỗi chapter: ~10-30 giây
   - Embeddings: ~5-15 giây/chapter

3. **Error handling**: Nếu processing failed, check `error` field trong status response.

4. **Cache**: Embeddings được cache theo content hash. Nếu content không đổi, sẽ không regenerate.

5. **Fallback**: Nếu AI extraction fails hoặc confidence thấp, hệ thống sẽ dùng fallback structure với confidence thấp hơn.

## Ví Dụ Frontend Integration

```typescript
// 1. Ingest document
const ingestResponse = await fetch('/api/google-docs/ingest', {
  method: 'POST',
  body: JSON.stringify({ url: googleDocUrl }),
});

const { book_id, processing } = await ingestResponse.json();

// 2. Poll status
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/processing/books/${book_id}/status`);
  const status = await statusResponse.json();
  
  if (status.status === 'completed') {
    // 3. Get results
    const resultsResponse = await fetch(`/api/results/books/${book_id}`);
    const results = await resultsResponse.json();
    
    console.log('Book context:', results.book_context);
    console.log('Chapters:', results.chapters);
    return results;
  } else if (status.status === 'failed') {
    throw new Error('Processing failed');
  } else {
    // Continue polling
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

