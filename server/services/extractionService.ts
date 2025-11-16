import { GoogleGenAI } from '@google/genai';
import { validateBookContextSchema, validateChapterMetadataSchema, calculateConfidence } from './validationService';
import { truncateTextForAI, normalizeText } from '../utils/textProcessing';
import { retryWithTimeout } from '../utils/timeout';

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
const MIN_CONFIDENCE_THRESHOLD = 0.5; // Minimum confidence to accept extraction
const AI_TIMEOUT_MS = 60000; // 60 seconds timeout for AI calls

export interface ExtractionResult<T> {
  data: T;
  confidence: number;
  errors: string[];
  warnings: string[];
}

export interface BookContext {
  summary: string;
  characters: Array<{
    name: string;
    role: 'main' | 'supporting' | 'minor';
    description: string;
    relationships?: string[];
  }>;
  world_setting: {
    locations?: string[];
    rules?: string[];
    timeline?: string;
  };
  writing_style: {
    tone?: string;
    pov?: 'first' | 'second' | 'third';
    voice?: string;
  };
  story_arc: {
    act1?: string;
    act2?: string;
    act3?: string;
  };
}

export interface ChapterMetadata {
  summary: string;
  key_scenes?: Array<{
    description: string;
    significance?: string;
  }>;
  character_appearances?: Array<{
    name: string;
    actions?: string[];
    dialogue?: string[];
  }>;
  plot_points: {
    events?: string[];
    conflicts?: string[];
    resolutions?: string[];
  };
  writing_notes?: string[];
}

/**
 * Extract book context from full text
 */
export async function extractBookContext(
  fullText: string,
  title: string
): Promise<ExtractionResult<BookContext>> {
  // Normalize and truncate text
  const normalizedText = normalizeText(fullText);
  const truncatedText = truncateTextForAI(normalizedText, 50000);

  const prompt = `Analyze this book and extract structured information in JSON format.

Book Title: ${title}
Full Text: ${truncatedText}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
1. summary: 500-1000 words comprehensive summary
2. characters: Array of all characters with:
   - name (string)
   - role ("main" | "supporting" | "minor")
   - description (string)
   - relationships (optional array of strings)
3. world_setting: Object with:
   - locations (optional array of strings)
   - rules (optional array of strings)
   - timeline (optional string)
4. writing_style: Object with:
   - tone (optional string)
   - pov ("first" | "second" | "third")
   - voice (optional string)
5. story_arc: Object with:
   - act1 (optional string)
   - act2 (optional string)
   - act3 (optional string)

Return ONLY the JSON object, no other text.`;

  try {
    // Retry with timeout
    const result = await retryWithTimeout(
      async () => {
        return await genAI.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
        });
      },
      {
        maxAttempts: 3,
        timeoutMs: AI_TIMEOUT_MS,
        initialDelayMs: 2000,
      }
    );
    
    // @google/genai returns text directly
    const text = (result.text || '').trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    let extractedData: BookContext;
    try {
      extractedData = JSON.parse(jsonMatch[0]) as BookContext;
    } catch (parseError: any) {
      // Fallback: create minimal structure
      console.warn('JSON parse error, using fallback structure:', parseError);
      extractedData = createFallbackBookContext(title, truncatedText);
    }
    
    // Validate schema
    const validation = validateBookContextSchema(extractedData);
    
    // Calculate confidence
    const confidence = calculateConfidence(validation);
    
    // Check confidence threshold
    if (confidence < MIN_CONFIDENCE_THRESHOLD) {
      console.warn(`Low confidence (${confidence.toFixed(2)}) for book context extraction. Using fallback.`);
      // Use fallback if confidence too low
      extractedData = createFallbackBookContext(title, truncatedText);
      const fallbackValidation = validateBookContextSchema(extractedData);
      return {
        data: extractedData,
        confidence: calculateConfidence(fallbackValidation),
        errors: [...validation.errors, 'Low confidence - used fallback'],
        warnings: [...validation.warnings, 'Extraction confidence below threshold'],
      };
    }
    
    return {
      data: extractedData,
      confidence,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  } catch (error: any) {
    console.error('Book context extraction error:', error);
    // Fallback on complete failure
    const fallbackData = createFallbackBookContext(title, truncatedText);
    const fallbackValidation = validateBookContextSchema(fallbackData);
    return {
      data: fallbackData,
      confidence: 0.3, // Low confidence for fallback
      errors: [`Extraction failed: ${error.message}`, 'Used fallback structure'],
      warnings: fallbackValidation.warnings,
    };
  }
}

/**
 * Extract chapter metadata
 */
export async function extractChapterMetadata(
  chapterContent: string,
  chapterNumber: number,
  chapterTitle?: string
): Promise<ExtractionResult<ChapterMetadata>> {
  const prompt = `Analyze this chapter and extract structured information in JSON format.

Chapter: ${chapterNumber} - ${chapterTitle || 'Untitled'}
Content: ${chapterContent}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
1. summary: ~200 words chapter summary
2. key_scenes (optional): Array of important scenes with:
   - description (string)
   - significance (optional string)
3. character_appearances (optional): Array of characters that appear:
   - name (string)
   - actions (optional array of strings)
   - dialogue (optional array of strings)
4. plot_points: Object with:
   - events (optional array of strings)
   - conflicts (optional array of strings)
   - resolutions (optional array of strings)
5. writing_notes (optional): Array of notable writing patterns or suggestions

Return ONLY the JSON object, no other text.`;

  try {
    // Retry with timeout
    const result = await retryWithTimeout(
      async () => {
        return await genAI.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
        });
      },
      {
        maxAttempts: 3,
        timeoutMs: AI_TIMEOUT_MS,
        initialDelayMs: 2000,
      }
    );
    
    // @google/genai returns text directly
    const text = (result.text || '').trim();
    
    // Extract JSON from response
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    let extractedData: ChapterMetadata;
    try {
      extractedData = JSON.parse(jsonMatch[0]) as ChapterMetadata;
    } catch (parseError: any) {
      // Fallback: create minimal structure
      console.warn('JSON parse error, using fallback structure:', parseError);
      extractedData = createFallbackChapterMetadata(chapterContent, chapterNumber, chapterTitle);
    }
    
    // Validate schema
    const validation = validateChapterMetadataSchema(extractedData);
    
    // Calculate confidence
    const confidence = calculateConfidence(validation);
    
    // Check confidence threshold
    if (confidence < MIN_CONFIDENCE_THRESHOLD) {
      console.warn(`Low confidence (${confidence.toFixed(2)}) for chapter metadata extraction. Using fallback.`);
      extractedData = createFallbackChapterMetadata(chapterContent, chapterNumber, chapterTitle);
      const fallbackValidation = validateChapterMetadataSchema(extractedData);
      return {
        data: extractedData,
        confidence: calculateConfidence(fallbackValidation),
        errors: [...validation.errors, 'Low confidence - used fallback'],
        warnings: [...validation.warnings, 'Extraction confidence below threshold'],
      };
    }
    
    return {
      data: extractedData,
      confidence,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  } catch (error: any) {
    console.error('Chapter metadata extraction error:', error);
    // Fallback on complete failure
    const fallbackData = createFallbackChapterMetadata(chapterContent, chapterNumber, chapterTitle);
    const fallbackValidation = validateChapterMetadataSchema(fallbackData);
    return {
      data: fallbackData,
      confidence: 0.3, // Low confidence for fallback
      errors: [`Extraction failed: ${error.message}`, 'Used fallback structure'],
      warnings: fallbackValidation.warnings,
    };
  }
}

/**
 * Create fallback book context when extraction fails
 */
function createFallbackBookContext(title: string, text: string): BookContext {
  const words = text.split(/\s+/);
  const summary = words.slice(0, 500).join(' ') + (words.length > 500 ? '...' : '');
  
  return {
    summary,
    characters: [],
    world_setting: {},
    writing_style: {
      pov: 'third',
    },
    story_arc: {},
  };
}

/**
 * Create fallback chapter metadata when extraction fails
 */
function createFallbackChapterMetadata(
  content: string,
  chapterNumber: number,
  chapterTitle?: string
): ChapterMetadata {
  const words = content.split(/\s+/);
  const summary = words.slice(0, 200).join(' ') + (words.length > 200 ? '...' : '');
  
  return {
    summary: `Chapter ${chapterNumber}${chapterTitle ? `: ${chapterTitle}` : ''}. ${summary}`,
    plot_points: {
      events: [],
      conflicts: [],
      resolutions: [],
    },
  };
}

