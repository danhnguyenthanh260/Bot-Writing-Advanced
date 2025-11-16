/**
 * Job Recovery System
 * 
 * Khi server khởi động lại, kiểm tra và queue lại các jobs chưa hoàn thành
 * để đảm bảo dữ liệu được xử lý đầy đủ.
 */

import { db } from '../db/connection.ts';
import { queueBookProcessing } from './bookProcessingJob.ts';
import { queueChapterProcessing } from './chapterProcessingJob.ts';
import { logDataFlow, LogStage, LogLevel } from '../services/dataFlowLogger.ts';

/**
 * Kiểm tra và queue lại các books chưa có context
 */
export async function recoverBookProcessingJobs(): Promise<number> {
  try {
    await logDataFlow('system', LogStage.SYSTEM, LogLevel.INFO,
      'Starting book processing job recovery');

    // Tìm các books chưa có book_contexts
    const result = await db.query(`
      SELECT b.book_id, b.google_doc_id, b.title, b.total_word_count
      FROM books b
      LEFT JOIN book_contexts bc ON b.book_id = bc.book_id
      WHERE bc.book_id IS NULL
      ORDER BY b.created_at DESC
    `);

    let recoveredCount = 0;
    for (const row of result.rows) {
      try {
        // Lấy toàn bộ nội dung từ chapters để tạo book context
        const chaptersResult = await db.query(`
          SELECT content, title, chapter_number
          FROM recent_chapters
          WHERE book_id = $1
          ORDER BY chapter_number ASC
        `, [row.book_id]);

        if (chaptersResult.rows.length === 0) {
          await logDataFlow('book', LogStage.SYSTEM, LogLevel.WARN,
            `Book ${row.book_id} has no chapters, skipping recovery`,
            { entityId: row.book_id });
          continue;
        }

        // Tạo full text từ chapters
        const fullText = chaptersResult.rows
          .map((ch: any) => ch.content)
          .join('\n\n');

        await queueBookProcessing({
          bookId: row.book_id,
          googleDocId: row.google_doc_id,
          title: row.title,
          content: fullText,
        });

        await logDataFlow('book', LogStage.SYSTEM, LogLevel.INFO,
          `Recovered book processing job: ${row.title}`,
          { entityId: row.book_id });

        recoveredCount++;
      } catch (error: any) {
        await logDataFlow('book', LogStage.SYSTEM, LogLevel.ERROR,
          `Failed to recover book processing job: ${error.message}`,
          { entityId: row.book_id, metadata: { error: error.message } });
      }
    }

    await logDataFlow('system', LogStage.SYSTEM, LogLevel.INFO,
      `Book processing recovery completed: ${recoveredCount} jobs recovered`);

    return recoveredCount;
  } catch (error: any) {
    await logDataFlow('system', LogStage.SYSTEM, LogLevel.ERROR,
      `Book processing recovery failed: ${error.message}`,
      { metadata: { error: error.message, stack: error.stack } });
    throw error;
  }
}

/**
 * Kiểm tra và queue lại các chapters chưa có metadata hoặc embeddings
 */
export async function recoverChapterProcessingJobs(): Promise<number> {
  try {
    await logDataFlow('system', LogStage.SYSTEM, LogLevel.INFO,
      'Starting chapter processing job recovery');

    // Tìm các chapters chưa có summary hoặc embedding_vector
    const result = await db.query(`
      SELECT 
        chapter_id, 
        book_id, 
        chapter_number, 
        title, 
        content,
        summary,
        embedding_vector
      FROM recent_chapters
      WHERE summary IS NULL 
         OR embedding_vector IS NULL
         OR (summary IS NOT NULL AND embedding_vector IS NULL)
         OR (summary IS NULL AND embedding_vector IS NOT NULL)
      ORDER BY book_id, chapter_number ASC
    `);

    let recoveredCount = 0;
    for (const row of result.rows) {
      try {
        await queueChapterProcessing({
          chapterId: row.chapter_id,
          bookId: row.book_id,
          chapterNumber: row.chapter_number,
          title: row.title || `Chapter ${row.chapter_number}`,
          content: row.content,
        });

        await logDataFlow('chapter', LogStage.SYSTEM, LogLevel.INFO,
          `Recovered chapter processing job: Chapter ${row.chapter_number}`,
          { entityId: row.chapter_id, metadata: { chapterNumber: row.chapter_number } });

        recoveredCount++;
      } catch (error: any) {
        await logDataFlow('chapter', LogStage.SYSTEM, LogLevel.ERROR,
          `Failed to recover chapter processing job: ${error.message}`,
          { entityId: row.chapter_id, metadata: { error: error.message } });
      }
    }

    await logDataFlow('system', LogStage.SYSTEM, LogLevel.INFO,
      `Chapter processing recovery completed: ${recoveredCount} jobs recovered`);

    return recoveredCount;
  } catch (error: any) {
    await logDataFlow('system', LogStage.SYSTEM, LogLevel.ERROR,
      `Chapter processing recovery failed: ${error.message}`,
      { metadata: { error: error.message, stack: error.stack } });
    throw error;
  }
}

/**
 * Chạy recovery cho tất cả jobs
 */
export async function recoverAllJobs(): Promise<{
  books: number;
  chapters: number;
}> {
  try {
    await logDataFlow('system', LogStage.SYSTEM, LogLevel.INFO,
      'Starting full job recovery on server startup');

    const [bookCount, chapterCount] = await Promise.all([
      recoverBookProcessingJobs(),
      recoverChapterProcessingJobs(),
    ]);

    await logDataFlow('system', LogStage.SYSTEM, LogLevel.INFO,
      `Job recovery completed: ${bookCount} books, ${chapterCount} chapters`,
      { metadata: { books: bookCount, chapters: chapterCount } });

    return {
      books: bookCount,
      chapters: chapterCount,
    };
  } catch (error: any) {
    await logDataFlow('system', LogStage.SYSTEM, LogLevel.ERROR,
      `Full job recovery failed: ${error.message}`,
      { metadata: { error: error.message, stack: error.stack } });
    throw error;
  }
}

