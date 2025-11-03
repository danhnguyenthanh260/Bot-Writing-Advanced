# Phase 4: Async Processing
**Priority:** MEDIUM  
**Timeline:** Week 7-8  
**Prerequisites:** Phase 3 Complete

---

## 📋 Overview

Phase 4 implements async processing system:
- Job queue setup (Bull/BullMQ)
- Background job processors
- Status tracking service
- Progress updates API
- User notification system

---

## ✅ Implementation Checklist

### Week 7: Job Queue System

#### Day 31-32: Job Queue Setup
- [ ] Install & configure Redis
- [ ] Setup Bull/BullMQ
- [ ] Create job queue configuration
- [ ] Add job types & interfaces

#### Day 33-34: Background Processors
- [ ] Create book processing processor
- [ ] Create chapter processing processor
- [ ] Create embedding generation processor
- [ ] Add error handling & retries

#### Day 35: Status Tracking
- [ ] Implement status tracking service
- [ ] Add progress updates
- [ ] Add status query API
- [ ] Add status dashboard

### Week 8: Integration & Polish

#### Day 36-37: User Notifications
- [ ] Implement notification service
- [ ] Add email notifications (optional)
- [ ] Add in-app notifications
- [ ] Add notification preferences

#### Day 38-39: Error Handling & Monitoring
- [ ] Add comprehensive error handling
- [ ] Add retry logic with backoff
- [ ] Add monitoring & logging
- [ ] Add alert system

#### Day 40: Testing & Documentation
- [ ] Integration tests for job queue
- [ ] Performance tests
- [ ] Documentation
- [ ] Deployment guide

---

## 🔧 Service Implementations

### 1. Job Queue Setup

**File:** `server/jobs/queue.ts`

```typescript
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export enum JobType {
  BOOK_PROCESSING = 'book-processing',
  CHAPTER_PROCESSING = 'chapter-processing',
  EMBEDDING_GENERATION = 'embedding-generation',
  BOOK_CONTEXT_EXTRACTION = 'book-context-extraction',
}

// Create queues
export const bookProcessingQueue = new Queue(JobType.BOOK_PROCESSING, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,      // Keep last 500 failed jobs
  },
});

export const chapterProcessingQueue = new Queue(JobType.CHAPTER_PROCESSING, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const embeddingQueue = new Queue(JobType.EMBEDDING_GENERATION, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 200,
    removeOnFail: 1000,
  },
});
```

---

### 2. Book Processing Processor

**File:** `server/jobs/bookProcessingProcessor.ts`

```typescript
import { Job } from 'bull';
import { bookProcessingQueue } from './queue';
import { updateProcessingStatus } from '../services/statusService';
import { extractBookContext } from '../services/bookContextService';
import { processChapters } from '../services/chapterService';
import { generateEmbeddingsForBook } from '../services/embeddingService';

interface BookProcessingJobData {
  bookId: string;
  googleDocId: string;
  title: string;
  content: string;
}

// Register processor
bookProcessingQueue.process(async (job: Job<BookProcessingJobData>) => {
  const { bookId, googleDocId, title, content } = job.data;
  
  try {
    // Phase 1: Basic Info (already done)
    await updateProcessingStatus(bookId, 'book', 'processing', 10);
    
    // Phase 2: Quick Summary
    await updateProcessingStatus(bookId, 'book', 'processing', 25);
    await extractBookContext(bookId, content, title, true); // Quick mode
    
    // Phase 3: Full Analysis
    await updateProcessingStatus(bookId, 'book', 'processing', 50);
    await extractBookContext(bookId, content, title, false); // Full mode
    
    // Phase 4: Chapter Processing
    await updateProcessingStatus(bookId, 'book', 'processing', 70);
    await processChapters(bookId, content);
    
    // Phase 5: Embeddings
    await updateProcessingStatus(bookId, 'book', 'processing', 90);
    await generateEmbeddingsForBook(bookId);
    
    // Complete
    await updateProcessingStatus(bookId, 'book', 'completed', 100);
    
    return { status: 'completed', bookId };
  } catch (error: any) {
    console.error('Book processing error:', error);
    await updateProcessingStatus(
      bookId,
      'book',
      'failed',
      -1,
      error.message
    );
    throw error;
  }
});

/**
 * Add book processing job
 */
export async function queueBookProcessing(data: BookProcessingJobData): Promise<string> {
  const job = await bookProcessingQueue.add(data, {
    jobId: `book-${data.bookId}`, // Unique job ID
    priority: 1,
  });
  
  return job.id.toString();
}

/**
 * Get job status
 */
export async function getBookProcessingStatus(jobId: string) {
  const job = await bookProcessingQueue.getJob(jobId);
  
  if (!job) {
    return null;
  }
  
  return {
    id: job.id,
    data: job.data,
    state: await job.getState(),
    progress: job.progress(),
    result: job.returnvalue,
    error: job.failedReason,
    created_at: new Date(job.timestamp),
    processed_on: job.processedOn ? new Date(job.processedOn) : null,
    finished_on: job.finishedOn ? new Date(job.finishedOn) : null,
  };
}
```

---

### 3. Chapter Processing Processor

**File:** `server/jobs/chapterProcessingProcessor.ts`

```typescript
import { Job } from 'bull';
import { chapterProcessingQueue } from './queue';
import { updateProcessingStatus } from '../services/statusService';
import { processChapter } from '../services/chapterService';

interface ChapterProcessingJobData {
  chapterId: string;
  bookId: string;
  chapterNumber: number;
  title?: string;
  content: string;
}

// Register processor
chapterProcessingQueue.process(async (job: Job<ChapterProcessingJobData>) => {
  const { chapterId, bookId, chapterNumber, title, content } = job.data;
  
  try {
    // Phase 1: Extract metadata
    await updateProcessingStatus(chapterId, 'chapter', 'processing', 30);
    await processChapter(chapterId, bookId, chapterNumber, title, content);
    
    // Phase 2: Generate embedding
    await updateProcessingStatus(chapterId, 'chapter', 'processing', 80);
    // Embedding will be queued separately
    
    // Complete
    await updateProcessingStatus(chapterId, 'chapter', 'completed', 100);
    
    return { status: 'completed', chapterId };
  } catch (error: any) {
    console.error('Chapter processing error:', error);
    await updateProcessingStatus(
      chapterId,
      'chapter',
      'failed',
      -1,
      error.message
    );
    throw error;
  }
});

/**
 * Add chapter processing job
 */
export async function queueChapterProcessing(
  data: ChapterProcessingJobData
): Promise<string> {
  const job = await chapterProcessingQueue.add(data, {
    jobId: `chapter-${data.chapterId}`,
    priority: 2, // Higher priority than book processing
  });
  
  return job.id.toString();
}
```

---

### 4. Embedding Generation Processor

**File:** `server/jobs/embeddingProcessor.ts`

```typescript
import { Job } from 'bull';
import { embeddingQueue } from './queue';
import { generateHierarchicalEmbeddings } from '../services/hierarchicalEmbeddingService';
import { getOrCacheEmbedding } from '../services/embeddingCacheService';
import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';

interface EmbeddingJobData {
  chapterId: string;
  content: string;
  isNew: boolean;
}

// Register processor with concurrency limit
embeddingQueue.process(5, async (job: Job<EmbeddingJobData>) => { // Max 5 concurrent
  const { chapterId, content, isNew } = job.data;
  
  try {
    // Check cache first
    const contentHash = calculateContentHash(content);
    const cached = await getCachedEmbedding(contentHash);
    
    if (cached && !isNew) {
      // Use cached embedding
      await db.query(
        `UPDATE recent_chapters 
         SET embedding_vector = $1,
             embedding_version = $2,
             embedding_timestamp = CURRENT_TIMESTAMP
         WHERE chapter_id = $3`,
        [cached, process.env.VERTEX_AI_MODEL || 'text-embedding-004', chapterId]
      );
      
      return { status: 'completed', chapterId, cached: true };
    }
    
    // Generate new embedding
    const { chapterEmbedding, chunkEmbeddings } = 
      await generateHierarchicalEmbeddings(content);
    
    // Save chapter-level embedding
    await db.query(
      `UPDATE recent_chapters 
       SET embedding_vector = $1,
           embedding_version = $2,
           embedding_timestamp = CURRENT_TIMESTAMP
       WHERE chapter_id = $3`,
      [
        chapterEmbedding,
        process.env.VERTEX_AI_MODEL || 'text-embedding-004',
        chapterId,
      ]
    );
    
    // Save chunk-level embeddings
    if (chunkEmbeddings.length > 0) {
      // Delete old chunks
      await db.query(
        `DELETE FROM chapter_chunks WHERE chapter_id = $1`,
        [chapterId]
      );
      
      // Insert new chunks
      for (const chunk of chunkEmbeddings) {
        await db.query(
          `INSERT INTO chapter_chunks 
           (chapter_id, chunk_index, chunk_text, chunk_embedding, word_count)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            chapterId,
            chunk.chunkIndex,
            chunk.text,
            chunk.embedding,
            chunk.text.split(/\s+/).length,
          ]
        );
      }
    }
    
    // Cache embedding
    await getOrCacheEmbedding(content, chapterEmbedding);
    
    return { status: 'completed', chapterId, cached: false };
  } catch (error: any) {
    console.error('Embedding generation error:', error);
    throw error;
  }
});

/**
 * Add embedding generation job
 */
export async function queueEmbeddingGeneration(
  data: EmbeddingJobData
): Promise<string> {
  const job = await embeddingQueue.add(data, {
    jobId: `embedding-${data.chapterId}`,
    priority: 3, // Highest priority
  });
  
  return job.id.toString();
}
```

---

### 5. Status Tracking Service

**File:** `server/services/statusService.ts`

```typescript
import { db } from '../db/connection';

type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
type EntityType = 'book' | 'chapter';

/**
 * Update processing status
 */
export async function updateProcessingStatus(
  entityId: string,
  entityType: EntityType,
  status: ProcessingStatus,
  progress: number = 0,
  error?: string
): Promise<void> {
  await db.query(
    `INSERT INTO processing_status 
     (entity_type, entity_id, status, progress, started_at, completed_at, error)
     VALUES ($1, $2, $3, $4, 
             CASE WHEN $3 = 'processing' AND NOT EXISTS (
               SELECT 1 FROM processing_status 
               WHERE entity_type = $1 AND entity_id = $2
             ) THEN CURRENT_TIMESTAMP ELSE NULL END,
             CASE WHEN $3 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END,
             $5)
     ON CONFLICT (entity_type, entity_id) 
     DO UPDATE SET 
       status = EXCLUDED.status,
       progress = EXCLUDED.progress,
       started_at = COALESCE(
         processing_status.started_at,
         CASE WHEN EXCLUDED.status = 'processing' THEN CURRENT_TIMESTAMP ELSE NULL END
       ),
       completed_at = CASE WHEN EXCLUDED.status IN ('completed', 'failed') 
                           THEN CURRENT_TIMESTAMP 
                           ELSE processing_status.completed_at END,
       error = EXCLUDED.error`,
    [entityType, entityId, status, progress, error || null]
  );
}

/**
 * Get processing status
 */
export async function getProcessingStatus(
  entityId: string,
  entityType: EntityType
): Promise<ProcessingStatus | null> {
  const result = await db.query(
    `SELECT status, progress, started_at, completed_at, error
     FROM processing_status
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [entityType, entityId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    status: result.rows[0].status,
    progress: result.rows[0].progress,
    started_at: result.rows[0].started_at,
    completed_at: result.rows[0].completed_at,
    error: result.rows[0].error,
  };
}
```

---

### 6. API Endpoints

**File:** `server/routes/processingRoutes.ts`

```typescript
import express from 'express';
import { queueBookProcessing, getBookProcessingStatus } from '../jobs/bookProcessingProcessor';
import { getProcessingStatus } from '../services/statusService';

const router = express.Router();

/**
 * POST /api/books/import
 * Queue book processing
 */
router.post('/books/import', async (req, res) => {
  try {
    const { google_doc_id, title, content } = req.body;
    
    // Create book (Phase 1: Basic Info)
    const book = await createBook({
      google_doc_id,
      title,
      total_word_count: content.split(/\s+/).length,
    });
    
    // Queue processing
    const jobId = await queueBookProcessing({
      bookId: book.book_id,
      googleDocId: google_doc_id,
      title,
      content,
    });
    
    res.json({
      book_id: book.book_id,
      job_id: jobId,
      status: 'processing',
      progress: 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/books/:book_id/status
 * Get processing status
 */
router.get('/books/:book_id/status', async (req, res) => {
  try {
    const { book_id } = req.params;
    
    // Get from processing_status table
    const status = await getProcessingStatus(book_id, 'book');
    
    if (!status) {
      return res.json({
        status: 'pending',
        progress: 0,
      });
    }
    
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/:job_id
 * Get job status
 */
router.get('/jobs/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;
    const jobStatus = await getBookProcessingStatus(job_id);
    
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }
  
    res.json(jobStatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 🧪 Testing Guide

### Integration Tests
```typescript
// tests/jobs/bookProcessingProcessor.test.ts
describe('Book Processing', () => {
  it('should process book successfully', async () => {
    // Test
  });
  
  it('should handle errors gracefully', async () => {
    // Test
  });
});
```

---

## ✅ Acceptance Criteria

### Job Queue
- [ ] Redis setup working
- [ ] Bull/BullMQ configured
- [ ] Job queues created
- [ ] Processors registered

### Background Processing
- [ ] Book processing working
- [ ] Chapter processing working
- [ ] Embedding generation working
- [ ] Error handling working

### Status Tracking
- [ ] Status updates working
- [ ] Progress tracking working
- [ ] Status API working
- [ ] Status dashboard working

---

## 🚀 Next Steps

After completing Phase 4, proceed to:
- **Phase 5**: Optimization & Polish (performance tuning, monitoring)
- Review: `PHASE_5_OPTIMIZATION.md`

---

**Status:** Ready to Start (After Phase 3)  
**Estimated Time:** 2 weeks  
**Priority:** MEDIUM


