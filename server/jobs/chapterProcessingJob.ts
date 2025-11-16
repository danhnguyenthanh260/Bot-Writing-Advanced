import { Job, JobType, simpleQueue } from './simpleQueue';
import { updateProcessingStatus } from '../services/statusService';
import { extractChapterMetadata } from '../services/extractionService';
import { generateHierarchicalEmbeddings, saveHierarchicalEmbeddings } from '../services/hierarchicalEmbeddingService';
import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';
import { detectChapterChange } from '../services/changeDetectionService';
import { logDataFlow, logWithTiming, LogStage, LogLevel } from '../services/dataFlowLogger';

export interface ChapterProcessingJobData {
  chapterId: string;
  bookId: string;
  chapterNumber: number;
  title?: string;
  content: string;
}

/**
 * Process chapter: extract metadata, generate embeddings
 */
async function processChapter(job: Job<ChapterProcessingJobData>): Promise<any> {
  const { chapterId, bookId, chapterNumber, title, content } = job.data;
  
  try {
    // Phase 1: Check if content changed
    await updateProcessingStatus(chapterId, 'chapter', 'processing', 10);
    
    await logDataFlow('chapter', LogStage.VALIDATION, LogLevel.INFO,
      `Checking for content changes`,
      { entityId: chapterId, metadata: { chapterNumber, bookId } });
    
    const change = await detectChapterChange(bookId, chapterNumber, content);
    if (!change.hasChanged) {
      // No change, skip processing
      await logDataFlow('chapter', LogStage.VALIDATION, LogLevel.INFO,
        `No content changes detected, skipping processing`,
        { entityId: chapterId, metadata: { cached: true } });
      
      await updateProcessingStatus(chapterId, 'chapter', 'completed', 100);
      return { status: 'completed', chapterId, cached: true };
    }
    
    await logDataFlow('chapter', LogStage.VALIDATION, LogLevel.INFO,
      `Content changed, proceeding with processing`,
      { entityId: chapterId });
    
    // Phase 2: Extract metadata
    await updateProcessingStatus(chapterId, 'chapter', 'processing', 30);
    
    await logDataFlow('chapter', LogStage.EXTRACTION, LogLevel.INFO,
      `Starting chapter metadata extraction`,
      { entityId: chapterId });
    
    const extractionResult = await logWithTiming(
      'chapter',
      LogStage.EXTRACTION,
      LogLevel.INFO,
      `Chapter metadata extraction completed`,
      async () => await extractChapterMetadata(content, chapterNumber, title),
      {
        entityId: chapterId,
        metadata: { chapterNumber, title, wordCount: content.split(/\s+/).length },
      }
    );
    
    await logDataFlow('chapter', LogStage.EXTRACTION, LogLevel.INFO,
      `Chapter metadata extracted with confidence: ${extractionResult.confidence.toFixed(2)}`,
      { 
        entityId: chapterId,
        metadata: { 
          confidence: extractionResult.confidence,
          hasErrors: extractionResult.errors.length > 0,
        },
      });
    
    // Update chapter with metadata
    const contentHash = calculateContentHash(content);
    await db.query(
      `UPDATE recent_chapters
       SET 
         title = COALESCE($1, title),
         content = $2,
         summary = $3,
         key_scenes = $4,
         character_appearances = $5,
         plot_points = $6,
         writing_notes = $7,
         content_hash = $8,
         extraction_model_version = $9,
         extraction_timestamp = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE chapter_id = $10`,
      [
        title || null,
        content,
        extractionResult.data.summary,
        JSON.stringify(extractionResult.data.key_scenes || []),
        JSON.stringify(extractionResult.data.character_appearances || []),
        JSON.stringify(extractionResult.data.plot_points || {}),
        JSON.stringify(extractionResult.data.writing_notes || []),
        contentHash,
        'gemini-2.0-flash-exp',
        chapterId,
      ]
    );
    
    // Phase 3: Generate embeddings
    await updateProcessingStatus(chapterId, 'chapter', 'processing', 70);
    
    await logDataFlow('chapter', LogStage.EMBEDDING, LogLevel.INFO,
      `Starting embedding generation`,
      { entityId: chapterId });
    
    const embeddings = await logWithTiming(
      'chapter',
      LogStage.EMBEDDING,
      LogLevel.INFO,
      `Embeddings generated`,
      async () => await generateHierarchicalEmbeddings(content, chapterNumber, title),
      {
        entityId: chapterId,
        metadata: { chapterNumber },
      }
    );
    
    await logDataFlow('chapter', LogStage.EMBEDDING, LogLevel.INFO,
      `Generated ${embeddings.chunkEmbeddings.length} chunk embeddings`,
      { entityId: chapterId, metadata: { chunkCount: embeddings.chunkEmbeddings.length } });
    
    await logWithTiming(
      'chapter',
      LogStage.STORAGE,
      LogLevel.INFO,
      `Embeddings saved to database`,
      async () => await saveHierarchicalEmbeddings(
        chapterId,
        bookId,
        chapterNumber,
        embeddings,
        'all-MiniLM-L6-v2'
      ),
      { entityId: chapterId }
    );
    
    // Phase 4: Complete
    await updateProcessingStatus(chapterId, 'chapter', 'completed', 100);
    
    return {
      status: 'completed',
      chapterId,
      confidence: extractionResult.confidence,
    };
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
}

// Register processor
simpleQueue.process(JobType.CHAPTER_PROCESSING, processChapter);

/**
 * Queue chapter processing job
 */
export async function queueChapterProcessing(
  data: ChapterProcessingJobData
): Promise<string> {
  return await simpleQueue.add(
    JobType.CHAPTER_PROCESSING,
    data,
    {
      jobId: `chapter-${data.chapterId}`,
      attempts: 3,
    }
  );
}

/**
 * Get chapter processing job status
 */
export function getChapterProcessingStatus(jobId: string) {
  return simpleQueue.getJobStatus(jobId);
}




