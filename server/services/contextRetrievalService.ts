import { db } from '../db/connection';
import { QueryType, classifyQuery } from './queryClassificationService';
import type { SearchResult } from './semanticSearchService';
import { semanticSearch } from './semanticSearchService';

export interface BookContext {
  book_id: string;
  summary: string;
  characters: any[];
  world_setting: any;
  writing_style: any;
  story_arc: any;
  metadata: any;
}

export interface ChapterContext {
  chapter_id: string;
  chapter_number: number;
  title: string;
  content: string;
  summary: string;
  key_scenes: any[];
  character_appearances: any[];
  plot_points: any;
  embedding_vector?: number[];
  updated_at: Date;
}

export interface AgentContext {
  book_context?: BookContext;
  recent_chapters?: ChapterContext[];
  semantic_results?: SearchResult[];
  query_type: QueryType;
}

/**
 * Get book-level context
 */
export async function getBookLevelContext(
  bookId: string
): Promise<BookContext | null> {
  const result = await db.query(
    `SELECT bc.*, b.title
     FROM book_contexts bc
     JOIN books b ON bc.book_id = b.book_id
     WHERE bc.book_id = $1`,
    [bookId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    book_id: row.book_id,
    summary: row.summary || '',
    characters: row.characters || [],
    world_setting: row.world_setting || {},
    writing_style: row.writing_style || {},
    story_arc: row.story_arc || {},
    metadata: row.metadata || {},
  };
}

/**
 * Get chapter-level context (most recent)
 */
export async function getChapterLevelContext(
  bookId: string,
  limit: number = 5
): Promise<ChapterContext[]> {
  const result = await db.query(
    `SELECT 
      chapter_id,
      chapter_number,
      title,
      content,
      summary,
      key_scenes,
      character_appearances,
      plot_points,
      updated_at
     FROM recent_chapters 
     WHERE book_id = $1 
     ORDER BY updated_at DESC 
     LIMIT $2`,
    [bookId, limit]
  );
  
  return result.rows.map(row => ({
    chapter_id: row.chapter_id,
    chapter_number: row.chapter_number,
    title: row.title || '',
    content: row.content || '',
    summary: row.summary || '',
    key_scenes: row.key_scenes || [],
    character_appearances: row.character_appearances || [],
    plot_points: row.plot_points || {},
    updated_at: row.updated_at,
  }));
}

/**
 * Get context for agent query
 */
export async function getContextForQuery(
  bookId: string,
  query: string
): Promise<AgentContext> {
  // Classify query
  const classification = classifyQuery(query);
  
  let bookContext: BookContext | null = null;
  let recentChapters: ChapterContext[] = [];
  let semanticResults: SearchResult[] = [];
  
  // Route to appropriate storage(s)
  switch (classification.type) {
    case QueryType.BOOK_LEVEL:
      // Only need book context
      bookContext = await getBookLevelContext(bookId);
      break;
      
    case QueryType.CHAPTER_LEVEL:
      // Only need recent chapters
      recentChapters = await getChapterLevelContext(bookId);
      // + semantic search if query provided
      try {
        semanticResults = await semanticSearch(query, bookId, 5);
      } catch (error) {
        console.warn('Semantic search failed, continuing without it', error);
      }
      break;
      
    case QueryType.MIXED:
    default:
      // Need both
      [bookContext, recentChapters] = await Promise.all([
        getBookLevelContext(bookId),
        getChapterLevelContext(bookId),
      ]);
      // + semantic search
      try {
        semanticResults = await semanticSearch(query, bookId, 5);
      } catch (error) {
        console.warn('Semantic search failed, continuing without it', error);
      }
      break;
  }
  
  return {
    book_context: bookContext || undefined,
    recent_chapters: recentChapters.length > 0 ? recentChapters : undefined,
    semantic_results: semanticResults.length > 0 ? semanticResults : undefined,
    query_type: classification.type,
  };
}

