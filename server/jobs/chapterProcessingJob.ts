import { Job, JobType, simpleQueue } from './simpleQueue';
import { updateProcessingStatus } from '../services/statusService';
import { extractChapterMetadata } from '../services/extractionService';
import { generateHierarchicalEmbeddings, saveHierarchicalEmbeddings } from '../services/hierarchicalEmbeddingService';
import { db } from '../db/connection';
import { calculateContentHash } from '../utils/contentHash';
import { detectChapterChange } from '../services/changeDetectionService';

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
    
    const change = await detectChapterChange(bookId, chapterNumber, content);
    if (!change.hasChanged) {
      // No change, skip processing
      await updateProcessingStatus(chapterId, 'chapter', 'completed', 100);
      return { status: 'completed', chapterId, cached: true };
    }
    
    // Phase 2: Extract metadata
    await updateProcessingStatus(chapterId, 'chapter', 'processing', 30);
    const extractionResult = await extractChapterMetadata(
      content,
      chapterNumber,
      title
    );
    
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
    const embeddings = await generateHierarchicalEmbeddings(
      content,
      chapterNumber,
      title
    );
    
    await saveHierarchicalEmbeddings(
      chapterId,
      bookId,
      chapterNumber,
      embeddings,
      'all-MiniLM-L6-v2' // ✅ Local embedding model
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


