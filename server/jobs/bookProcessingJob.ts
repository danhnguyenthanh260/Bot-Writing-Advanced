import { Job, JobType, simpleQueue } from './simpleQueue';
import { updateProcessingStatus } from '../services/statusService';
import { extractBookContext } from '../services/extractionService';
import { createBook, getBookByGoogleDocId } from '../services/bookService';
import { db } from '../db/connection';
import { logDataFlow, logWithTiming, LogStage, LogLevel } from '../services/dataFlowLogger';

export interface BookProcessingJobData {
  bookId?: string;
  googleDocId: string;
  title: string;
  content: string;
}

/**
 * Process book: extract context, process chapters, generate embeddings
 */
async function processBook(job: Job<BookProcessingJobData>): Promise<any> {
  const { bookId, googleDocId, title, content } = job.data;
  
  let finalBookId = bookId;
  
  try {
    // Phase 1: Create/Get book
    await updateProcessingStatus(
      googleDocId,
      'book',
      'processing',
      10,
      undefined
    );
    
    if (!finalBookId) {
      // Check if book exists
      const existing = await getBookByGoogleDocId(googleDocId);
      if (existing) {
        finalBookId = existing.book_id;
      } else {
        // Create new book
        const book = await createBook({
          google_doc_id: googleDocId,
          title,
          total_word_count: content.split(/\s+/).length,
        });
        finalBookId = book.book_id;
      }
    }
    
    // Phase 2: Extract book context
    await updateProcessingStatus(finalBookId, 'book', 'processing', 30);
    
    await logDataFlow('book', LogStage.EXTRACTION, LogLevel.INFO,
      `Starting book context extraction`,
      { entityId: finalBookId });
    
    const extractionResult = await logWithTiming(
      'book',
      LogStage.EXTRACTION,
      LogLevel.INFO,
      `Book context extraction completed`,
      async () => await extractBookContext(content, title),
      {
        entityId: finalBookId,
        metadata: { 
          title,
          wordCount: content.split(/\s+/).length,
          confidence: 0, // Will be updated after extraction
        },
      }
    );
    
    await logDataFlow('book', LogStage.EXTRACTION, LogLevel.INFO,
      `Book context extracted with confidence: ${extractionResult.confidence.toFixed(2)}`,
      { 
        entityId: finalBookId,
        metadata: { 
          confidence: extractionResult.confidence,
          hasErrors: extractionResult.errors.length > 0,
          hasWarnings: extractionResult.warnings.length > 0,
        },
      });
    
    // Save book context
    await logDataFlow('book', LogStage.STORAGE, LogLevel.INFO,
      `Saving book context to database`,
      { entityId: finalBookId });
    
    await logWithTiming(
      'book',
      LogStage.STORAGE,
      LogLevel.INFO,
      `Book context saved`,
      async () => await db.query(
      `INSERT INTO book_contexts (
        book_id, summary, characters, world_setting, 
        writing_style, story_arc, extraction_model_version, extraction_timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (book_id) 
      DO UPDATE SET
        summary = EXCLUDED.summary,
        characters = EXCLUDED.characters,
        world_setting = EXCLUDED.world_setting,
        writing_style = EXCLUDED.writing_style,
        story_arc = EXCLUDED.story_arc,
        extraction_model_version = EXCLUDED.extraction_model_version,
        extraction_timestamp = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP`,
      [
        finalBookId,
        extractionResult.data.summary,
        JSON.stringify(extractionResult.data.characters),
        JSON.stringify(extractionResult.data.world_setting),
        JSON.stringify(extractionResult.data.writing_style),
        JSON.stringify(extractionResult.data.story_arc),
        'gemini-2.0-flash-exp',
      ]
      ),
      { entityId: finalBookId }
    );
    
    // Phase 3: Complete
    await logDataFlow('book', LogStage.INGEST, LogLevel.INFO,
      `Book processing completed successfully`,
      { entityId: finalBookId, metadata: { confidence: extractionResult.confidence } });
    await updateProcessingStatus(finalBookId, 'book', 'completed', 100);
    
    return {
      status: 'completed',
      bookId: finalBookId,
      confidence: extractionResult.confidence,
    };
  } catch (error: any) {
    console.error('Book processing error:', error);
    if (finalBookId) {
      await updateProcessingStatus(
        finalBookId,
        'book',
        'failed',
        -1,
        error.message
      );
    }
    throw error;
  }
}

// Register processor
simpleQueue.process(JobType.BOOK_PROCESSING, processBook);

/**
 * Queue book processing job
 */
export async function queueBookProcessing(
  data: BookProcessingJobData
): Promise<string> {
  return await simpleQueue.add(
    JobType.BOOK_PROCESSING,
    data,
    {
      jobId: data.bookId ? `book-${data.bookId}` : undefined,
      attempts: 3,
    }
  );
}

/**
 * Get book processing job status
 */
export function getBookProcessingStatus(jobId: string) {
  return simpleQueue.getJobStatus(jobId);
}




