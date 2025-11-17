# 🔧 Kế Hoạch Sửa Các Vấn Đề - Action Plan

**Cập nhật:** 2024  
**Mục đích:** Kế hoạch chi tiết, actionable để fix tất cả các vấn đề đã được xác định

---

## 📋 Mục Lục

1. [Tổng Quan Timeline](#tổng-quan-timeline)
2. [Week 1: Critical Fixes (Immediate)](#week-1-critical-fixes-immediate)
3. [Week 2-3: High Priority Fixes](#week-2-3-high-priority-fixes)
4. [Week 4-5: Medium Priority Fixes](#week-4-5-medium-priority-fixes)
5. [Week 6+: Ongoing Improvements](#week-6-ongoing-improvements)
6. [Dependencies & Blockers](#dependencies--blockers)
7. [Testing Strategy](#testing-strategy)

---

## 📅 Tổng Quan Timeline

```
Week 1: Critical Fixes (3 issues)
  ├─ Fix Gemini Model Fallback
  ├─ Verify & Fix UI Visibility
  └─ Service Integration Check

Week 2-3: High Priority (5 issues)
  ├─ Setup Redis + Bull Queue
  ├─ Error Handling Improvements
  ├─ Status Tracking API Test
  ├─ Query Optimization
  └─ Redis Cache Layer

Week 4-5: Medium Priority (8 issues)
  ├─ User Notifications
  ├─ Monitoring & Metrics
  ├─ Testing Infrastructure
  └─ Service Integration

Week 6+: Ongoing (4 issues)
  ├─ Documentation
  ├─ UI Polish
  ├─ Accessibility
  └─ Performance Tuning
```

---

## 🔴 Week 1: Critical Fixes (Immediate)

### Task 1.1: Fix Gemini Model Fallback

**Priority:** 🔴 Critical  
**Effort:** 2-3 giờ  
**Dependencies:** None

#### Checklist

- [ ] **Step 1: Create Model Fallback Utility**

**File:** `server/utils/modelFallback.ts`

```typescript
export const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',  // Primary (experimental)
  'gemini-2.0-flash',       // Fallback 1
  'gemini-1.5-pro',         // Fallback 2
  'gemini-1.5-flash',       // Fallback 3
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number];

export interface ModelFallbackResult<T> {
  result: T;
  modelUsed: GeminiModel;
  attempts: number;
}

/**
 * Try models in order until one succeeds
 */
export async function withModelFallback<T>(
  operation: (model: GeminiModel) => Promise<T>,
  options?: {
    models?: GeminiModel[];
    onModelFailed?: (model: GeminiModel, error: Error) => void;
  }
): Promise<ModelFallbackResult<T>> {
  const models = options?.models || GEMINI_MODELS;
  let lastError: Error | null = null;
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await operation(model);
      return {
        result,
        modelUsed: model,
        attempts: i + 1,
      };
    } catch (error: any) {
      lastError = error;
      
      // Log model failure
      if (options?.onModelFailed) {
        options.onModelFailed(model, error);
      }
      
      // If this is the last model, throw
      if (i === models.length - 1) {
        throw new Error(
          `All models failed. Last error: ${lastError.message}`
        );
      }
      
      // Try next model
      console.warn(`Model ${model} failed, trying next model...`);
    }
  }
  
  throw lastError || new Error('No models available');
}
```

- [ ] **Step 2: Update Extraction Service**

**File:** `server/services/extractionService.ts`

```typescript
import { withModelFallback, GEMINI_MODELS } from '../utils/modelFallback';

export async function extractBookContext(
  fullText: string,
  title: string
): Promise<ExtractionResult<BookContext>> {
  const truncatedText = truncateTextForAI(normalizedText, 50000);
  const prompt = `...`; // existing prompt

  try {
    // Use model fallback
    const { result, modelUsed, attempts } = await withModelFallback(
      async (model) => {
        return await retryWithTimeout(
          async () => {
            return await genAI.models.generateContent({
              model, // ✅ Use fallback model
              contents: prompt,
            });
          },
          {
            maxAttempts: 3,
            timeoutMs: AI_TIMEOUT_MS,
            initialDelayMs: 2000,
          }
        );
      },
      {
        onModelFailed: (model, error) => {
          console.warn(`Model ${model} failed:`, error.message);
        },
      }
    );
    
    // Log which model was used
    if (attempts > 1) {
      console.log(`Used fallback model: ${modelUsed} (attempt ${attempts})`);
    }
    
    // ... rest of extraction logic
  } catch (error) {
    // ... error handling
  }
}
```

- [ ] **Step 3: Update Gemini Service**

**File:** `services/geminiService.ts`

```typescript
import { withModelFallback } from '../server/utils/modelFallback';

export async function getAIResponse(
  prompt: string,
  options?: GeminiOptions
): Promise<AIResponse> {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
  
  const { result, modelUsed } = await withModelFallback(
    async (model) => {
      const modelInstance = genAI.getGenerativeModel({
        model: model || options?.model || 'gemini-2.0-flash-exp',
      });
      
      return await modelInstance.generateContent({
        contents: prompt,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 2048,
        },
      });
    }
  );
  
  // ... rest of logic
}
```

- [ ] **Step 4: Make Model Configurable**

**File:** `.env.example`

```env
# Gemini Model Configuration
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_FALLBACK_MODELS=gemini-2.0-flash,gemini-1.5-pro,gemini-1.5-flash
```

- [ ] **Step 5: Test**

```typescript
// Test với model không tồn tại → should fallback
// Test với tất cả models fail → should throw error
// Test với model đầu tiên success → should use primary
```

**Files to create/modify:**
- ✅ Create: `server/utils/modelFallback.ts`
- ✅ Modify: `server/services/extractionService.ts`
- ✅ Modify: `services/geminiService.ts`
- ✅ Update: `.env.example`

---

### Task 1.2: Verify & Fix UI Visibility Issues

**Priority:** 🔴 Critical  
**Effort:** 4-6 giờ  
**Dependencies:** None

#### Checklist

- [ ] **Step 1: Audit UI Components**

**Checklist:**
- [ ] Header component - verify z-index và visibility
- [ ] Sidebar component - verify z-index và visibility
- [ ] ChatWidget - verify toggle và z-index
- [ ] Projects list - verify accessibility
- [ ] Login button - verify visibility

- [ ] **Step 2: Fix CSS Issues**

**File:** `index.css` hoặc component styles

```css
/* Ensure header always visible */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* ✅ High z-index */
  background: var(--bg-primary);
}

/* Ensure sidebar always visible */
.sidebar {
  position: fixed;
  left: 0;
  top: var(--header-height);
  bottom: 0;
  z-index: 999; /* ✅ Below header but above content */
  background: var(--bg-secondary);
}

/* Chat widget */
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 998; /* ✅ Below header/sidebar */
}

/* Main content */
.main-content {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  z-index: 1; /* ✅ Below navigation */
}
```

- [ ] **Step 3: Test Visibility**

**Test Cases:**
- [ ] Header visible khi scroll
- [ ] Sidebar visible khi scroll
- [ ] Chat widget toggle hoạt động
- [ ] Projects list accessible
- [ ] Login button visible
- [ ] No overlapping elements

- [ ] **Step 4: Add Visual Tests**

**File:** `tests/ui/visibility.test.tsx`

```typescript
describe('UI Visibility', () => {
  it('should show header at all times', () => {
    // Test header visibility
  });
  
  it('should show sidebar at all times', () => {
    // Test sidebar visibility
  });
  
  // ... more tests
});
```

**Files to modify:**
- ✅ Modify: `components/Header.tsx`
- ✅ Modify: `components/Sidebar.tsx`
- ✅ Modify: `components/ChatWidget.tsx`
- ✅ Modify: `index.css` hoặc component styles
- ✅ Create: `tests/ui/visibility.test.tsx`

---

### Task 1.3: Service Integration Check

**Priority:** 🔴 Critical  
**Effort:** 3-4 giờ  
**Dependencies:** None

#### Checklist

- [ ] **Step 1: Verify All Routes Registered**

**File:** `server/index.ts`

```typescript
// Verify all routes are imported and registered
app.use('/api/google-docs', googleDocsRouter);        // ✅
app.use('/api/processing', processingRouter);         // ✅
app.use('/api/context', contextRouter);               // ✅
app.use('/api/results', resultsRouter);               // ✅
app.use('/api/logs', logsRouter);                     // ✅
app.use('/api/auth', authRouter);                     // ✅

// Check for missing routes:
// - /api/workspace (if exists)
// - /api/chat (if exists)
// - /api/health (already exists)
```

- [ ] **Step 2: Verify All Services Used**

**Checklist:**
- [ ] `bookService.ts` - used in routes?
- [ ] `userService.ts` - used in routes?
- [ ] `workspaceService.ts` - used in routes?
- [ ] `extractionService.ts` - used in jobs?
- [ ] `semanticSearchService.ts` - used in context routes?
- [ ] `contextRetrievalService.ts` - used in context routes?
- [ ] `promptConstructionService.ts` - used in chat?
- [ ] `statusService.ts` - used in processing routes?

- [ ] **Step 3: Create Integration Test**

**File:** `tests/integration/routes.test.ts`

```typescript
describe('Route Integration', () => {
  it('should register all routes', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
  
  it('should have all API endpoints', () => {
    // Check routes are registered
  });
});
```

- [ ] **Step 4: Document Missing Integrations**

**Create:** `docs/guides/MISSING_INTEGRATIONS.md`

List các services/routes chưa được integrate.

**Files to check:**
- ✅ Check: `server/index.ts`
- ✅ Check: All files in `server/routes/`
- ✅ Check: All files in `server/services/`
- ✅ Create: `tests/integration/routes.test.ts`

---

## 🟠 Week 2-3: High Priority Fixes

### Task 2.1: Setup Redis + Bull Queue

**Priority:** 🟠 High  
**Effort:** 1-2 ngày  
**Dependencies:** Redis installation

#### Checklist

- [ ] **Step 1: Install Dependencies**

```bash
npm install bull ioredis @types/bull
```

- [ ] **Step 2: Setup Redis Connection**

**File:** `server/utils/redis.ts`

```typescript
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});
```

- [ ] **Step 3: Create Bull Queues**

**File:** `server/jobs/queue.ts` (new file)

```typescript
import Queue from 'bull';
import { redis } from '../utils/redis';

export enum JobType {
  BOOK_PROCESSING = 'book-processing',
  CHAPTER_PROCESSING = 'chapter-processing',
  EMBEDDING_GENERATION = 'embedding-generation',
}

export interface BookProcessingJobData {
  bookId: string;
  googleDocId: string;
  title: string;
  content: string;
}

export interface ChapterProcessingJobData {
  chapterId: string;
  bookId: string;
  chapterNumber: number;
  title?: string;
  content: string;
}

// Book Processing Queue
export const bookProcessingQueue = new Queue<BookProcessingJobData>(
  JobType.BOOK_PROCESSING,
  {
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
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  }
);

// Chapter Processing Queue
export const chapterProcessingQueue = new Queue<ChapterProcessingJobData>(
  JobType.CHAPTER_PROCESSING,
  {
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
  }
);

// Queue event listeners
bookProcessingQueue.on('completed', (job) => {
  console.log(`✅ Book processing job ${job.id} completed`);
});

bookProcessingQueue.on('failed', (job, error) => {
  console.error(`❌ Book processing job ${job?.id} failed:`, error);
});

chapterProcessingQueue.on('completed', (job) => {
  console.log(`✅ Chapter processing job ${job.id} completed`);
});

chapterProcessingQueue.on('failed', (job, error) => {
  console.error(`❌ Chapter processing job ${job?.id} failed:`, error);
});
```

- [ ] **Step 4: Update Job Processors**

**File:** `server/jobs/bookProcessingJob.ts`

```typescript
import { bookProcessingQueue, BookProcessingJobData } from './queue';
import { processBook } from './processors/bookProcessor';

// Register processor
bookProcessingQueue.process(async (job) => {
  const { bookId, googleDocId, title, content } = job.data;
  
  // Update progress
  await job.progress(10);
  
  // Process book
  await processBook({ bookId, googleDocId, title, content });
  
  // Update progress
  await job.progress(100);
  
  return { success: true };
});

// Export queue functions
export async function queueBookProcessing(data: BookProcessingJobData) {
  const job = await bookProcessingQueue.add(data, {
    priority: 1,
    attempts: 3,
  });
  return job.id;
}

export async function getBookProcessingStatus(jobId: string) {
  const job = await bookProcessingQueue.getJob(jobId);
  if (!job) return null;
  
  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress(),
    data: job.data,
    error: job.failedReason,
  };
}
```

**File:** `server/jobs/chapterProcessingJob.ts` - Similar pattern

- [ ] **Step 5: Update Routes to Use Bull Queue**

**File:** `server/routes/googleDocs.ts`

```typescript
// Replace simpleQueue với Bull queue
import { queueBookProcessing, queueChapterProcessing } from '../jobs/bookProcessingJob';

// In ingest route:
const bookJobId = await queueBookProcessing({
  bookId: book.book_id,
  googleDocId: doc.docId,
  title: doc.title,
  content: doc.plainText,
});

// Return job ID to frontend
res.json({
  success: true,
  bookId: book.book_id,
  jobId: bookJobId, // ✅ Return job ID
});
```

- [ ] **Step 6: Add Job Status Endpoint**

**File:** `server/routes/processingRoutes.ts`

```typescript
router.get('/status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const status = await getBookProcessingStatus(jobId);
  
  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(status);
});
```

- [ ] **Step 7: Environment Variables**

**File:** `.env.example`

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

- [ ] **Step 8: Migration Guide**

**File:** `docs/guides/MIGRATE_TO_BULL_QUEUE.md`

**Files to create/modify:**
- ✅ Create: `server/utils/redis.ts`
- ✅ Create: `server/jobs/queue.ts`
- ✅ Modify: `server/jobs/bookProcessingJob.ts`
- ✅ Modify: `server/jobs/chapterProcessingJob.ts`
- ✅ Modify: `server/routes/googleDocs.ts`
- ✅ Modify: `server/routes/processingRoutes.ts`
- ✅ Update: `.env.example`
- ✅ Create: `docs/guides/MIGRATE_TO_BULL_QUEUE.md`

---

### Task 2.2: Error Handling & Retry Logic Improvements

**Priority:** 🟠 High  
**Effort:** 1 ngày  
**Dependencies:** None

#### Checklist

- [ ] **Step 1: Create Retry Utility**

**File:** `server/utils/retry.ts`

```typescript
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = retryableErrors.some(
        code => error.code === code || error.message.includes(code)
      );
      
      if (!isRetryable || attempt >= maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      
      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`,
        error.message
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Retry failed');
}
```

- [ ] **Step 2: Create Error Tracking Service**

**File:** `server/services/errorTrackingService.ts`

```typescript
interface ErrorLog {
  id: string;
  timestamp: Date;
  error: Error;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTrackingService {
  private errors: ErrorLog[] = [];
  private maxErrors = 1000;
  
  logError(
    error: Error,
    context: Record<string, any> = {},
    severity: ErrorLog['severity'] = 'medium'
  ): void {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      error,
      context,
      severity,
    };
    
    this.errors.push(errorLog);
    
    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Log to console
    console.error(`[${severity.toUpperCase()}]`, error.message, context);
    
    // TODO: Send to error tracking service (Sentry, etc.)
  }
  
  getErrors(severity?: ErrorLog['severity']): ErrorLog[] {
    if (severity) {
      return this.errors.filter(e => e.severity === severity);
    }
    return this.errors;
  }
  
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    recent: number;
  } {
    const bySeverity = this.errors.reduce((acc, e) => {
      acc[e.severity] = (acc[e.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = this.errors.filter(e => e.timestamp > oneHourAgo).length;
    
    return {
      total: this.errors.length,
      bySeverity,
      recent,
    };
  }
}

export const errorTrackingService = new ErrorTrackingService();
```

- [ ] **Step 3: Update Services to Use Retry**

**File:** `server/services/extractionService.ts`

```typescript
import { retryWithBackoff } from '../utils/retry';
import { errorTrackingService } from './errorTrackingService';

export async function extractBookContext(...) {
  try {
    const result = await retryWithBackoff(
      async () => {
        return await genAI.models.generateContent({...});
      },
      {
        maxAttempts: 3,
        initialDelayMs: 2000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', '429'],
      }
    );
    // ...
  } catch (error) {
    errorTrackingService.logError(
      error as Error,
      { operation: 'extractBookContext', title },
      'high'
    );
    throw error;
  }
}
```

- [ ] **Step 4: Add Error Endpoint**

**File:** `server/routes/errorRoutes.ts` (new)

```typescript
import { Router } from 'express';
import { errorTrackingService } from '../services/errorTrackingService';

const router = Router();

router.get('/stats', (_req, res) => {
  const stats = errorTrackingService.getErrorStats();
  res.json(stats);
});

router.get('/recent', (req, res) => {
  const severity = req.query.severity as string;
  const errors = errorTrackingService.getErrors(severity as any);
  res.json(errors.slice(-50)); // Last 50 errors
});

export default router;
```

**Files to create/modify:**
- ✅ Create: `server/utils/retry.ts`
- ✅ Create: `server/services/errorTrackingService.ts`
- ✅ Modify: `server/services/extractionService.ts`
- ✅ Modify: Other services với retry logic
- ✅ Create: `server/routes/errorRoutes.ts`
- ✅ Register: `server/index.ts`

---

### Task 2.3: Status Tracking API Test & Fix

**Priority:** 🟠 High  
**Effort:** 2-3 giờ  
**Dependencies:** None

#### Checklist

- [ ] **Step 1: Test Status Tracking API**

**File:** `tests/integration/statusTracking.test.ts`

```typescript
describe('Status Tracking API', () => {
  it('should return processing status', async () => {
    // Create a test job
    const jobId = await queueBookProcessing({...});
    
    // Check status
    const response = await request(app)
      .get(`/api/processing/status/book/${jobId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('progress');
  });
  
  it('should return 404 for non-existent job', async () => {
    const response = await request(app)
      .get('/api/processing/status/book/non-existent');
    
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Fix Issues Found**

- [ ] **Step 3: Add Real-time Updates (Optional)**

**File:** `server/routes/processingRoutes.ts`

```typescript
// Add WebSocket hoặc Server-Sent Events cho real-time updates
router.get('/status/:entityType/:entityId/stream', (req, res) => {
  // SSE implementation
  res.setHeader('Content-Type', 'text/event-stream');
  // ...
});
```

**Files to create/modify:**
- ✅ Create: `tests/integration/statusTracking.test.ts`
- ✅ Modify: `server/routes/processingRoutes.ts`
- ✅ Test: All status endpoints

---

### Task 2.4: Database Query Optimization

**Priority:** 🟠 High  
**Effort:** 1 ngày  
**Dependencies:** None

#### Checklist

- [ ] **Step 1: Run EXPLAIN ANALYZE**

**File:** `scripts/analyzeQueries.sql`

```sql
-- Analyze semantic search query
EXPLAIN ANALYZE
SELECT 
  cc.chunk_text,
  rc.chapter_number,
  1 - (cc.chunk_embedding <=> $1::vector) as similarity
FROM chapter_chunks cc
JOIN recent_chapters rc ON cc.chapter_id = rc.chapter_id
WHERE rc.book_id = $2
  AND 1 - (cc.chunk_embedding <=> $1::vector) >= 0.7
ORDER BY similarity DESC
LIMIT 10;

-- Analyze context retrieval query
EXPLAIN ANALYZE
SELECT * FROM book_contexts
WHERE book_id = $1;

-- Analyze recent chapters query
EXPLAIN ANALYZE
SELECT * FROM recent_chapters
WHERE book_id = $1
ORDER BY updated_at DESC
LIMIT 5;
```

- [ ] **Step 2: Optimize Indexes**

**File:** `server/db/optimizeIndexes.sql`

```sql
-- Optimize pgvector index
DROP INDEX IF EXISTS idx_recent_chapters_embedding;

CREATE INDEX idx_recent_chapters_embedding
ON recent_chapters
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100); -- Adjust based on data size

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_recent_chapters_book_updated
ON recent_chapters(book_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapter_chunks_chapter
ON chapter_chunks(chapter_id, chunk_index);

-- Partial indexes for active data
CREATE INDEX IF NOT EXISTS idx_recent_chapters_active
ON recent_chapters(book_id, chapter_number)
WHERE updated_at > NOW() - INTERVAL '30 days';
```

- [ ] **Step 3: Optimize Queries**

**File:** `server/services/semanticSearchService.ts`

```typescript
// Optimize query với better index usage
async function semanticSearch(...) {
  // Use index-friendly query
  const results = await db.query(`
    SELECT 
      cc.chunk_text,
      cc.chunk_index,
      rc.chapter_number,
      rc.title as chapter_title,
      1 - (cc.chunk_embedding <=> $1::vector) as similarity
    FROM chapter_chunks cc
    INNER JOIN recent_chapters rc ON cc.chapter_id = rc.chapter_id
    WHERE rc.book_id = $2
      AND rc.updated_at > NOW() - INTERVAL '30 days' -- Use partial index
      AND 1 - (cc.chunk_embedding <=> $1::vector) >= $3
    ORDER BY similarity DESC
    LIMIT $4
  `, [queryEmbedding, bookId, threshold, limit]);
  
  return results.rows;
}
```

- [ ] **Step 4: Add Query Performance Monitoring**

**File:** `server/utils/queryMonitor.ts`

```typescript
export async function monitorQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await query();
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 500) {
      console.warn(`Slow query: ${queryName} took ${duration}ms`);
    }
    
    // Track metrics
    // TODO: Send to metrics service
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}
```

**Files to create/modify:**
- ✅ Create: `scripts/analyzeQueries.sql`
- ✅ Create: `server/db/optimizeIndexes.sql`
- ✅ Modify: `server/services/semanticSearchService.ts`
- ✅ Modify: Other services với slow queries
- ✅ Create: `server/utils/queryMonitor.ts`

---

### Task 2.5: Redis Cache Layer

**Priority:** 🟠 High  
**Effort:** 1-2 ngày  
**Dependencies:** Redis setup (from Task 2.1)

#### Checklist

- [ ] **Step 1: Create Cache Service**

**File:** `server/services/cacheService.ts`

```typescript
import { redis } from '../utils/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

class CacheService {
  private defaultTTL = 3600; // 1 hour
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      return await redis.del(...keys);
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return 0;
    }
  }
}

export const cacheService = new CacheService();

// Cache key generators
export const cacheKeys = {
  bookContext: (bookId: string) => `book:context:${bookId}`,
  recentChapters: (bookId: string) => `book:chapters:${bookId}`,
  searchResults: (bookId: string, query: string) => 
    `search:${bookId}:${Buffer.from(query).toString('base64')}`,
};
```

- [ ] **Step 2: Add Caching to Context Retrieval**

**File:** `server/services/contextRetrievalService.ts`

```typescript
import { cacheService, cacheKeys } from './cacheService';

export async function getBookLevelContext(bookId: string) {
  // Check cache first
  const cacheKey = cacheKeys.bookContext(bookId);
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const context = await db.query(
    'SELECT * FROM book_contexts WHERE book_id = $1',
    [bookId]
  );
  
  // Cache result (1 hour)
  await cacheService.set(cacheKey, context.rows[0], { ttl: 3600 });
  
  return context.rows[0];
}

export async function getRecentChapters(bookId: string, limit: number = 5) {
  const cacheKey = cacheKeys.recentChapters(bookId);
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const chapters = await db.query(
    `SELECT * FROM recent_chapters 
     WHERE book_id = $1 
     ORDER BY updated_at DESC 
     LIMIT $2`,
    [bookId, limit]
  );
  
  // Cache result (30 minutes)
  await cacheService.set(cacheKey, chapters.rows, { ttl: 1800 });
  
  return chapters.rows;
}
```

- [ ] **Step 3: Add Cache Invalidation**

**File:** `server/services/cacheService.ts`

```typescript
// Invalidate cache when data changes
export async function invalidateBookCache(bookId: string): Promise<void> {
  await Promise.all([
    cacheService.del(cacheKeys.bookContext(bookId)),
    cacheService.del(cacheKeys.recentChapters(bookId)),
    cacheService.invalidatePattern(`search:${bookId}:*`),
  ]);
}
```

**Update:** `server/routes/googleDocs.ts`

```typescript
// After updating book/chapters, invalidate cache
import { invalidateBookCache } from '../services/cacheService';

// In ingest route, after saving:
await invalidateBookCache(book.book_id);
```

**Files to create/modify:**
- ✅ Create: `server/services/cacheService.ts`
- ✅ Modify: `server/services/contextRetrievalService.ts`
- ✅ Modify: `server/services/semanticSearchService.ts`
- ✅ Modify: `server/routes/googleDocs.ts`

---

## 🟡 Week 4-5: Medium Priority Fixes

### Task 3.1: User Notifications

**Priority:** 🟡 Medium  
**Effort:** 1 ngày  
**Dependencies:** Bull Queue (Task 2.1)

#### Checklist

- [ ] **Step 1: Create Notification Service**

**File:** `server/services/notificationService.ts`

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'processing_complete' | 'processing_failed' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

class NotificationService {
  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    // Save to database
    // Send in-app notification
    // Optionally send email
  }
  
  async getNotifications(userId: string, unreadOnly: boolean = false) {
    // Get from database
  }
  
  async markAsRead(notificationId: string) {
    // Update in database
  }
}
```

- [ ] **Step 2: Add Notification Endpoints**

**File:** `server/routes/notificationRoutes.ts`

```typescript
router.get('/', authenticateUser, async (req, res) => {
  const notifications = await notificationService.getNotifications(req.user.id);
  res.json(notifications);
});

router.post('/:id/read', authenticateUser, async (req, res) => {
  await notificationService.markAsRead(req.params.id);
  res.json({ success: true });
});
```

- [ ] **Step 3: Integrate với Job Processors**

**File:** `server/jobs/bookProcessingJob.ts`

```typescript
// After processing completes
await notificationService.createNotification(
  userId,
  'processing_complete',
  'Book processing completed',
  `Book "${title}" has been processed successfully.`
);
```

**Files to create/modify:**
- ✅ Create: `server/services/notificationService.ts`
- ✅ Create: `server/routes/notificationRoutes.ts`
- ✅ Modify: `server/jobs/bookProcessingJob.ts`
- ✅ Modify: `server/jobs/chapterProcessingJob.ts`

---

### Task 3.2: Monitoring & Metrics

**Priority:** 🟡 Medium  
**Effort:** 1-2 ngày  
**Dependencies:** None

#### Checklist

- [ ] **Step 1: Create Metrics Service**

**File:** `server/services/metricsService.ts`

```typescript
interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

class MetricsService {
  private metrics: Metric[] = [];
  
  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags,
    });
  }
  
  getMetrics(name?: string, timeRange?: { start: Date; end: Date }) {
    // Filter and return metrics
  }
  
  getStats() {
    // Calculate stats: avg, p95, p99, etc.
  }
}

export const metricsService = new MetricsService();
```

- [ ] **Step 2: Add Metrics Endpoints**

**File:** `server/routes/metricsRoutes.ts`

```typescript
router.get('/stats', (_req, res) => {
  const stats = metricsService.getStats();
  res.json(stats);
});
```

- [ ] **Step 3: Instrument Services**

**File:** `server/services/semanticSearchService.ts`

```typescript
import { metricsService } from './metricsService';

export async function semanticSearch(...) {
  const start = Date.now();
  try {
    const results = await db.query(...);
    const duration = Date.now() - start;
    
    metricsService.record('semantic_search_duration', duration, {
      bookId,
      resultCount: results.rows.length.toString(),
    });
    
    return results.rows;
  } catch (error) {
    metricsService.record('semantic_search_errors', 1, { bookId });
    throw error;
  }
}
```

**Files to create/modify:**
- ✅ Create: `server/services/metricsService.ts`
- ✅ Create: `server/routes/metricsRoutes.ts`
- ✅ Modify: Services để instrument metrics

---

## 📊 Dependencies & Blockers

### Dependency Graph

```
Redis Setup
  ↓
Bull Queue (Task 2.1)
  ↓
Cache Layer (Task 2.5)
  ↓
Notifications (Task 3.1)

Model Fallback (Task 1.1)
  ↓
Error Handling (Task 2.2)

UI Visibility (Task 1.2) - No dependencies
Service Integration (Task 1.3) - No dependencies
```

### Blockers

- **Redis Setup** blocks:
  - Bull Queue migration
  - Cache layer implementation
  - Notifications (if using Redis)

- **Model Fallback** blocks:
  - Production deployment (nếu model không available)

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Model fallback utility tests
- [ ] Retry utility tests
- [ ] Cache service tests
- [ ] Error tracking tests

### Integration Tests

- [ ] Status tracking API tests
- [ ] Job queue integration tests
- [ ] Cache integration tests
- [ ] Route integration tests

### E2E Tests

- [ ] Full workflow test (upload → process → search)
- [ ] Error recovery test
- [ ] Performance test

---

## ✅ Progress Tracking

### Week 1 Checklist

- [ ] Task 1.1: Gemini Model Fallback
- [ ] Task 1.2: UI Visibility Fixes
- [ ] Task 1.3: Service Integration Check

### Week 2-3 Checklist

- [ ] Task 2.1: Redis + Bull Queue
- [ ] Task 2.2: Error Handling
- [ ] Task 2.3: Status Tracking
- [ ] Task 2.4: Query Optimization
- [ ] Task 2.5: Redis Cache

### Week 4-5 Checklist

- [ ] Task 3.1: Notifications
- [ ] Task 3.2: Monitoring
- [ ] Task 3.3: Testing Infrastructure
- [ ] Task 3.4: Service Integration

---

## 📝 Notes

- **Redis:** Cần setup trước khi làm Bull Queue và Cache
- **Testing:** Nên viết tests song song với implementation
- **Documentation:** Update docs sau mỗi task

---

**Xem thêm:**
- [WORKFLOW_ISSUES.md](./WORKFLOW_ISSUES.md) - Chi tiết các vấn đề
- [SYSTEM_WORKFLOWS.md](./SYSTEM_WORKFLOWS.md) - Các luồng hoạt động

---

**Last Updated:** 2024

