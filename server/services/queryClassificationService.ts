export enum QueryType {
  BOOK_LEVEL = 'book_level',
  CHAPTER_LEVEL = 'chapter_level',
  MIXED = 'mixed',
}

export interface QueryClassification {
  type: QueryType;
  keywords: string[];
  confidence: number;
}

/**
 * Classify query to determine which storage to use
 */
export function classifyQuery(query: string): QueryClassification {
  const queryLower = query.toLowerCase();
  
  // Book-level keywords
  const bookLevelKeywords = [
    'main character', 'overall', 'book', 'story',
    'world', 'setting', 'theme', 'arc',
    'summary', 'characters', 'plot',
    'who is', 'what is the', 'entire',
    'whole story', 'general', 'background',
  ];
  
  // Chapter-level keywords
  const chapterLevelKeywords = [
    'this chapter', 'this scene', 'recent',
    'current', 'now', 'next', 'last',
    'what happens', 'what should',
    'in this', 'in the recent',
    'latest', 'newest', 'just wrote',
  ];
  
  // Check for book-level indicators
  const hasBookLevel = bookLevelKeywords.some(keyword => 
    queryLower.includes(keyword)
  );
  
  // Check for chapter-level indicators
  const hasChapterLevel = chapterLevelKeywords.some(keyword => 
    queryLower.includes(keyword)
  );
  
  // Determine query type
  let type: QueryType;
  let confidence = 0.5;
  
  if (hasBookLevel && hasChapterLevel) {
    type = QueryType.MIXED;
    confidence = 0.9;
  } else if (hasBookLevel) {
    type = QueryType.BOOK_LEVEL;
    confidence = 0.8;
  } else if (hasChapterLevel) {
    type = QueryType.CHAPTER_LEVEL;
    confidence = 0.8;
  } else {
    // Default: use both
    type = QueryType.MIXED;
    confidence = 0.6;
  }
  
  // Extract keywords
  const keywords = extractKeywords(query);
  
  return {
    type,
    keywords,
    confidence,
  };
}

/**
 * Extract keywords from query
 */
export function extractKeywords(query: string): string[] {
  // Simple keyword extraction (can be enhanced with NLP)
  const words = query.toLowerCase().split(/\s+/);
  const stopWords = [
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 
    'what', 'who', 'where', 'when', 'how', 'this', 'that',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'and', 'or', 'but', 'if', 'then', 'so', 'because',
  ];
  
  const keywords = words.filter(word => 
    word.length > 3 && !stopWords.includes(word)
  );
  
  return [...new Set(keywords)]; // Remove duplicates
}











