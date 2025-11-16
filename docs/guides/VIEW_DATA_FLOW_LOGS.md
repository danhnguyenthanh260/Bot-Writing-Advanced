# Hướng Dẫn Xem Log Luồng Dữ Liệu

Hệ thống logging đã được tích hợp để theo dõi toàn bộ luồng xử lý dữ liệu từ Google Docs đến database.

## Các Endpoint Xem Logs

### 1. Xem Logs Của Một Book (Bao Gồm Tất Cả Chapters)

**Endpoint:** `GET /api/logs/books/:book_id`

**Mô tả:** Lấy tất cả logs của một book và các chapters của nó

**Query Parameters:**
- `stage`: Lọc theo stage (ingest, extraction, embedding, storage, validation, cache)
- `level`: Lọc theo level (info, warn, error, debug)
- `limit`: Số lượng logs tối đa (default: 100)
- `offset`: Offset cho pagination (default: 0)

**Ví dụ:**
```bash
# Xem tất cả logs
curl http://localhost:3001/api/logs/books/{book_id}

# Chỉ xem logs lỗi
curl http://localhost:3001/api/logs/books/{book_id}?level=error

# Xem logs extraction
curl http://localhost:3001/api/logs/books/{book_id}?stage=extraction

# Xem logs với pagination
curl http://localhost:3001/api/logs/books/{book_id}?limit=50&offset=0
```

**Response:**
```json
{
  "book_id": "...",
  "logs": [
    {
      "log_id": "...",
      "entity_type": "book",
      "entity_id": "...",
      "stage": "ingest",
      "level": "info",
      "message": "Starting Google Doc ingestion: ...",
      "metadata": {
        "wordCount": 5000,
        "sections": 10
      },
      "duration_ms": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "log_id": "...",
      "entity_type": "book",
      "entity_id": "...",
      "stage": "extraction",
      "level": "info",
      "message": "Book context extraction completed",
      "metadata": {
        "title": "...",
        "wordCount": 5000,
        "confidence": 0.85
      },
      "duration_ms": 45000,
      "created_at": "2024-01-01T00:00:30Z"
    }
  ],
  "statistics": {
    "totalLogs": 25,
    "byStage": {
      "ingest": 5,
      "extraction": 3,
      "embedding": 10,
      "storage": 7
    },
    "byLevel": {
      "info": 20,
      "warn": 3,
      "error": 2
    },
    "averageDuration": 3500,
    "errorCount": 2
  },
  "total": 25
}
```

### 2. Xem Logs Của Một Chapter

**Endpoint:** `GET /api/logs/chapters/:chapter_id`

**Ví dụ:**
```bash
curl http://localhost:3001/api/logs/chapters/{chapter_id}
```

### 3. Xem System Logs

**Endpoint:** `GET /api/logs/system`

**Ví dụ:**
```bash
curl http://localhost:3001/api/logs/system
```

### 4. Xem Flow Logs Theo Timeline

**Endpoint:** `GET /api/logs/flow/:book_id`

**Mô tả:** Lấy logs theo timeline và nhóm theo stage để dễ visualize

**Ví dụ:**
```bash
curl http://localhost:3001/api/logs/flow/{book_id}
```

**Response:**
```json
{
  "book_id": "...",
  "timeline": [
    // Logs theo thứ tự thời gian
  ],
  "by_stage": {
    "ingest": [...],
    "extraction": [...],
    "embedding": [...],
    "storage": [...]
  },
  "statistics": {...}
}
```

### 5. Cleanup Old Logs

**Endpoint:** `DELETE /api/logs/cleanup`

**Query Parameters:**
- `days`: Xóa logs cũ hơn bao nhiêu ngày (default: 30)

**Ví dụ:**
```bash
curl -X DELETE http://localhost:3001/api/logs/cleanup?days=30
```

## Các Stage Trong Luồng Dữ Liệu

### 1. INGEST
- Bắt đầu ingestion từ Google Docs
- Load document từ API
- Queue processing jobs

### 2. EXTRACTION
- Extract book context (summary, characters, etc.)
- Extract chapter metadata (summary, key_scenes, etc.)
- AI processing với Gemini

### 3. EMBEDDING
- Generate embeddings cho chapters
- Generate embeddings cho chunks
- Save embeddings vào database

### 4. STORAGE
- Lưu book vào database
- Lưu chapters vào database
- Lưu book context
- Lưu embeddings

### 5. VALIDATION
- Kiểm tra content changes
- Validate data integrity
- Check confidence scores

### 6. CACHE
- Cache invalidation
- Cache hits/misses
- Cache cleanup

## Log Levels

- **INFO**: Thông tin bình thường về quá trình xử lý
- **WARN**: Cảnh báo (ví dụ: low confidence, fallback được sử dụng)
- **ERROR**: Lỗi trong quá trình xử lý
- **DEBUG**: Thông tin debug chi tiết

## Metadata Trong Logs

Mỗi log entry có thể chứa metadata hữu ích:

```json
{
  "metadata": {
    "wordCount": 5000,
    "sections": 10,
    "confidence": 0.85,
    "hasErrors": false,
    "hasWarnings": true,
    "chunkCount": 5,
    "jobId": "...",
    "chapterNumber": 1,
    "title": "..."
  }
}
```

## Duration Tracking

Logs có thể track thời gian xử lý:

```json
{
  "message": "Book context extraction completed",
  "duration_ms": 45000,
  "metadata": {
    "success": true
  }
}
```

## Ví Dụ Sử Dụng

### Theo Dõi Quá Trình Ingest

```typescript
// 1. Ingest document
const ingestResponse = await fetch('/api/google-docs/ingest', {
  method: 'POST',
  body: JSON.stringify({ url: googleDocUrl }),
});

const { book_id } = await ingestResponse.json();

// 2. Poll logs để xem progress
const checkLogs = async () => {
  const logsResponse = await fetch(`/api/logs/books/${book_id}?stage=ingest`);
  const { logs, statistics } = await logsResponse.json();
  
  console.log('Ingest logs:', logs);
  console.log('Statistics:', statistics);
  
  // Check for errors
  const errors = logs.filter(log => log.level === 'error');
  if (errors.length > 0) {
    console.error('Errors found:', errors);
  }
};

checkLogs();
```

### Theo Dõi Extraction Progress

```typescript
const extractionLogs = await fetch(
  `/api/logs/books/${book_id}?stage=extraction`
);
const { logs } = await extractionLogs.json();

// Xem confidence scores
const extractionResults = logs.filter(
  log => log.message.includes('extracted with confidence')
);

extractionResults.forEach(log => {
  console.log(`Confidence: ${log.metadata.confidence}`);
  console.log(`Duration: ${log.duration_ms}ms`);
});
```

### Xem Timeline Đầy Đủ

```typescript
const flowResponse = await fetch(`/api/logs/flow/${book_id}`);
const { timeline, by_stage, statistics } = await flowResponse.json();

// Timeline theo thứ tự thời gian
timeline.forEach(log => {
  console.log(`${log.created_at}: [${log.stage}] ${log.message}`);
});

// Nhóm theo stage
Object.entries(by_stage).forEach(([stage, logs]) => {
  console.log(`${stage}: ${logs.length} logs`);
});
```

## Best Practices

1. **Monitor Errors**: Thường xuyên check logs với `level=error`
2. **Track Performance**: Xem `duration_ms` để identify bottlenecks
3. **Cleanup**: Chạy cleanup định kỳ để tránh database quá lớn
4. **Filtering**: Sử dụng `stage` và `level` filters để focus vào vấn đề cụ thể

## Database Schema

Logs được lưu trong bảng `data_flow_logs`:

```sql
CREATE TABLE data_flow_logs (
  log_id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'book' | 'chapter' | 'chunk' | 'system'
  entity_id UUID,
  stage TEXT NOT NULL, -- 'ingest' | 'extraction' | 'embedding' | ...
  level TEXT NOT NULL, -- 'info' | 'warn' | 'error' | 'debug'
  message TEXT NOT NULL,
  metadata JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Tự Động Logging

Hệ thống tự động log các sự kiện quan trọng:

- ✅ Document loaded từ Google Docs
- ✅ Book/chapter created/updated
- ✅ Extraction started/completed với confidence
- ✅ Embedding generation với chunk count
- ✅ Storage operations với timing
- ✅ Cache invalidation
- ✅ Content change detection
- ✅ Errors và warnings

Tất cả logs được lưu vào database và có thể query qua API.

