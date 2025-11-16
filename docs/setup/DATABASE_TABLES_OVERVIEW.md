# Tổng Quan Các Bảng Trong Database

Project hiện có **12 bảng** trong database `bot_writing_advanced`:

## Core Tables (Bảng Chính)

### 1. `books`
- Lưu thông tin sách từ Google Docs
- Cột chính: `book_id`, `google_doc_id`, `title`, `author`, `total_word_count`, `total_chapters`

### 2. `users`
- Lưu thông tin người dùng (từ Google Sign-In)
- Cột chính: `user_id`, `email`, `name`, `avatar_url`

### 3. `book_contexts`
- Lưu context của sách (extracted từ AI)
- Cột chính: `book_id`, `summary`, `characters`, `world_setting`, `writing_style`, `story_arc`

### 4. `recent_chapters`
- Lưu nội dung chapters gần đây
- Cột chính: `chapter_id`, `book_id`, `chapter_number`, `title`, `content`, `summary`, `embedding_vector`

## Supporting Tables (Bảng Hỗ Trợ)

### 5. `chapter_chunks`
- Lưu chunks của chapters (cho embedding chi tiết)
- Cột chính: `chunk_id`, `chapter_id`, `chunk_index`, `chunk_text`, `chunk_embedding`

### 6. `workspaces`
- Lưu workspace của user
- Cột chính: `workspace_id`, `user_id`, `selected_book_id`, `selected_chapter_id`, `settings`

### 7. `workspace_chat_messages`
- Lưu chat messages trong workspace
- Cột chính: `message_id`, `workspace_id`, `message` (JSONB)

### 8. `workspace_canvas_pages`
- Lưu canvas pages trong workspace
- Cột chính: `page_id`, `workspace_id`, `page_data` (JSONB)

## Utility Tables (Bảng Tiện Ích)

### 9. `embedding_cache`
- Cache embeddings để tránh tính toán lại
- Cột chính: `content_hash` (PK), `embedding_vector`, `model_version`

### 10. `processing_status`
- Theo dõi trạng thái processing jobs
- Cột chính: `status_id`, `entity_type`, `entity_id`, `status`, `progress`

### 11. `data_flow_logs`
- Log luồng xử lý dữ liệu
- Cột chính: `log_id`, `entity_type`, `entity_id`, `stage`, `level`, `message`, `metadata`

## Archive Tables (Bảng Lưu Trữ)

### 12. `chapter_archive`
- Lưu trữ chapters cũ (khi bị archive)
- Cột chính: `archive_id`, `chapter_id`, `book_id`, `archived_at`, `archive_reason`

---

## Sơ Đồ Quan Hệ

```
users
  └── workspaces
        ├── workspace_chat_messages
        └── workspace_canvas_pages

books
  ├── book_contexts
  ├── recent_chapters
  │     ├── chapter_chunks
  │     └── chapter_archive (khi archive)
  └── workspaces (selected_book_id)

embedding_cache (standalone)
processing_status (standalone)
data_flow_logs (standalone)
```

## Tổng Kết

- **Core Data**: books, users, book_contexts, recent_chapters
- **Workspace**: workspaces, workspace_chat_messages, workspace_canvas_pages
- **Processing**: chapter_chunks, embedding_cache, processing_status, data_flow_logs
- **Archive**: chapter_archive

**Tổng cộng: 12 bảng**

