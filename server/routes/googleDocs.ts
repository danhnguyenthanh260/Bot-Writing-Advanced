import { Router } from 'express';
import googleDocsService, { convertGoogleDocToWorkProfile } from '../../services/googleDocsService.ts';
import { workProfilesStore } from '../storage/workProfilesStore.ts';
import { createBook, getBookByGoogleDocId, updateBook } from '../services/bookService.ts';
import { queueBookProcessing } from '../jobs/bookProcessingJob.ts';
import { queueChapterProcessing } from '../jobs/chapterProcessingJob.ts';
import { db } from '../db/connection.ts';
import { calculateContentHash } from '../utils/contentHash.ts';
import { logDataFlow, LogStage, LogLevel } from '../services/dataFlowLogger.ts';
import type { GoogleDocIngestPayload } from '../types.ts';

const router = Router();

router.post('/ingest', async (req, res) => {
  const payload = req.body as GoogleDocIngestPayload;
  const identifier = payload.url ?? payload.docId;

  if (!identifier) {
    return res.status(400).json({ error: 'Vui lòng gửi url hoặc docId của tài liệu.' });
  }

  try {
    // ✅ STEP 1: Lấy document từ Google Docs API
    await logDataFlow('system', LogStage.INGEST, LogLevel.INFO, 
      `Starting Google Doc ingestion: ${identifier}`);
    
    const { doc } = await googleDocsService.getStructuredContent(identifier);
    
    await logDataFlow('book', LogStage.INGEST, LogLevel.INFO,
      `Document loaded: ${doc.title} (${doc.wordCount} words, ${doc.outline.length} sections)`,
      { entityId: doc.docId, metadata: { wordCount: doc.wordCount, sections: doc.outline.length } });
    
    // ✅ STEP 2: Convert thành workProfile (frontend format)
    const workProfile = convertGoogleDocToWorkProfile(
      doc,
      payload.url ?? `https://docs.google.com/document/d/${doc.docId}`
    );

    // ✅ STEP 3: Tạo/Cập nhật book trong database
    let book = await getBookByGoogleDocId(doc.docId);
    if (!book) {
      await logDataFlow('book', LogStage.STORAGE, LogLevel.INFO,
        `Creating new book: ${doc.title}`,
        { entityId: doc.docId });
      
      book = await createBook({
        google_doc_id: doc.docId,
        title: doc.title,
        total_word_count: doc.wordCount,
        total_chapters: doc.outline.length,
      });
      
      await logDataFlow('book', LogStage.STORAGE, LogLevel.INFO,
        `Book created: ${book.book_id}`,
        { entityId: book.book_id });
    } else {
      await logDataFlow('book', LogStage.STORAGE, LogLevel.INFO,
        `Updating existing book: ${book.book_id}`,
        { entityId: book.book_id });
      
      // Update nếu đã tồn tại
      await updateBook(book.book_id, {
        title: doc.title,
        total_word_count: doc.wordCount,
        total_chapters: doc.outline.length,
      });
    }

    // ✅ STEP 4: Tạo chapter records (raw content, chưa process)
    // Sử dụng transaction để đảm bảo atomicity
    const { withTransaction } = await import('../utils/dbTransaction');
    const { cleanTextForStorage } = await import('../utils/textProcessing');
    
    const chapterIds: string[] = [];
    await logDataFlow('book', LogStage.STORAGE, LogLevel.INFO,
      `Storing ${doc.outline.length} chapters`,
      { entityId: book.book_id, metadata: { chapterCount: doc.outline.length } });
    
    await withTransaction(async (client) => {
      for (let i = 0; i < doc.outline.length; i++) {
        const section = doc.outline[i];
        const chapterContent = section.paragraphs.join('\n\n');
        const cleanedContent = cleanTextForStorage(chapterContent);
        const contentHash = calculateContentHash(cleanedContent);
        
        // Invalidate old cache if content changed
        const existingChapter = await client.query(
          `SELECT chapter_id, content_hash FROM recent_chapters
           WHERE book_id = $1 AND chapter_number = $2`,
          [book.book_id, i + 1]
        );
        
        if (existingChapter.rows.length > 0) {
          const oldHash = existingChapter.rows[0].content_hash;
          if (oldHash && oldHash !== contentHash) {
            // Content changed - invalidate cache
            await logDataFlow('chapter', LogStage.CACHE, LogLevel.INFO,
              `Content changed, invalidating cache for chapter ${i + 1}`,
              { entityId: existingChapter.rows[0].chapter_id });
            
            const { invalidateCacheEntries } = await import('../services/embeddingCacheService');
            await invalidateCacheEntries([oldHash]);
          }
        }
        
        const chapterResult = await client.query(
          `INSERT INTO recent_chapters 
           (chapter_id, book_id, chapter_number, title, content, content_hash)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
           ON CONFLICT (book_id, chapter_number)
           DO UPDATE SET 
             content = EXCLUDED.content, 
             content_hash = EXCLUDED.content_hash,
             title = COALESCE(EXCLUDED.title, recent_chapters.title),
             updated_at = CURRENT_TIMESTAMP
           RETURNING chapter_id`,
          [book.book_id, i + 1, section.heading, cleanedContent, contentHash]
        );
        
        const chapterId = chapterResult.rows[0].chapter_id;
        chapterIds.push(chapterId);
        
        await logDataFlow('chapter', LogStage.STORAGE, LogLevel.INFO,
          `Chapter ${i + 1} stored: ${section.heading || 'Untitled'}`,
          { entityId: chapterId, metadata: { chapterNumber: i + 1, title: section.heading } });
      }
    });

    // ✅ STEP 5: Queue processing jobs (async - background)
    await logDataFlow('book', LogStage.INGEST, LogLevel.INFO,
      `Queueing book processing job`,
      { entityId: book.book_id });
    
    const bookJobId = await queueBookProcessing({
      bookId: book.book_id,
      googleDocId: doc.docId,
      title: doc.title,
      content: doc.plainText,
    });
    
    await logDataFlow('book', LogStage.INGEST, LogLevel.INFO,
      `Book processing job queued: ${bookJobId}`,
      { entityId: book.book_id, metadata: { jobId: bookJobId } });

    const chapterJobIds: string[] = [];
    for (let i = 0; i < chapterIds.length; i++) {
      const section = doc.outline[i];
      const chapterContent = section.paragraphs.join('\n\n');
      
      const chapterJobId = await queueChapterProcessing({
        chapterId: chapterIds[i],
        bookId: book.book_id,
        chapterNumber: i + 1,
        title: section.heading,
        content: chapterContent,
      });
      
      chapterJobIds.push(chapterJobId);
      
      await logDataFlow('chapter', LogStage.INGEST, LogLevel.INFO,
        `Chapter ${i + 1} processing job queued: ${chapterJobId}`,
        { entityId: chapterIds[i], metadata: { jobId: chapterJobId, chapterNumber: i + 1 } });
    }

    // ✅ STEP 6: Lưu vào workProfilesStore (tạm thời cho frontend)
    const nowIso = new Date().toISOString();
    workProfilesStore.upsert({
      ...workProfile,
      bookId: book.book_id, // ✅ Thêm bookId
      createdAt: nowIso,
      updatedAt: nowIso,
      document: doc,
    });

    // ✅ STEP 7: Trả về response
    return res.json({
      docId: doc.docId,
      document: doc,
      workProfile: {
        ...workProfile,
        bookId: book.book_id, // ✅ Thêm bookId
      },
      book_id: book.book_id, // ✅ Trả về book_id
      processing: {
        book_job_id: bookJobId,
        chapter_job_ids: chapterJobIds,
        status: 'processing',
      },
    });
  } catch (error: any) {
    console.error('Failed to ingest Google Doc:', error);
    const status = error?.code ?? error?.response?.status;
    if (status === 403 || status === 401) {
      return res.status(403).json({ error: 'Google Docs từ chối truy cập. Hãy kiểm tra quyền chia sẻ hoặc token OAuth.' });
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu Google Docs. Hãy kiểm tra lại liên kết.' });
    }
    return res.status(500).json({ error: 'Lỗi không xác định khi kết nối với Google Docs.' });
  }
});

export default router;