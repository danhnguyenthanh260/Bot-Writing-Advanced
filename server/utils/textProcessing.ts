/**
 * Text processing utilities for handling large documents,
 * Unicode, emoji, and encoding issues
 */

const MAX_TEXT_LENGTH = 50000; // Max chars for AI processing
const CHUNK_SIZE_WORDS = 800;
const CHUNK_OVERLAP_WORDS = 100;

/**
 * Normalize text for processing
 * - Unicode normalization (NFC)
 * - Preserve emoji and special characters
 * - Handle encoding issues
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  // Unicode normalization (NFC - Canonical Composition)
  // Combines characters and diacritics into single code points
  let normalized = text.normalize('NFC');
  
  // Preserve line breaks between paragraphs
  // Normalize whitespace within lines
  normalized = normalized
    .replace(/\r\n/g, '\n')  // Windows line endings
    .replace(/\r/g, '\n')    // Old Mac line endings
    .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  
  return normalized;
}

/**
 * Truncate text intelligently for AI processing
 * Tries to cut at sentence boundaries
 */
export function truncateTextForAI(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text;
  
  // Try to cut at sentence boundary
  const truncated = text.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('!\n'),
    truncated.lastIndexOf('?\n')
  );
  
  if (lastSentenceEnd > maxLength * 0.8) {
    // Cut at sentence if we're not losing too much
    return truncated.substring(0, lastSentenceEnd + 1) + '... (truncated)';
  }
  
  // Otherwise cut at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.9) {
    return truncated.substring(0, lastSpace) + '... (truncated)';
  }
  
  return truncated + '... (truncated)';
}

/**
 * Split text into chunks for embedding
 * Preserves sentence boundaries when possible
 */
export interface TextChunk {
  text: string;
  index: number;
  wordCount: number;
  charCount: number;
}

export function chunkText(
  text: string,
  options: {
    maxWords?: number;
    overlapWords?: number;
    preserveSentences?: boolean;
  } = {}
): TextChunk[] {
  const maxWords = options.maxWords || CHUNK_SIZE_WORDS;
  const overlapWords = options.overlapWords || CHUNK_OVERLAP_WORDS;
  const preserveSentences = options.preserveSentences !== false;
  
  const words = text.split(/\s+/);
  const chunks: TextChunk[] = [];
  
  for (let i = 0; i < words.length; i += maxWords - overlapWords) {
    const chunkWords = words.slice(i, i + maxWords);
    let chunkText = chunkWords.join(' ');
    
    // Try to preserve sentence boundaries
    if (preserveSentences && i + maxWords < words.length) {
      // Look for sentence end in last 20% of chunk
      const searchStart = Math.floor(chunkWords.length * 0.8);
      for (let j = chunkWords.length - 1; j >= searchStart; j--) {
        const word = chunkWords[j];
        if (/[.!?]$/.test(word)) {
          chunkText = chunkWords.slice(0, j + 1).join(' ');
          // Adjust i to account for shorter chunk
          i -= (chunkWords.length - j - 1);
          break;
        }
      }
    }
    
    chunks.push({
      text: chunkText,
      index: chunks.length,
      wordCount: chunkText.split(/\s+/).length,
      charCount: chunkText.length,
    });
  }
  
  return chunks;
}

/**
 * Estimate memory usage of text (rough approximation)
 */
export function estimateMemoryUsage(text: string): number {
  // Rough estimate: UTF-16 encoding uses 2 bytes per char
  // Plus object overhead
  return text.length * 2 + 100; // bytes
}

/**
 * Check if text is too large for processing
 */
export function isTextTooLarge(text: string, maxMemoryMB: number = 50): boolean {
  const memoryBytes = estimateMemoryUsage(text);
  const memoryMB = memoryBytes / (1024 * 1024);
  return memoryMB > maxMemoryMB;
}

/**
 * Validate text encoding and detect issues
 */
export interface EncodingValidation {
  valid: boolean;
  issues: string[];
  encoding: string;
}

export function validateEncoding(text: string): EncodingValidation {
  const issues: string[] = [];
  
  // Check for null bytes (common encoding issue)
  if (text.includes('\0')) {
    issues.push('Contains null bytes');
  }
  
  // Check for invalid UTF-8 sequences (if applicable)
  try {
    // Try to encode/decode to check validity
    Buffer.from(text, 'utf8').toString('utf8');
  } catch (error) {
    issues.push('Invalid UTF-8 sequences detected');
  }
  
  // Check for control characters (except common ones)
  const controlCharRegex = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g;
  const controlChars = text.match(controlCharRegex);
  if (controlChars && controlChars.length > 10) {
    issues.push(`Contains ${controlChars.length} control characters`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    encoding: 'UTF-8',
  };
}

/**
 * Clean text for database storage
 * Removes problematic characters while preserving content
 */
export function cleanTextForStorage(text: string): string {
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .normalize('NFC'); // Normalize Unicode
}

