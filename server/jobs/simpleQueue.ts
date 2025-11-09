/**
 * Simple in-memory job queue
 * Note: For production, replace with Bull/BullMQ + Redis
 */

export enum JobType {
  BOOK_PROCESSING = 'book-processing',
  CHAPTER_PROCESSING = 'chapter-processing',
  EMBEDDING_GENERATION = 'embedding-generation',
  BOOK_CONTEXT_EXTRACTION = 'book-context-extraction',
}

export interface Job<T = any> {
  id: string;
  type: JobType;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
}

type JobProcessor<T = any> = (job: Job<T>) => Promise<any>;

class SimpleQueue {
  private jobs: Map<string, Job> = new Map();
  private processors: Map<JobType, JobProcessor[]> = new Map();
  private processing: Set<string> = new Set();
  private intervalId?: NodeJS.Timeout;

  constructor() {
    // Start processing loop
    this.startProcessing();
  }

  /**
   * Add job to queue
   */
  async add<T>(
    type: JobType,
    data: T,
    options: {
      jobId?: string;
      priority?: number;
      attempts?: number;
      delay?: number;
    } = {}
  ): Promise<string> {
    const jobId = options.jobId || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job<T> = {
      id: jobId,
      type,
      data,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.attempts || 3,
    };
    
    this.jobs.set(jobId, job);
    
    // Process immediately if no delay
    if (!options.delay) {
      this.processNext();
    } else {
      setTimeout(() => this.processNext(), options.delay);
    }
    
    return jobId;
  }

  /**
   * Register processor for job type
   */
  process<T>(type: JobType, processor: JobProcessor<T>): void {
    if (!this.processors.has(type)) {
      this.processors.set(type, []);
    }
    this.processors.get(type)!.push(processor);
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): {
    id: string;
    status: string;
    progress: number;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
  } | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Start processing loop
   */
  private startProcessing(): void {
    // Process every 1 second
    this.intervalId = setInterval(() => {
      this.processNext();
    }, 1000);
  }

  /**
   * Process next pending job
   */
  private async processNext(): Promise<void> {
    // Find pending job
    const pendingJob = Array.from(this.jobs.values()).find(
      job => job.status === 'pending' && !this.processing.has(job.id)
    );
    
    if (!pendingJob) return;
    
    const processors = this.processors.get(pendingJob.type);
    if (!processors || processors.length === 0) {
      console.warn(`No processor registered for job type: ${pendingJob.type}`);
      return;
    }
    
    this.processing.add(pendingJob.id);
    pendingJob.status = 'processing';
    pendingJob.startedAt = new Date();
    
    // Use first processor
    const processor = processors[0];
    
    try {
      const result = await processor(pendingJob);
      pendingJob.status = 'completed';
      pendingJob.progress = 100;
      pendingJob.completedAt = new Date();
    } catch (error: any) {
      pendingJob.attempts++;
      
      if (pendingJob.attempts >= pendingJob.maxAttempts) {
        pendingJob.status = 'failed';
        pendingJob.error = error.message;
        pendingJob.completedAt = new Date();
      } else {
        // Retry
        pendingJob.status = 'pending';
        pendingJob.startedAt = undefined;
        // Exponential backoff
        const delay = Math.pow(2, pendingJob.attempts) * 1000;
        setTimeout(() => {
          this.processing.delete(pendingJob.id);
        }, delay);
        return;
      }
    } finally {
      this.processing.delete(pendingJob.id);
    }
  }
  
  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = Math.max(0, Math.min(100, progress));
    }
  }

  /**
   * Stop processing
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Singleton instance
export const simpleQueue = new SimpleQueue();

