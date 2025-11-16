import { Router } from 'express';
import {
  getEntityLogs,
  getBookFlowLogs,
  getFlowStatistics,
  clearOldLogs,
  LogStage,
  LogLevel,
} from '../services/dataFlowLogger';

const router = Router();

/**
 * GET /api/logs/books/:book_id
 * Lấy tất cả logs của một book (bao gồm chapters)
 */
router.get('/books/:book_id', async (req, res) => {
  try {
    const { book_id } = req.params;
    const { 
      stage, 
      level, 
      limit = '100', 
      offset = '0' 
    } = req.query;
    
    const logs = await getBookFlowLogs(book_id, {
      stage: stage as LogStage | undefined,
      level: level as LogLevel | undefined,
      limit: parseInt(limit as string),
    });
    
    const statistics = await getFlowStatistics('book', book_id);
    
    return res.json({
      book_id,
      logs,
      statistics,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error getting book logs:', error);
    res.status(500).json({ error: error.message || 'Failed to get book logs' });
  }
});

/**
 * GET /api/logs/chapters/:chapter_id
 * Lấy logs của một chapter
 */
router.get('/chapters/:chapter_id', async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const { 
      stage, 
      level, 
      limit = '100', 
      offset = '0' 
    } = req.query;
    
    const logs = await getEntityLogs('chapter', chapter_id, {
      stage: stage as LogStage | undefined,
      level: level as LogLevel | undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    
    const statistics = await getFlowStatistics('chapter', chapter_id);
    
    return res.json({
      chapter_id,
      logs,
      statistics,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error getting chapter logs:', error);
    res.status(500).json({ error: error.message || 'Failed to get chapter logs' });
  }
});

/**
 * GET /api/logs/system
 * Lấy system logs
 */
router.get('/system', async (req, res) => {
  try {
    const { 
      stage, 
      level, 
      limit = '100', 
      offset = '0' 
    } = req.query;
    
    const logs = await getEntityLogs('system', undefined, {
      stage: stage as LogStage | undefined,
      level: level as LogLevel | undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    
    const statistics = await getFlowStatistics('system');
    
    return res.json({
      logs,
      statistics,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Error getting system logs:', error);
    res.status(500).json({ error: error.message || 'Failed to get system logs' });
  }
});

/**
 * GET /api/logs/flow/:book_id
 * Lấy flow logs theo timeline (chronological order)
 */
router.get('/flow/:book_id', async (req, res) => {
  try {
    const { book_id } = req.params;
    const { limit = '200' } = req.query;
    
    const logs = await getBookFlowLogs(book_id, {
      limit: parseInt(limit as string),
    });
    
    // Group by stage for visualization
    const byStage: Record<string, typeof logs> = {};
    for (const log of logs) {
      if (!byStage[log.stage]) {
        byStage[log.stage] = [];
      }
      byStage[log.stage].push(log);
    }
    
    return res.json({
      book_id,
      timeline: logs,
      by_stage: byStage,
      statistics: await getFlowStatistics('book', book_id),
    });
  } catch (error: any) {
    console.error('Error getting flow logs:', error);
    res.status(500).json({ error: error.message || 'Failed to get flow logs' });
  }
});

/**
 * DELETE /api/logs/cleanup
 * Xóa logs cũ (older than specified days)
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const olderThanDays = parseInt(days as string);
    
    if (isNaN(olderThanDays) || olderThanDays < 1) {
      return res.status(400).json({ error: 'Invalid days parameter' });
    }
    
    const deletedCount = await clearOldLogs(olderThanDays);
    
    return res.json({
      deleted_count: deletedCount,
      older_than_days: olderThanDays,
      message: `Deleted ${deletedCount} log entries older than ${olderThanDays} days`,
    });
  } catch (error: any) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ error: error.message || 'Failed to cleanup logs' });
  }
});

export default router;

