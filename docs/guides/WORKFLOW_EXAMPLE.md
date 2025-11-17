# 📖 Ví Dụ Trực Quan: Xử Lý Một Đoạn Truyện

**Mục đích:** Minh họa chi tiết quá trình xử lý khi user upload một Google Docs chứa truyện vào hệ thống.

---

## 📝 Input: Đoạn Truyện Mẫu

Giả sử user có một Google Docs với nội dung sau:

**URL:** `https://docs.google.com/document/d/abc123xyz456/edit`

**Nội dung Google Docs:**

```
# Chương 1: Khởi Đầu Cuộc Phiêu Lưu

Ngày hôm đó, bầu trời xanh thẳm không một gợn mây. Maria đứng trước cửa nhà, nhìn về phía chân trời xa xăm. Cô biết rằng cuộc hành trình sắp tới sẽ thay đổi cuộc đời mình mãi mãi.

"Tôi đã sẵn sàng," Maria tự nhủ, nắm chặt chiếc ba lô trên vai. Bên trong là những vật dụng cần thiết: một bản đồ cũ, một chiếc la bàn, và lá thư từ người bà quá cố.

Chiếc xe buýt đến đúng giờ. Maria bước lên, tìm một chỗ ngồi gần cửa sổ. Khi xe bắt đầu chuyển bánh, cô nhìn lại ngôi nhà thân yêu lần cuối. Có lẽ đây là lần cuối cùng cô nhìn thấy nó.

# Chương 2: Gặp Gỡ Bí Ẩn

Ba giờ sau, Maria xuống xe tại một thị trấn nhỏ ven biển. Không khí mặn mòi của biển cả hòa quyện với mùi hoa dại ven đường. Cô đi dọc theo con đường đá cuội, tìm kiếm địa chỉ được ghi trong lá thư.

Trước một ngôi nhà cổ kính, Maria dừng lại. Cánh cửa gỗ sồi được chạm khắc những hoa văn kỳ lạ. Cô gõ cửa ba lần, đúng như hướng dẫn trong thư.

Cánh cửa từ từ mở ra, và một người đàn ông cao lớn xuất hiện. Ông ta có đôi mắt xanh thẳm như biển cả, và nụ cười ấm áp.

"Chào mừng, Maria," ông ta nói. "Tôi đã đợi cô từ lâu."
```

**Thông tin:**
- **Title:** "Cuộc Phiêu Lưu Của Maria"
- **Word Count:** ~250 từ
- **Chapters:** 2 chương

---

## 🔄 Quá Trình Xử Lý Chi Tiết

### BƯỚC 1: User Upload (Frontend)

**Thời điểm:** T=0s

**User Action:**
```
1. User mở ứng dụng
2. Paste URL: https://docs.google.com/document/d/abc123xyz456/edit
3. Click nút "Phân tích"
```

**Frontend Code:**
```typescript
// components/UploadDocForm.tsx
const handleSubmit = async () => {
  setLoading(true);
  setStatus('Đang kết nối với Google Docs...');
  
  const response = await fetch('/api/google-docs/ingest', {
    method: 'POST',
    body: JSON.stringify({ 
      url: 'https://docs.google.com/document/d/abc123xyz456/edit' 
    }),
  });
  
  // ...
};
```

**UI State:**
- ✅ Loading spinner hiển thị
- ✅ Status: "Đang kết nối với Google Docs..."

---

### BƯỚC 2: Backend Nhận Request

**Thời điểm:** T=0.1s

**Backend Code:**
```typescript
// server/routes/googleDocs.ts
router.post('/ingest', async (req, res) => {
  const { url } = req.body; // 'https://docs.google.com/document/d/abc123xyz456/edit'
  
  // Extract document ID
  const docId = extractDocumentId(url); // 'abc123xyz456'
  
  // Load document từ Google Docs
  const structuredDoc = await googleDocsService.loadDocument(docId);
  // ...
});
```

**Log:**
```
[INFO] Starting Google Doc ingestion: abc123xyz456
```

---

### BƯỚC 3: Google Docs API Call

**Thời điểm:** T=0.2s - 1.5s

**Service Code:**
```typescript
// services/googleDocsService.ts
async loadDocument('abc123xyz456') {
  // 1. Setup authentication
  const auth = await this.getAuthClient(); // OAuth hoặc Service Account
  
  // 2. Call Google Docs API
  const docsApi = google.docs({ version: 'v1', auth });
  const document = await docsApi.documents.get({ 
    documentId: 'abc123xyz456' 
  });
  
  // 3. Parse structure
  const outline = this.buildOutline(document.body?.content ?? []);
  
  // 4. Return structured document
  return {
    docId: 'abc123xyz456',
    title: 'Cuộc Phiêu Lưu Của Maria',
    wordCount: 250,
    outline: [
      {
        heading: 'Chương 1: Khởi Đầu Cuộc Phiêu Lưu',
        level: 1,
        paragraphs: [
          'Ngày hôm đó, bầu trời xanh thẳm...',
          '"Tôi đã sẵn sàng," Maria tự nhủ...',
          'Chiếc xe buýt đến đúng giờ...'
        ]
      },
      {
        heading: 'Chương 2: Gặp Gỡ Bí Ẩn',
        level: 1,
        paragraphs: [
          'Ba giờ sau, Maria xuống xe...',
          'Trước một ngôi nhà cổ kính...',
          'Cánh cửa từ từ mở ra...'
        ]
      }
    ]
  };
}
```

**API Response từ Google:**
```json
{
  "title": "Cuộc Phiêu Lưu Của Maria",
  "body": {
    "content": [
      {
        "paragraph": {
          "elements": [
            { "textRun": { "content": "# Chương 1: Khởi Đầu Cuộc Phiêu Lưu\n" } }
          ],
          "paragraphStyle": { "namedStyleType": "HEADING_1" }
        }
      },
      {
        "paragraph": {
          "elements": [
            { "textRun": { "content": "Ngày hôm đó, bầu trời xanh thẳm..." } }
          ]
        }
      }
      // ... more paragraphs
    ]
  }
}
```

**Structured Output:**
```json
{
  "docId": "abc123xyz456",
  "title": "Cuộc Phiêu Lưu Của Maria",
  "wordCount": 250,
  "outline": [
    {
      "heading": "Chương 1: Khởi Đầu Cuộc Phiêu Lưu",
      "level": 1,
      "paragraphs": [
        "Ngày hôm đó, bầu trời xanh thẳm không một gợn mây...",
        "\"Tôi đã sẵn sàng,\" Maria tự nhủ...",
        "Chiếc xe buýt đến đúng giờ..."
      ]
    },
    {
      "heading": "Chương 2: Gặp Gỡ Bí Ẩn",
      "level": 1,
      "paragraphs": [
        "Ba giờ sau, Maria xuống xe tại một thị trấn nhỏ...",
        "Trước một ngôi nhà cổ kính, Maria dừng lại...",
        "Cánh cửa từ từ mở ra..."
      ]
    }
  ]
}
```

---

### BƯỚC 4: Lưu Vào Database (Raw Data)

**Thời điểm:** T=1.5s - 2.0s

**Database Operations:**

#### 4.1. Tạo Book Record

```sql
-- Insert vào bảng books
INSERT INTO books (
  book_id,
  google_doc_id,
  title,
  total_word_count,
  total_chapters,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- UUID generated
  'abc123xyz456',
  'Cuộc Phiêu Lưu Của Maria',
  250,
  2,
  '2024-11-16 10:30:00'
);
```

**Result trong Database:**
```
book_id: 550e8400-e29b-41d4-a716-446655440000
google_doc_id: abc123xyz456
title: Cuộc Phiêu Lưu Của Maria
total_word_count: 250
total_chapters: 2
created_at: 2024-11-16 10:30:00
```

#### 4.2. Tạo Chapter Records

**Chapter 1:**
```sql
INSERT INTO recent_chapters (
  chapter_id,
  book_id,
  chapter_number,
  title,
  content,
  content_hash,
  created_at
) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',  -- UUID
  '550e8400-e29b-41d4-a716-446655440000',  -- book_id
  1,
  'Chương 1: Khởi Đầu Cuộc Phiêu Lưu',
  'Ngày hôm đó, bầu trời xanh thẳm không một gợn mây. Maria đứng trước cửa nhà, nhìn về phía chân trời xa xăm. Cô biết rằng cuộc hành trình sắp tới sẽ thay đổi cuộc đời mình mãi mãi.

"Tôi đã sẵn sàng," Maria tự nhủ, nắm chặt chiếc ba lô trên vai. Bên trong là những vật dụng cần thiết: một bản đồ cũ, một chiếc la bàn, và lá thư từ người bà quá cố.

Chiếc xe buýt đến đúng giờ. Maria bước lên, tìm một chỗ ngồi gần cửa sổ. Khi xe bắt đầu chuyển bánh, cô nhìn lại ngôi nhà thân yêu lần cuối. Có lẽ đây là lần cuối cùng cô nhìn thấy nó.',
  'a1b2c3d4e5f6...',  -- SHA256 hash của content
  '2024-11-16 10:30:01'
);
```

**Chapter 2:**
```sql
INSERT INTO recent_chapters (
  chapter_id,
  book_id,
  chapter_number,
  title,
  content,
  content_hash,
  created_at
) VALUES (
  '770e8400-e29b-41d4-a716-446655440002',  -- UUID
  '550e8400-e29b-41d4-a716-446655440000',  -- book_id
  2,
  'Chương 2: Gặp Gỡ Bí Ẩn',
  'Ba giờ sau, Maria xuống xe tại một thị trấn nhỏ ven biển...',
  'b2c3d4e5f6a7...',  -- SHA256 hash
  '2024-11-16 10:30:02'
);
```

**Database State Sau Bước 4:**
```
books table:
┌─────────────────────────────────────┬───────────────┬──────────────────────────┬───────────────┬──────────────┐
│ book_id                              │ google_doc_id │ title                    │ word_count    │ chapters     │
├─────────────────────────────────────┼───────────────┼──────────────────────────┼───────────────┼──────────────┤
│ 550e8400-e29b-41d4-a716-446655440000│ abc123xyz456  │ Cuộc Phiêu Lưu Của Maria │ 250           │ 2            │
└─────────────────────────────────────┴───────────────┴──────────────────────────┴───────────────┴──────────────┘

recent_chapters table:
┌─────────────────────────────────────┬─────────────────────────────────────┬───────┬──────────────────────────┬──────────┐
│ chapter_id                          │ book_id                             │ num   │ title                    │ hash     │
├─────────────────────────────────────┼─────────────────────────────────────┼───────┼──────────────────────────┼──────────┤
│ 660e8400-e29b-41d4-a716-446655440001│ 550e8400-e29b-41d4-a716-446655440000│ 1     │ Chương 1: Khởi Đầu...   │ a1b2c3...│
│ 770e8400-e29b-41d4-a716-446655440002│ 550e8400-e29b-41d4-a716-446655440000│ 2     │ Chương 2: Gặp Gỡ Bí Ẩn   │ b2c3d4...│
└─────────────────────────────────────┴─────────────────────────────────────┴───────┴──────────────────────────┴──────────┘
```

**Lưu ý:** Ở bước này, chapters chỉ có **raw content**, chưa có:
- ❌ Summary
- ❌ Metadata (key_scenes, characters, etc.)
- ❌ Embeddings
- ❌ AI-extracted information

---

### BƯỚC 5: Queue Background Jobs

**Thời điểm:** T=2.0s - 2.1s

**Code:**
```typescript
// Queue book processing job
await queueBookProcessing({
  bookId: '550e8400-e29b-41d4-a716-446655440000',
  googleDocId: 'abc123xyz456',
  title: 'Cuộc Phiêu Lưu Của Maria',
  content: 'Ngày hôm đó, bầu trời xanh thẳm... [full text]',
});

// Queue chapter processing jobs
await queueChapterProcessing({
  chapterId: '660e8400-e29b-41d4-a716-446655440001',
  bookId: '550e8400-e29b-41d4-a716-446655440000',
  chapterNumber: 1,
  title: 'Chương 1: Khởi Đầu Cuộc Phiêu Lưu',
  content: 'Ngày hôm đó, bầu trời xanh thẳm...',
});

await queueChapterProcessing({
  chapterId: '770e8400-e29b-41d4-a716-446655440002',
  bookId: '550e8400-e29b-41d4-a716-446655440000',
  chapterNumber: 2,
  title: 'Chương 2: Gặp Gỡ Bí Ẩn',
  content: 'Ba giờ sau, Maria xuống xe...',
});
```

**Response cho Frontend:**
```json
{
  "success": true,
  "bookId": "550e8400-e29b-41d4-a716-446655440000",
  "workProfile": {
    "title": "Cuộc Phiêu Lưu Của Maria",
    "outline": [...],
    "wordCount": 250
  },
  "message": "Đang xử lý trong background..."
}
```

**UI Update:**
- ✅ Status: "Đã tải thành công! Đang xử lý..."
- ✅ Workspace được tạo với 3 pages: Draft, Critique, Final
- ✅ Loading indicator cho background processing

---

### BƯỚC 6: Background Processing - Book Context Extraction

**Thời điểm:** T=2.1s - 15s (async, background)

**Job:** `bookProcessingJob.ts`

#### 6.1. Update Status

```sql
INSERT INTO processing_status (
  entity_id,
  entity_type,
  status,
  progress,
  started_at
) VALUES (
  'abc123xyz456',
  'book',
  'processing',
  10,
  '2024-11-16 10:30:02'
);
```

#### 6.2. Call Gemini API để Extract Book Context

**Prompt gửi đến Gemini:**
```
Analyze this book and extract structured information in JSON format.

Book Title: Cuộc Phiêu Lưu Của Maria
Full Text: Ngày hôm đó, bầu trời xanh thẳm không một gợn mây. Maria đứng trước cửa nhà, nhìn về phía chân trời xa xăm. Cô biết rằng cuộc hành trình sắp tới sẽ thay đổi cuộc đời mình mãi mãi.

"Tôi đã sẵn sàng," Maria tự nhủ, nắm chặt chiếc ba lô trên vai. Bên trong là những vật dụng cần thiết: một bản đồ cũ, một chiếc la bàn, và lá thư từ người bà quá cố.

[... full text ...]

Extract:
1. summary: 500-1000 words
2. characters: Array with name, role, description, relationships
3. world_setting: locations, rules, timeline
4. writing_style: tone, pov, voice
5. story_arc: act1, act2, act3

Return ONLY valid JSON.
```

**Gemini Response (JSON):**
```json
{
  "summary": "Maria là một cô gái trẻ bắt đầu cuộc hành trình phiêu lưu sau khi nhận được lá thư từ người bà quá cố. Cô rời khỏi ngôi nhà thân yêu, lên xe buýt đến một thị trấn ven biển. Tại đó, cô gặp một người đàn ông bí ẩn với đôi mắt xanh như biển cả, người đã đợi cô từ lâu. Câu chuyện mở ra với không khí bí ẩn và hứa hẹn những cuộc phiêu lưu sắp tới.",
  "characters": [
    {
      "name": "Maria",
      "role": "main",
      "description": "Cô gái trẻ, quyết tâm, sẵn sàng cho cuộc phiêu lưu",
      "relationships": []
    },
    {
      "name": "Người đàn ông bí ẩn",
      "role": "supporting",
      "description": "Cao lớn, đôi mắt xanh thẳm như biển cả, nụ cười ấm áp",
      "relationships": ["Có liên hệ với bà của Maria"]
    }
  ],
  "world_setting": {
    "locations": [
      "Ngôi nhà của Maria",
      "Thị trấn ven biển",
      "Ngôi nhà cổ kính với cánh cửa gỗ sồi"
    ],
    "timeline": "Hiện tại, một ngày bình thường",
    "rules": []
  },
  "writing_style": {
    "tone": "Bí ẩn, hứa hẹn",
    "pov": "third",
    "voice": "Narrative, descriptive"
  },
  "story_arc": {
    "act1": "Maria rời khỏi nhà, bắt đầu hành trình",
    "act2": "Gặp gỡ người đàn ông bí ẩn",
    "act3": "Chưa rõ (câu chuyện mới bắt đầu)"
  }
}
```

#### 6.3. Save Book Context

```sql
INSERT INTO book_contexts (
  book_id,
  summary,
  characters,
  world_setting,
  writing_style,
  story_arc,
  extraction_model_version,
  confidence_score,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Maria là một cô gái trẻ bắt đầu cuộc hành trình...',
  '[
    {
      "name": "Maria",
      "role": "main",
      "description": "Cô gái trẻ, quyết tâm..."
    },
    {
      "name": "Người đàn ông bí ẩn",
      "role": "supporting",
      "description": "Cao lớn, đôi mắt xanh..."
    }
  ]'::jsonb,
  '{
    "locations": ["Ngôi nhà của Maria", "Thị trấn ven biển"],
    "timeline": "Hiện tại"
  }'::jsonb,
  '{
    "tone": "Bí ẩn, hứa hẹn",
    "pov": "third"
  }'::jsonb,
  '{
    "act1": "Maria rời khỏi nhà...",
    "act2": "Gặp gỡ người đàn ông bí ẩn"
  }'::jsonb,
  'gemini-2.0-flash-exp',
  0.85,
  '2024-11-16 10:30:15'
);
```

**Update Status:**
```sql
UPDATE processing_status
SET status = 'completed',
    progress = 100,
    completed_at = '2024-11-16 10:30:15'
WHERE entity_id = 'abc123xyz456' AND entity_type = 'book';
```

---

### BƯỚC 7: Background Processing - Chapter 1 Metadata Extraction

**Thời điểm:** T=2.2s - 12s (async, parallel với book processing)

**Job:** `chapterProcessingJob.ts`

#### 7.1. Change Detection

```typescript
// Check content hash
const existingHash = 'a1b2c3d4e5f6...';  // từ database
const newHash = calculateContentHash(chapter1Content); // 'a1b2c3d4e5f6...'

if (existingHash === newHash) {
  // Không có thay đổi, skip processing
  return { status: 'completed', cached: true };
}

// Có thay đổi hoặc chapter mới → Continue processing
```

#### 7.2. Extract Chapter Metadata

**Prompt gửi đến Gemini:**
```
Analyze this chapter and extract structured information.

Chapter: 1 - Chương 1: Khởi Đầu Cuộc Phiêu Lưu
Content: Ngày hôm đó, bầu trời xanh thẳm không một gợn mây. Maria đứng trước cửa nhà, nhìn về phía chân trời xa xăm. Cô biết rằng cuộc hành trình sắp tới sẽ thay đổi cuộc đời mình mãi mãi.

"Tôi đã sẵn sàng," Maria tự nhủ, nắm chặt chiếc ba lô trên vai. Bên trong là những vật dụng cần thiết: một bản đồ cũ, một chiếc la bàn, và lá thư từ người bà quá cố.

Chiếc xe buýt đến đúng giờ. Maria bước lên, tìm một chỗ ngồi gần cửa sổ. Khi xe bắt đầu chuyển bánh, cô nhìn lại ngôi nhà thân yêu lần cuối. Có lẽ đây là lần cuối cùng cô nhìn thấy nó.

Extract:
1. summary: ~200 words
2. key_scenes: important scenes with description, significance
3. character_appearances: characters with actions, dialogue
4. plot_points: events, conflicts, resolutions
5. writing_notes: notable patterns or suggestions

Return ONLY valid JSON.
```

**Gemini Response:**
```json
{
  "summary": "Chương mở đầu giới thiệu Maria, một cô gái trẻ chuẩn bị cho cuộc hành trình quan trọng. Trong một ngày đẹp trời, cô đứng trước cửa nhà, nhìn về chân trời với quyết tâm. Cô chuẩn bị hành lý với những vật dụng quan trọng: bản đồ, la bàn, và lá thư từ người bà. Khi xe buýt đến, Maria bước lên và nhìn lại ngôi nhà lần cuối, biết rằng đây có thể là lần cuối cùng.",
  "key_scenes": [
    {
      "description": "Maria đứng trước cửa nhà, nhìn về chân trời",
      "significance": "Mở đầu cuộc hành trình, thể hiện quyết tâm và sự chuẩn bị tinh thần"
    },
    {
      "description": "Maria chuẩn bị hành lý với bản đồ, la bàn, và lá thư",
      "significance": "Giới thiệu các vật dụng quan trọng sẽ được sử dụng sau này"
    },
    {
      "description": "Maria lên xe buýt và nhìn lại ngôi nhà lần cuối",
      "significance": "Khoảnh khắc chia tay, đánh dấu sự thay đổi lớn trong cuộc đời"
    }
  ],
  "character_appearances": [
    {
      "name": "Maria",
      "actions": [
        "Đứng trước cửa nhà",
        "Nhìn về chân trời",
        "Nắm chặt ba lô",
        "Bước lên xe buýt",
        "Nhìn lại ngôi nhà"
      ],
      "dialogue": ["\"Tôi đã sẵn sàng,\""],
      "emotions": ["Quyết tâm", "Có chút lo lắng", "Nostalgic"]
    }
  ],
  "plot_points": [
    {
      "event": "Maria quyết định bắt đầu cuộc hành trình",
      "conflict": "Sự chia tay với ngôi nhà thân yêu",
      "resolution": "Maria lên xe, bắt đầu hành trình"
    }
  ],
  "writing_notes": [
    "Sử dụng imagery tốt (bầu trời xanh, chân trời xa xăm)",
    "Tạo không khí bí ẩn và hứa hẹn",
    "Character development: Maria được giới thiệu là người quyết tâm"
  ]
}
```

#### 7.3. Update Chapter với Metadata

```sql
UPDATE recent_chapters
SET 
  summary = 'Chương mở đầu giới thiệu Maria...',
  key_scenes = '[
    {
      "description": "Maria đứng trước cửa nhà...",
      "significance": "Mở đầu cuộc hành trình..."
    }
  ]'::jsonb,
  character_appearances = '[
    {
      "name": "Maria",
      "actions": ["Đứng trước cửa nhà", "Nhìn về chân trời"],
      "dialogue": ["\"Tôi đã sẵn sàng,\""]
    }
  ]'::jsonb,
  plot_points = '[
    {
      "event": "Maria quyết định bắt đầu cuộc hành trình",
      "conflict": "Sự chia tay với ngôi nhà thân yêu"
    }
  ]'::jsonb,
  writing_notes = '[
    "Sử dụng imagery tốt",
    "Tạo không khí bí ẩn"
  ]'::jsonb,
  extraction_model_version = 'gemini-2.0-flash-exp',
  extraction_timestamp = '2024-11-16 10:30:12'
WHERE chapter_id = '660e8400-e29b-41d4-a716-446655440001';
```

---

### BƯỚC 8: Generate Embeddings

**Thời điểm:** T=12s - 18s (async)

#### 8.1. Generate Chapter Embedding

**Input:**
```
Chapter 1: Chương 1: Khởi Đầu Cuộc Phiêu Lưu

Ngày hôm đó, bầu trời xanh thẳm không một gợn mây. Maria đứng trước cửa nhà, nhìn về phía chân trời xa xăm. Cô biết rằng cuộc hành trình sắp tới sẽ thay đổi cuộc đời mình mãi mãi.

"Tôi đã sẵn sàng," Maria tự nhủ, nắm chặt chiếc ba lô trên vai. Bên trong là những vật dụng cần thiết: một bản đồ cũ, một chiếc la bàn, và lá thư từ người bà quá cố.

Chiếc xe buýt đến đúng giờ. Maria bước lên, tìm một chỗ ngồi gần cửa sổ. Khi xe bắt đầu chuyển bánh, cô nhìn lại ngôi nhà thân yêu lần cuối. Có lẽ đây là lần cuối cùng cô nhìn thấy nó.
```

**Vertex AI Embedding API Call:**
```typescript
const embedding = await generateEmbedding(chapterText);
// Returns: [0.123, -0.456, 0.789, ..., 0.234] (384 dimensions)
```

**Result:**
```
Chapter Embedding (384 dimensions):
[0.123, -0.456, 0.789, 0.234, ..., 0.567]
```

#### 8.2. Generate Chunk Embeddings

**Chunks được tạo:**
```
Chunk 1 (0-500 words):
"Ngày hôm đó, bầu trời xanh thẳm không một gợn mây. Maria đứng trước cửa nhà, nhìn về phía chân trời xa xăm. Cô biết rằng cuộc hành trình sắp tới sẽ thay đổi cuộc đời mình mãi mãi."

Chunk 2 (450-950 words, overlap 50):
"Maria đứng trước cửa nhà, nhìn về phía chân trời xa xăm. Cô biết rằng cuộc hành trình sắp tới sẽ thay đổi cuộc đời mình mãi mãi. \"Tôi đã sẵn sàng,\" Maria tự nhủ, nắm chặt chiếc ba lô trên vai."

Chunk 3 (900-1400 words):
"\"Tôi đã sẵn sàng,\" Maria tự nhủ, nắm chặt chiếc ba lô trên vai. Bên trong là những vật dụng cần thiết: một bản đồ cũ, một chiếc la bàn, và lá thư từ người bà quá cố."
```

**Embeddings:**
```
Chunk 1 Embedding: [0.234, -0.567, 0.890, ..., 0.123]
Chunk 2 Embedding: [0.345, -0.678, 0.901, ..., 0.234]
Chunk 3 Embedding: [0.456, -0.789, 0.012, ..., 0.345]
```

#### 8.3. Save Embeddings

```sql
-- Update chapter-level embedding
UPDATE recent_chapters
SET 
  embedding_vector = '[0.123, -0.456, 0.789, ...]'::vector,
  embedding_version = 'all-MiniLM-L6-v2',
  embedding_timestamp = '2024-11-16 10:30:18'
WHERE chapter_id = '660e8400-e29b-41d4-a716-446655440001';

-- Delete old chunks
DELETE FROM chapter_chunks 
WHERE chapter_id = '660e8400-e29b-41d4-a716-446655440001';

-- Insert new chunks
INSERT INTO chapter_chunks (
  chapter_id,
  chunk_index,
  chunk_text,
  chunk_embedding,
  word_count
) VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', 0, 'Ngày hôm đó, bầu trời...', '[0.234, -0.567, ...]'::vector, 45),
  ('660e8400-e29b-41d4-a716-446655440001', 1, 'Maria đứng trước cửa nhà...', '[0.345, -0.678, ...]'::vector, 52),
  ('660e8400-e29b-41d4-a716-446655440001', 2, '"Tôi đã sẵn sàng,"...', '[0.456, -0.789, ...]'::vector, 38);
```

**Tương tự cho Chapter 2** (parallel processing)

---

### BƯỚC 9: Final Database State

**Thời điểm:** T=20s (sau khi tất cả jobs hoàn thành)

**Database State:**

```
books table:
┌─────────────────────────────────────┬───────────────┬──────────────────────────┬───────────────┬──────────────┐
│ book_id                              │ google_doc_id │ title                    │ word_count    │ chapters     │
├─────────────────────────────────────┼───────────────┼──────────────────────────┼───────────────┼──────────────┤
│ 550e8400-e29b-41d4-a716-446655440000│ abc123xyz456  │ Cuộc Phiêu Lưu Của Maria │ 250           │ 2            │
└─────────────────────────────────────┴───────────────┴──────────────────────────┴───────────────┴──────────────┘

book_contexts table:
┌─────────────────────────────────────┬──────────────────────────────────────────────────────────┬──────────────┐
│ book_id                              │ summary                                                  │ confidence   │
├─────────────────────────────────────┼──────────────────────────────────────────────────────────┼──────────────┤
│ 550e8400-e29b-41d4-a716-446655440000│ Maria là một cô gái trẻ bắt đầu cuộc hành trình...      │ 0.85         │
└─────────────────────────────────────┴──────────────────────────────────────────────────────────┴──────────────┘
+ characters (JSONB): [{"name": "Maria", "role": "main", ...}, ...]
+ world_setting (JSONB): {"locations": [...], "timeline": "..."}
+ writing_style (JSONB): {"tone": "Bí ẩn", "pov": "third"}
+ story_arc (JSONB): {"act1": "...", "act2": "..."}

recent_chapters table:
┌─────────────────────────────────────┬───────┬──────────────────────────┬──────────┬──────────────────────────┐
│ chapter_id                          │ num   │ title                    │ hash     │ summary                  │
├─────────────────────────────────────┼───────┼──────────────────────────┼──────────┼──────────────────────────┤
│ 660e8400-e29b-41d4-a716-446655440001│ 1     │ Chương 1: Khởi Đầu...   │ a1b2c3...│ Chương mở đầu giới thiệu │
│ 770e8400-e29b-41d4-a716-446655440002│ 2     │ Chương 2: Gặp Gỡ Bí Ẩn   │ b2c3d4...│ Ba giờ sau, Maria...     │
└─────────────────────────────────────┴───────┴──────────────────────────┴──────────┴──────────────────────────┘
+ key_scenes (JSONB): [...]
+ character_appearances (JSONB): [...]
+ plot_points (JSONB): [...]
+ writing_notes (JSONB): [...]
+ embedding_vector (vector): [0.123, -0.456, ...] (384 dims)
+ embedding_version: 'all-MiniLM-L6-v2'

chapter_chunks table:
┌─────────────────────────────────────┬───────┬─────────────┬──────────────────────────────────────┐
│ chapter_id                          │ index │ text        │ embedding                            │
├─────────────────────────────────────┼───────┼─────────────┼──────────────────────────────────────┤
│ 660e8400-e29b-41d4-a716-446655440001│ 0     │ Ngày hôm đó │ [0.234, -0.567, ...] (384 dims)      │
│ 660e8400-e29b-41d4-a716-446655440001│ 1     │ Maria đứng  │ [0.345, -0.678, ...] (384 dims)      │
│ 660e8400-e29b-41d4-a716-446655440001│ 2     │ "Tôi đã...  │ [0.456, -0.789, ...] (384 dims)      │
│ 770e8400-e29b-41d4-a716-446655440002│ 0     │ Ba giờ sau  │ [0.567, -0.890, ...] (384 dims)      │
│ 770e8400-e29b-41d4-a716-446655440002│ 1     │ Trước một...│ [0.678, -0.901, ...] (384 dims)      │
└─────────────────────────────────────┴───────┴─────────────┴──────────────────────────────────────┘

processing_status table:
┌───────────────┬─────────────┬────────────┬───────────┬─────────────────────┐
│ entity_id     │ entity_type │ status     │ progress  │ completed_at        │
├───────────────┼─────────────┼────────────┼───────────┼─────────────────────┤
│ abc123xyz456  │ book        │ completed  │ 100       │ 2024-11-16 10:30:15 │
│ 660e8400-...  │ chapter     │ completed  │ 100       │ 2024-11-16 10:30:18 │
│ 770e8400-...  │ chapter     │ completed  │ 100       │ 2024-11-16 10:30:20 │
└───────────────┴─────────────┴────────────┴───────────┴─────────────────────┘
```

---

## 🎯 Kết Quả Cuối Cùng

### Dữ Liệu Đã Được Xử Lý

✅ **Book Level:**
- Summary toàn bộ câu chuyện
- Characters (Maria, Người đàn ông bí ẩn)
- World setting (locations, timeline)
- Writing style (tone, POV)
- Story arc (act1, act2)

✅ **Chapter Level (mỗi chapter):**
- Summary (~200 từ)
- Key scenes với significance
- Character appearances với actions, dialogue
- Plot points (events, conflicts)
- Writing notes

✅ **Embeddings:**
- Chapter-level embeddings (384 dimensions)
- Chunk-level embeddings (multiple chunks per chapter)
- Sẵn sàng cho semantic search

### Có Thể Làm Gì Với Dữ Liệu Này?

#### 1. Semantic Search

**User Query:** "Tìm đoạn nói về Maria chuẩn bị hành lý"

**System:**
```typescript
// 1. Generate query embedding
const queryEmbedding = await generateEmbedding("Maria chuẩn bị hành lý");

// 2. Search trong chapter_chunks
const results = await db.query(`
  SELECT 
    cc.chunk_text,
    rc.chapter_number,
    rc.title as chapter_title,
    1 - (cc.chunk_embedding <=> $1::vector) as similarity
  FROM chapter_chunks cc
  JOIN recent_chapters rc ON cc.chapter_id = rc.chapter_id
  WHERE rc.book_id = $2
    AND 1 - (cc.chunk_embedding <=> $1::vector) >= 0.7
  ORDER BY similarity DESC
  LIMIT 5
`, [queryEmbedding, bookId]);
```

**Results:**
```
1. Chapter 1, Chunk 2: "\"Tôi đã sẵn sàng,\" Maria tự nhủ, nắm chặt chiếc ba lô trên vai. Bên trong là những vật dụng cần thiết: một bản đồ cũ, một chiếc la bàn, và lá thư từ người bà quá cố."
   Similarity: 0.89

2. Chapter 1, Chunk 1: "Ngày hôm đó, bầu trời xanh thẳm... Maria đứng trước cửa nhà..."
   Similarity: 0.75
```

#### 2. AI Chat với Context

**User:** "Đánh giá chương 1 của tôi"

**System:**
```typescript
// 1. Get context
const context = await getContextForQuery(bookId, "Đánh giá chương 1");

// 2. Build prompt
const prompt = `
You are a professional writing assistant.

Book Context:
- Title: Cuộc Phiêu Lưu Của Maria
- Summary: Maria là một cô gái trẻ bắt đầu cuộc hành trình...
- Characters: Maria (main), Người đàn ông bí ẩn (supporting)

Chapter 1 Context:
- Title: Chương 1: Khởi Đầu Cuộc Phiêu Lưu
- Summary: Chương mở đầu giới thiệu Maria...
- Key Scenes: 
  * Maria đứng trước cửa nhà, nhìn về chân trời (Mở đầu cuộc hành trình)
  * Maria chuẩn bị hành lý (Giới thiệu vật dụng quan trọng)
  * Maria lên xe buýt (Khoảnh khắc chia tay)

User Query: Đánh giá chương 1 của tôi

Please provide specific, constructive feedback.
`;

// 3. Call Gemini API
const response = await geminiService.getAIResponse(prompt);
```

**AI Response:**
```
Chương 1 của bạn có những điểm mạnh:

✅ **Mở đầu ấn tượng:** Hình ảnh "bầu trời xanh thẳm không một gợn mây" tạo không khí tích cực và hứa hẹn.

✅ **Character development:** Maria được giới thiệu rõ ràng với quyết tâm và sự chuẩn bị tinh thần.

✅ **Foreshadowing tốt:** Việc giới thiệu các vật dụng (bản đồ, la bàn, lá thư) tạo sự tò mò về vai trò của chúng sau này.

**Gợi ý cải thiện:**

💡 **Thêm chi tiết cảm xúc:** Có thể mở rộng cảm xúc của Maria khi nhìn lại ngôi nhà lần cuối - cảm giác gì? Nostalgia? Lo lắng? Excitement?

💡 **Pacing:** Phần giữa chương có thể thêm một vài chi tiết về hành trình trên xe buýt để tạo không khí.

💡 **Dialogue:** Chỉ có một câu thoại của Maria. Có thể thêm internal monologue hoặc dialogue với người khác để làm sống động hơn.

**Tổng thể:** Chương mở đầu tốt, tạo được không khí bí ẩn và hứa hẹn. Cần phát triển thêm chi tiết cảm xúc và pacing.
```

---

## 📊 Timeline Tổng Quan

```
T=0s      │ User click "Phân tích"
          │
T=0.1s    │ Backend nhận request
          │
T=0.2s    │ Google Docs API call
          │
T=1.5s    │ ✅ Document loaded
          │ ✅ Parse structure
          │
T=2.0s    │ ✅ Save to database (raw)
          │ ✅ Queue background jobs
          │ ✅ Return response to frontend
          │
          │ [ASYNC BACKGROUND PROCESSING]
          │
T=2.1s    │ Book processing job started
T=2.2s    │ Chapter 1 processing started
T=2.3s    │ Chapter 2 processing started
          │
T=5s      │ Book: Extract context (Gemini API)
T=8s      │ Chapter 1: Extract metadata (Gemini API)
T=9s      │ Chapter 2: Extract metadata (Gemini API)
          │
T=10s     │ Book: Save context to database
T=11s     │ Chapter 1: Save metadata
T=12s     │ Chapter 2: Save metadata
          │
T=12s     │ Chapter 1: Generate embeddings
T=13s     │ Chapter 2: Generate embeddings
          │
T=18s     │ Chapter 1: Save embeddings
T=19s     │ Chapter 2: Save embeddings
          │
T=20s     │ ✅ All processing completed
```

---

## 🎉 Kết Luận

Sau khi upload Google Docs, hệ thống đã:

1. ✅ **Lấy dữ liệu** từ Google Docs API
2. ✅ **Lưu raw content** vào database
3. ✅ **Trích xuất metadata** với AI (summary, characters, scenes, etc.)
4. ✅ **Tạo embeddings** cho semantic search
5. ✅ **Sẵn sàng** cho các tính năng:
   - Semantic search
   - AI chat với context
   - Critique và feedback
   - Analysis và insights

**Tổng thời gian:** ~20 giây (bao gồm async processing)

**User Experience:**
- Frontend nhận response ngay sau 2 giây
- Background processing diễn ra không ảnh hưởng UX
- Status updates real-time cho user

---

**Xem thêm:**
- [SYSTEM_WORKFLOWS.md](./SYSTEM_WORKFLOWS.md) - Tài liệu tổng hợp các luồng hoạt động
- [GOOGLE_DOCS_TO_DB_FLOW.md](./GOOGLE_DOCS_TO_DB_FLOW.md) - Chi tiết Google Docs ingestion

