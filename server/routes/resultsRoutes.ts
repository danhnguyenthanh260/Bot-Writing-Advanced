import { Router } from 'express';
import { db } from '../db/connection';
import { getBookById } from '../services/bookService';

const router = Router();

/**
 * GET /api/results/books/:book_id
 * Lấy tất cả kết quả đã xử lý của một book
 */
router.get('/books/:book_id', async (req, res) => {
  try {
    const { book_id } = req.params;
    
    // 1. Lấy thông tin book
    const book = await getBookById(book_id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // 2. Lấy book context (summary, characters, world_setting, etc.)
    const bookContextResult = await db.query(
      `SELECT 
        summary,
        characters,
        world_setting,
        writing_style,
        story_arc,
        metadata,
        extraction_model_version,
        extraction_timestamp,
        created_at,
        updated_at
       FROM book_contexts
       WHERE book_id = $1`,
      [book_id]
    );
    
    const bookContext = bookContextResult.rows[0] || null;
    
    // 3. Lấy tất cả chapters với metadata đã xử lý
    const chaptersResult = await db.query(
      `SELECT 
        chapter_id,
        chapter_number,
        title,
        content,
        summary,
        key_scenes,
        character_appearances,
        plot_points,
        writing_notes,
        content_hash,
        embedding_vector IS NOT NULL as has_embedding,
        embedding_version,
        embedding_timestamp,
        extraction_model_version,
        extraction_timestamp,
        created_at,
        updated_at
       FROM recent_chapters
       WHERE book_id = $1
       ORDER BY chapter_number ASC`,
      [book_id]
    );
    
    // 4. Lấy số lượng chunks cho mỗi chapter
    const chaptersWithChunks = await Promise.all(
      chaptersResult.rows.map(async (chapter) => {
        const chunksResult = await db.query(
          `SELECT 
            chunk_id,
            chunk_index,
            chunk_text,
            word_count,
            chunk_embedding IS NOT NULL as has_embedding
           FROM chapter_chunks
           WHERE chapter_id = $1
           ORDER BY chunk_index ASC`,
          [chapter.chapter_id]
        );
        
        return {
          ...chapter,
          chunks: chunksResult.rows,
          chunks_count: chunksResult.rows.length,
        };
      })
    );
    
    // 5. Lấy processing status
    const statusResult = await db.query(
      `SELECT 
        status,
        progress,
        started_at,
        completed_at,
        error
       FROM processing_status
       WHERE entity_type = 'book' AND entity_id = $1
       ORDER BY started_at DESC
       LIMIT 1`,
      [book_id]
    );
    
    const processingStatus = statusResult.rows[0] || {
      status: 'pending',
      progress: 0,
    };
    
    // 6. Tính toán tổng số chapters đã xử lý
    const processedChapters = chaptersWithChunks.filter(
      ch => ch.extraction_timestamp !== null
    ).length;
    
    const chaptersWithEmbeddings = chaptersWithChunks.filter(
      ch => ch.has_embedding
    ).length;
    
    return res.json({
      book: {
        ...book,
        processing_status: processingStatus,
      },
      book_context: bookContext,
      chapters: chaptersWithChunks,
      statistics: {
        total_chapters: chaptersWithChunks.length,
        processed_chapters: processedChapters,
        chapters_with_embeddings: chaptersWithEmbeddings,
        has_book_context: bookContext !== null,
        processing_complete: processingStatus.status === 'completed',
      },
    });
  } catch (error: any) {
    console.error('Error getting book results:', error);
    res.status(500).json({ error: error.message || 'Failed to get book results' });
  }
});

/**
 * GET /api/results/books/:book_id/summary
 * Lấy summary ngắn gọn của kết quả xử lý
 */
router.get('/books/:book_id/summary', async (req, res) => {
  try {
    const { book_id } = req.params;
    
    const book = await getBookById(book_id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Lấy book context summary
    const bookContextResult = await db.query(
      `SELECT summary, extraction_timestamp
       FROM book_contexts
       WHERE book_id = $1`,
      [book_id]
    );
    
    // Lấy chapters summary
    const chaptersResult = await db.query(
      `SELECT 
        chapter_number,
        title,
        summary,
        extraction_timestamp IS NOT NULL as is_processed,
        embedding_vector IS NOT NULL as has_embedding
       FROM recent_chapters
       WHERE book_id = $1
       ORDER BY chapter_number ASC`,
      [book_id]
    );
    
    // Processing status
    const statusResult = await db.query(
      `SELECT status, progress, error
       FROM processing_status
       WHERE entity_type = 'book' AND entity_id = $1
       ORDER BY started_at DESC
       LIMIT 1`,
      [book_id]
    );
    
    return res.json({
      book: {
        book_id: book.book_id,
        title: book.title,
        total_chapters: book.total_chapters,
        total_word_count: book.total_word_count,
      },
      book_context: bookContextResult.rows[0] ? {
        summary: bookContextResult.rows[0].summary,
        extracted_at: bookContextResult.rows[0].extraction_timestamp,
      } : null,
      chapters: chaptersResult.rows.map(ch => ({
        chapter_number: ch.chapter_number,
        title: ch.title,
        summary: ch.summary,
        is_processed: ch.is_processed,
        has_embedding: ch.has_embedding,
      })),
      processing: statusResult.rows[0] || {
        status: 'pending',
        progress: 0,
      },
    });
  } catch (error: any) {
    console.error('Error getting book summary:', error);
    res.status(500).json({ error: error.message || 'Failed to get book summary' });
  }
});

/**
 * GET /api/results/chapters/:chapter_id
 * Lấy kết quả đã xử lý của một chapter cụ thể
 */
router.get('/chapters/:chapter_id', async (req, res) => {
  try {
    const { chapter_id } = req.params;
    
    // Lấy chapter với metadata
    const chapterResult = await db.query(
      `SELECT 
        c.*,
        b.book_id,
        b.title as book_title,
        c.embedding_vector IS NOT NULL as has_embedding
       FROM recent_chapters c
       INNER JOIN books b ON c.book_id = b.book_id
       WHERE c.chapter_id = $1`,
      [chapter_id]
    );
    
    if (chapterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    const chapter = chapterResult.rows[0];
    
    // Lấy chunks
    const chunksResult = await db.query(
      `SELECT 
        chunk_id,
        chunk_index,
        chunk_text,
        word_count,
        chunk_embedding IS NOT NULL as has_embedding
       FROM chapter_chunks
       WHERE chapter_id = $1
       ORDER BY chunk_index ASC`,
      [chapter_id]
    );
    
    // Processing status
    const statusResult = await db.query(
      `SELECT status, progress, error, started_at, completed_at
       FROM processing_status
       WHERE entity_type = 'chapter' AND entity_id = $1
       ORDER BY started_at DESC
       LIMIT 1`,
      [chapter_id]
    );
    
    return res.json({
      chapter: {
        chapter_id: chapter.chapter_id,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        content: chapter.content,
        summary: chapter.summary,
        key_scenes: chapter.key_scenes,
        character_appearances: chapter.character_appearances,
        plot_points: chapter.plot_points,
        writing_notes: chapter.writing_notes,
        has_embedding: chapter.has_embedding,
        embedding_version: chapter.embedding_version,
        extraction_model_version: chapter.extraction_model_version,
        extraction_timestamp: chapter.extraction_timestamp,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at,
      },
      book: {
        book_id: chapter.book_id,
        book_title: chapter.book_title,
      },
      chunks: chunksResult.rows,
      processing: statusResult.rows[0] || {
        status: 'pending',
        progress: 0,
      },
    });
  } catch (error: any) {
    console.error('Error getting chapter results:', error);
    res.status(500).json({ error: error.message || 'Failed to get chapter results' });
  }
});

export default router;

