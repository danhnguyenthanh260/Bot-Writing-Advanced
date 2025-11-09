-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Core Tables
CREATE TABLE IF NOT EXISTS books (
  book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_doc_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  total_word_count INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_google_doc_id ON books(google_doc_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Storage 1: Book Context
CREATE TABLE IF NOT EXISTS book_contexts (
  book_id UUID PRIMARY KEY REFERENCES books(book_id) ON DELETE CASCADE,
  summary TEXT,
  characters JSONB,
  world_setting JSONB,
  writing_style JSONB,
  story_arc JSONB,
  metadata JSONB,
  extraction_model_version TEXT,
  extraction_timestamp TIMESTAMP,
  manual_override BOOLEAN DEFAULT FALSE,
  last_manual_edit TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_contexts_updated_at ON book_contexts(updated_at DESC);

-- Storage 2: Recent Chapters
CREATE TABLE IF NOT EXISTS recent_chapters (
  chapter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  key_scenes JSONB,
  character_appearances JSONB,
  plot_points JSONB,
  writing_notes JSONB,
  content_hash TEXT NOT NULL,
  embedding_vector vector(384),
  embedding_version TEXT,
  embedding_timestamp TIMESTAMP,
  extraction_model_version TEXT,
  extraction_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_recent_chapters_book_updated ON recent_chapters(book_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_chapters_book_embedding ON recent_chapters(book_id, embedding_vector);

-- Chunk-level embeddings
CREATE TABLE IF NOT EXISTS chapter_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES recent_chapters(chapter_id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_embedding vector(384),
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chapter_chunks_chapter ON chapter_chunks(chapter_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chapter_chunks_embedding ON chapter_chunks(chunk_embedding);

-- Storage 3: Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT,
  selected_book_id UUID REFERENCES books(book_id),
  selected_chapter_id UUID REFERENCES recent_chapters(chapter_id),
  settings JSONB,
  latest_chat_message_id UUID,
  active_canvas_pages UUID[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_access ON workspaces(user_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspaces_selected_book ON workspaces(selected_book_id);

CREATE TABLE IF NOT EXISTS workspace_chat_messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  message JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_chat_workspace_created ON workspace_chat_messages(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS workspace_canvas_pages (
  page_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  page_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_canvas_workspace_updated ON workspace_canvas_pages(workspace_id, updated_at DESC);

-- Utility Tables
CREATE TABLE IF NOT EXISTS embedding_cache (
  content_hash TEXT PRIMARY KEY,
  embedding_vector vector(384) NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_embedding_cache_model ON embedding_cache(model_version);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_accessed ON embedding_cache(last_accessed_at DESC);

CREATE TABLE IF NOT EXISTS processing_status (
  status_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'book' | 'chapter'
  entity_id UUID NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'processing' | 'completed' | 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_processing_status_entity ON processing_status(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_processing_status_status ON processing_status(status, started_at DESC);

-- Archive Tables
CREATE TABLE IF NOT EXISTS chapter_archive (
  archive_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  key_scenes JSONB,
  character_appearances JSONB,
  plot_points JSONB,
  writing_notes JSONB,
  content_hash TEXT,
  embedding_vector vector(384),
  embedding_version TEXT,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archive_reason TEXT -- 'window_overflow' | 'manual' | 'book_deleted'
);

CREATE INDEX IF NOT EXISTS idx_chapter_archive_book ON chapter_archive(book_id, archived_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_book_contexts_updated_at
  BEFORE UPDATE ON book_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recent_chapters_updated_at
  BEFORE UPDATE ON recent_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();






