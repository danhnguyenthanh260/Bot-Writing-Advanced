import { Router } from 'express';
import { getContextForQuery } from '../services/contextRetrievalService.ts';

const router = Router();

/**
 * GET /api/context/:bookId
 * Get context for a query related to a book
 */
router.get('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { query } = req.query;
    
    if (!bookId) {
      return res.status(400).json({ error: 'Missing bookId' });
    }
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid query parameter' });
    }
    
    const context = await getContextForQuery(bookId, query);
    
    res.json(context);
  } catch (error: any) {
    console.error('Error getting context:', error);
    res.status(500).json({ error: error.message || 'Failed to get context' });
  }
});

export default router;

