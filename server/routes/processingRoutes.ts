import { Router } from 'express';
import { queueBookProcessing, getBookProcessingStatus } from '../jobs/bookProcessingJob.ts';
import { queueChapterProcessing, getChapterProcessingStatus } from '../jobs/chapterProcessingJob.ts';
import { getProcessingStatus, getBookProcessingStatuses } from '../services/statusService.ts';
import { createBook } from '../services/bookService.ts';

const router = Router();

/**
 * POST /api/processing/books
 * Queue book processing
 */
router.post('/books', async (req, res) => {
  try {
    const { google_doc_id, title, content } = req.body;
    
    if (!google_doc_id || !title || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: google_doc_id, title, content' 
      });
    }
    
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
    console.error('Error queueing book processing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/processing/books/:book_id/status
 * Get processing status for a book
 */
router.get('/books/:book_id/status', async (req, res) => {
  try {
    const { book_id } = req.params;
    
    const statuses = await getBookProcessingStatuses(book_id);
    
    // ✅ Return simplified status for frontend polling
    const overallStatus = statuses.book?.status || 'pending';
    const allChaptersCompleted = statuses.chapters.every(
      ch => ch.status.status === 'completed' || ch.status.status === 'failed'
    );
    
    const finalStatus = (overallStatus === 'completed' && allChaptersCompleted) 
      ? 'completed' 
      : (overallStatus === 'failed' || statuses.chapters.some(ch => ch.status.status === 'failed'))
        ? 'failed'
        : 'processing';
    
    res.json({
      status: finalStatus,
      book: statuses.book,
      chapters: statuses.chapters,
      progress: statuses.book?.progress || 0,
    });
  } catch (error: any) {
    console.error('Error getting book status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/processing/status/:entity_type/:entity_id
 * Get processing status for any entity
 */
router.get('/status/:entity_type/:entity_id', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    
    if (entity_type !== 'book' && entity_type !== 'chapter') {
      return res.status(400).json({ error: 'Invalid entity_type' });
    }
    
    const status = await getProcessingStatus(entity_id, entity_type);
    
    if (!status) {
      return res.json({
        status: 'pending',
        progress: 0,
      });
    }
    
    res.json(status);
  } catch (error: any) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/processing/jobs/:job_id
 * Get job status
 */
router.get('/jobs/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;
    
    // Try book processing first
    let jobStatus = getBookProcessingStatus(job_id);
    
    // Try chapter processing if not found
    if (!jobStatus) {
      jobStatus = getChapterProcessingStatus(job_id);
    }
    
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(jobStatus);
  } catch (error: any) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


