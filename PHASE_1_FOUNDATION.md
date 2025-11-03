# Phase 1: Foundation
**Priority:** CRITICAL  
**Timeline:** Week 1-2  
**Status:** Ready to Start

---

## 📋 Overview

Phase 1 thiết lập foundation cho toàn bộ storage system:
- Database setup với PostgreSQL + pgvector
- Core database schema
- Basic utilities (hash, cache, change detection)
- Database connection & models

---

## ✅ Implementation Checklist

### Week 1: Database Setup

#### Day 1-2: Database Installation & Configuration
- [ ] Install PostgreSQL (version 15+)
- [ ] Install pgvector extension
- [ ] Create database và user
- [ ] Setup connection pooling
- [ ] Configure environment variables

#### Day 3-4: Core Schema Creation
- [ ] Create core tables (books, users)
- [ ] Create Storage 1 schema (book_contexts)
- [ ] Create Storage 2 schema (recent_chapters, chapter_chunks)
- [ ] Create Storage 3 schema (workspaces, workspace_chat_messages, workspace_canvas_pages)
- [ ] Create utility tables (embedding_cache, processing_status)
- [ ] Create archive tables (chapter_archive)

#### Day 5: Indexes & Constraints
- [ ] Add primary keys & foreign keys
- [ ] Add indexes for frequent queries
- [ ] Add unique constraints
- [ ] Add check constraints
- [ ] Add triggers for updated_at

### Week 2: Basic Services

#### Day 6-7: Utility Services
- [ ] Content hash utility (SHA256)
- [ ] Embedding cache service
- [ ] Change detection service
- [ ] Database connection service

#### Day 8-9: Basic CRUD Operations
- [ ] Book CRUD operations
- [ ] User CRUD operations
- [ ] Workspace CRUD operations
- [ ] Basic validation

#### Day 10: Testing & Documentation
- [ ] Unit tests cho utilities
- [ ] Integration tests cho CRUD
- [ ] Schema documentation
- [ ] API documentation (basic)

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Books table (core)
CREATE TABLE books (
  book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_doc_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  total_word_count INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_books_google_doc_id (google_doc_id),
  INDEX idx_books_created_at (created_at DESC)
);

-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);

-- Storage 1: Book Context
CREATE TABLE book_contexts (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_book_contexts_updated_at (updated_at DESC)
);

-- Storage 2: Recent Chapters
CREATE TABLE recent_chapters (
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
  embedding_vector vector(768),
  embedding_version TEXT,
  embedding_timestamp TIMESTAMP,
  extraction_model_version TEXT,
  extraction_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, chapter_number),
  INDEX idx_recent_chapters_book_updated (book_id, updated_at DESC),
  INDEX idx_recent_chapters_book_embedding (book_id, embedding_vector)
);

-- Chunk-level embeddings
CREATE TABLE chapter_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES recent_chapters(chapter_id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_embedding vector(768),
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, chunk_index),
  INDEX idx_chapter_chunks_chapter (chapter_id, chunk_index),
  INDEX idx_chapter_chunks_embedding (chunk_embedding)
);

-- Storage 3: Workspaces
CREATE TABLE workspaces (
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
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_workspaces_user_access (user_id, last_accessed_at DESC),
  INDEX idx_workspaces_selected_book (selected_book_id)
);

CREATE TABLE workspace_chat_messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  message JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_workspace_chat_workspace_created (workspace_id, created_at DESC)
);

CREATE TABLE workspace_canvas_pages (
  page_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  page_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_workspace_canvas_workspace_updated (workspace_id, updated_at DESC)
);

-- Utility Tables
CREATE TABLE embedding_cache (
  content_hash TEXT PRIMARY KEY,
  embedding_vector vector(768) NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_embedding_cache_model (model_version),
  INDEX idx_embedding_cache_accessed (last_accessed_at DESC)
);

CREATE TABLE processing_status (
  status_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'book' | 'chapter'
  entity_id UUID NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'processing' | 'completed' | 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT,
  INDEX idx_processing_status_entity (entity_type, entity_id),
  INDEX idx_processing_status_status (status, started_at DESC)
);

-- Archive Tables
CREATE TABLE chapter_archive (
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
  embedding_vector vector(768),
  embedding_version TEXT,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archive_reason TEXT, -- 'window_overflow' | 'manual' | 'book_deleted'
  INDEX idx_chapter_archive_book (book_id, archived_at DESC)
);
```

### Triggers & Functions

```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
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
```

---

## 💻 Service Implementations

### 1. Content Hash Utility

**File:** `server/utils/contentHash.ts`

```typescript
import crypto from 'crypto';

/**
 * Calculate SHA256 hash of content
 * Used for change detection and caching
 */
export function calculateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Compare two content hashes
 */
export function compareContentHash(
  hash1: string,
  hash2: string
): boolean {
  return hash1 === hash2;
}
```

**Tests:**
```typescript
describe('Content Hash Utility', () => {
  it('should generate consistent hash', () => {
    const content = 'test content';
    const hash1 = calculateContentHash(content);
    const hash2 = calculateContentHash(content);
    expect(hash1).toBe(hash2);
  });
  
  it('should generate different hash for different content', () => {
    const hash1 = calculateContentHash('content 1');
    const hash2 = calculateContentHash('content 2');
    expect(hash1).not.toBe(hash2);
  });
});
```

---

### 2. Embedding Cache Service

**File:** `server/services/embeddingCacheService.ts`

```typescript
import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';

const CURRENT_EMBEDDING_MODEL = 'text-embedding-004';

interface CachedEmbedding {
  content_hash: string;
  embedding_vector: number[];
  model_version: string;
  created_at: Date;
  last_accessed_at: Date;
}

/**
 * Get cached embedding if exists
 */
export async function getCachedEmbedding(
  contentHash: string,
  modelVersion: string = CURRENT_EMBEDDING_MODEL
): Promise<number[] | null> {
  const cached = await db.query(
    `SELECT embedding_vector 
     FROM embedding_cache 
     WHERE content_hash = $1 AND model_version = $2`,
    [contentHash, modelVersion]
  );
  
  if (cached.rows.length === 0) {
    return null;
  }
  
  // Update last_accessed_at
  await db.query(
    `UPDATE embedding_cache 
     SET last_accessed_at = CURRENT_TIMESTAMP 
     WHERE content_hash = $1`,
    [contentHash]
  );
  
  return cached.rows[0].embedding_vector;
}

/**
 * Cache embedding
 */
export async function cacheEmbedding(
  contentHash: string,
  embedding: number[],
  modelVersion: string = CURRENT_EMBEDDING_MODEL
): Promise<void> {
  await db.query(
    `INSERT INTO embedding_cache 
     (content_hash, embedding_vector, model_version, last_accessed_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (content_hash) 
     DO UPDATE SET 
       embedding_vector = EXCLUDED.embedding_vector,
       model_version = EXCLUDED.model_version,
       last_accessed_at = CURRENT_TIMESTAMP`,
    [contentHash, embedding, modelVersion]
  );
}

/**
 * Get or generate embedding (with cache check)
 */
export async function getOrCacheEmbedding(
  content: string,
  embedding: number[],
  modelVersion: string = CURRENT_EMBEDDING_MODEL
): Promise<number[]> {
  const contentHash = calculateContentHash(content);
  
  // Check cache first
  const cached = await getCachedEmbedding(contentHash, modelVersion);
  if (cached) {
    return cached;
  }
  
  // Cache new embedding
  await cacheEmbedding(contentHash, embedding, modelVersion);
  return embedding;
}
```

**Tests:**
```typescript
describe('Embedding Cache Service', () => {
  it('should cache and retrieve embedding', async () => {
    const content = 'test content';
    const hash = calculateContentHash(content);
    const embedding = [0.1, 0.2, 0.3]; // Mock embedding
    
    await cacheEmbedding(hash, embedding);
    const cached = await getCachedEmbedding(hash);
    
    expect(cached).toEqual(embedding);
  });
  
  it('should return null if not cached', async () => {
    const hash = 'nonexistent_hash';
    const cached = await getCachedEmbedding(hash);
    expect(cached).toBeNull();
  });
});
```

---

### 3. Change Detection Service

**File:** `server/services/changeDetectionService.ts`

```typescript
import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';

interface ContentChange {
  hasChanged: boolean;
  oldHash?: string;
  newHash: string;
  changeRatio?: number;
}

/**
 * Detect if content has changed
 */
export async function detectContentChange(
  chapterId: string,
  newContent: string
): Promise<ContentChange> {
  // Get current chapter
  const current = await db.query(
    `SELECT content, content_hash 
     FROM recent_chapters 
     WHERE chapter_id = $1`,
    [chapterId]
  );
  
  if (current.rows.length === 0) {
    // New chapter
    const newHash = calculateContentHash(newContent);
    return {
      hasChanged: true,
      newHash,
      changeRatio: 1.0,
    };
  }
  
  const oldHash = current.rows[0].content_hash;
  const newHash = calculateContentHash(newContent);
  
  if (oldHash === newHash) {
    // No change
    return {
      hasChanged: false,
      oldHash,
      newHash,
      changeRatio: 0,
    };
  }
  
  // Calculate change ratio (simplified)
  const oldContent = current.rows[0].content;
  const changeRatio = calculateChangeRatio(oldContent, newContent);
  
  return {
    hasChanged: true,
    oldHash,
    newHash,
    changeRatio,
  };
}

/**
 * Calculate change ratio between two texts
 * Simple implementation: word difference ratio
 */
function calculateChangeRatio(oldText: string, newText: string): number {
  const oldWords = oldText.split(/\s+/).length;
  const newWords = newText.split(/\s+/).length;
  const diff = Math.abs(newWords - oldWords);
  return diff / Math.max(oldWords, newWords, 1);
}
```

**Tests:**
```typescript
describe('Change Detection Service', () => {
  it('should detect no change', async () => {
    const content = 'test content';
    // Assume chapter exists with this content
    const change = await detectContentChange('chapter-id', content);
    expect(change.hasChanged).toBe(false);
  });
  
  it('should detect change', async () => {
    const newContent = 'modified content';
    const change = await detectContentChange('chapter-id', newContent);
    expect(change.hasChanged).toBe(true);
    expect(change.changeRatio).toBeGreaterThan(0);
  });
});
```

---

### 4. Database Connection Service

**File:** `server/db/connection.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export const db = {
  query: async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Query error', { text, error });
      throw error;
    }
  },
  
  // Transaction helper
  transaction: async (callback: (client: any) => Promise<void>) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await callback(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export default pool;
```

---

### 5. Basic CRUD Operations

**File:** `server/services/bookService.ts`

```typescript
import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';

interface Book {
  book_id: string;
  google_doc_id: string;
  title: string;
  author?: string;
  total_word_count: number;
  total_chapters: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create book
 */
export async function createBook(data: {
  google_doc_id: string;
  title: string;
  author?: string;
  total_word_count?: number;
  total_chapters?: number;
}): Promise<Book> {
  const result = await db.query(
    `INSERT INTO books 
     (google_doc_id, title, author, total_word_count, total_chapters)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.google_doc_id,
      data.title,
      data.author || null,
      data.total_word_count || 0,
      data.total_chapters || 0,
    ]
  );
  
  return result.rows[0];
}

/**
 * Get book by ID
 */
export async function getBookById(bookId: string): Promise<Book | null> {
  const result = await db.query(
    `SELECT * FROM books WHERE book_id = $1`,
    [bookId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get book by Google Doc ID
 */
export async function getBookByGoogleDocId(
  googleDocId: string
): Promise<Book | null> {
  const result = await db.query(
    `SELECT * FROM books WHERE google_doc_id = $1`,
    [googleDocId]
  );
  
  return result.rows[0] || null;
}

/**
 * Update book
 */
export async function updateBook(
  bookId: string,
  updates: Partial<Book>
): Promise<Book> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (updates.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(updates.title);
  }
  if (updates.author !== undefined) {
    fields.push(`author = $${paramCount++}`);
    values.push(updates.author);
  }
  if (updates.total_word_count !== undefined) {
    fields.push(`total_word_count = $${paramCount++}`);
    values.push(updates.total_word_count);
  }
  if (updates.total_chapters !== undefined) {
    fields.push(`total_chapters = $${paramCount++}`);
    values.push(updates.total_chapters);
  }
  
  values.push(bookId);
  
  const result = await db.query(
    `UPDATE books 
     SET ${fields.join(', ')}
     WHERE book_id = $${paramCount}
     RETURNING *`,
    values
  );
  
  return result.rows[0];
}

/**
 * Delete book (cascade deletes related data)
 */
export async function deleteBook(bookId: string): Promise<void> {
  await db.query(`DELETE FROM books WHERE book_id = $1`, [bookId]);
}
```

---

## 🧪 Testing Guide

### Unit Tests
```typescript
// tests/utils/contentHash.test.ts
describe('Content Hash', () => {
  // Test hash generation
  // Test hash comparison
});

// tests/services/embeddingCache.test.ts
describe('Embedding Cache', () => {
  // Test cache storage
  // Test cache retrieval
  // Test cache miss
});
```

### Integration Tests
```typescript
// tests/services/bookService.test.ts
describe('Book Service', () => {
  // Test create book
  // Test get book
  // Test update book
  // Test delete book
});
```

---

## ✅ Acceptance Criteria

### Database Setup
- [ ] PostgreSQL installed với pgvector extension
- [ ] Database connection working
- [ ] All tables created successfully
- [ ] All indexes created successfully
- [ ] Triggers working correctly

### Services
- [ ] Content hash utility working
- [ ] Embedding cache service working
- [ ] Change detection service working
- [ ] Database connection service working
- [ ] Basic CRUD operations working

### Testing
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Database schema validated
- [ ] Performance benchmarks met

---

## 📝 Notes

- **Database Version**: PostgreSQL 15+ required
- **pgvector Version**: 0.5.0+ required
- **Connection Pooling**: Max 20 connections
- **Environment Variables**: See `.env.example`

---

## 🚀 Next Steps

After completing Phase 1, proceed to:
- **Phase 2**: Data Normalization (LLM extraction, embeddings)
- Review: `PHASE_2_NORMALIZATION.md`

---

**Status:** Ready to Start  
**Estimated Time:** 2 weeks  
**Priority:** CRITICAL


