# Phase 2: Data Normalization
**Priority:** HIGH  
**Timeline:** Week 3-4  
**Prerequisites:** Phase 1 Complete

---

## 📋 Overview

Phase 2 implements data normalization pipeline:
- LLM extraction services (book context, chapter metadata)
- Embedding generation services
- Validation & quality checks
- Schema validation layer
- Confidence scoring

---

## ✅ Implementation Checklist

### Week 3: LLM Extraction Services

#### Day 11-12: Book Context Extraction
- [ ] Setup Gemini API integration
- [ ] Create extraction prompt templates
- [ ] Implement book context extraction service
- [ ] Add schema validation
- [ ] Add confidence scoring

#### Day 13-14: Chapter Metadata Extraction
- [ ] Implement chapter metadata extraction
- [ ] Add chunking logic for long chapters
- [ ] Add structured output parsing
- [ ] Add error handling & retries

#### Day 15: Validation Layer
- [ ] Implement schema validation
- [ ] Add confidence scoring algorithm
- [ ] Add manual review flagging
- [ ] Add validation tests

### Week 4: Embedding Services

#### Day 16-17: Vertex AI Integration
- [ ] Setup Vertex AI client
- [ ] Implement embedding generation service
- [ ] Add model version tracking
- [ ] Add batch processing support

#### Day 18-19: Hierarchical Embeddings
- [ ] Implement chapter-level embeddings
- [ ] Implement chunk-level embeddings
- [ ] Add embedding storage logic
- [ ] Add cache integration

#### Day 20: Testing & Documentation
- [ ] Unit tests cho extraction services
- [ ] Unit tests cho embedding services
- [ ] Integration tests cho full pipeline
- [ ] Update documentation

---

## 🔧 Service Implementations

### 1. Gemini Service Integration

**File:** `server/services/geminiService.ts` (update existing)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

interface ExtractionResult<T> {
  data: T;
  confidence: number;
  errors: string[];
  warnings: string[];
}

/**
 * Extract book context from full text
 */
export async function extractBookContext(
  fullText: string,
  title: string
): Promise<ExtractionResult<BookContext>> {
  const prompt = `
Analyze this book and extract structured information:

Book Title: ${title}
Full Text: ${fullText.substring(0, 50000)}... (truncated if too long)

Extract the following:
1. Summary: 500-1000 words comprehensive summary
2. Characters: List all characters with:
   - Name
   - Role (main, supporting, minor)
   - Description
   - Relationships
3. World Setting: Locations, rules, timeline
4. Writing Style: Tone, POV, voice characteristics
5. Story Arc: 3-act structure summary

Return as JSON following this schema:
{
  "summary": "string (500-1000 words)",
  "characters": [
    {
      "name": "string",
      "role": "main|supporting|minor",
      "description": "string",
      "relationships": ["string"]
    }
  ],
  "world_setting": {
    "locations": ["string"],
    "rules": ["string"],
    "timeline": "string"
  },
  "writing_style": {
    "tone": "string",
    "pov": "first|second|third",
    "voice": "string"
  },
  "story_arc": {
    "act1": "string",
    "act2": "string",
    "act3": "string"
  }
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const extractedData = JSON.parse(jsonMatch[0]);
    
    // Validate schema
    const validation = validateBookContextSchema(extractedData);
    
    // Calculate confidence
    const confidence = calculateConfidence(validation);
    
    return {
      data: extractedData,
      confidence,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  } catch (error) {
    console.error('Book context extraction error:', error);
    throw error;
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
  const prompt = `
Analyze this chapter and extract:

Chapter: ${chapterNumber} - ${chapterTitle || 'Untitled'}
Content: ${chapterContent}

Extract the following:
1. Summary: ~200 words chapter summary
2. Key Scenes: List important scenes with descriptions
3. Character Appearances: Which characters appear and what they do
4. Plot Points: Events, conflicts, resolutions in this chapter
5. Writing Notes: Any notable writing patterns or suggestions

Return as JSON following this schema:
{
  "summary": "string (~200 words)",
  "key_scenes": [
    {
      "description": "string",
      "significance": "string"
    }
  ],
  "character_appearances": [
    {
      "name": "string",
      "actions": ["string"],
      "dialogue": ["string"]
    }
  ],
  "plot_points": {
    "events": ["string"],
    "conflicts": ["string"],
    "resolutions": ["string"]
  },
  "writing_notes": ["string"]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const extractedData = JSON.parse(jsonMatch[0]);
    
    // Validate schema
    const validation = validateChapterMetadataSchema(extractedData);
    
    // Calculate confidence
    const confidence = calculateConfidence(validation);
    
    return {
      data: extractedData,
      confidence,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  } catch (error) {
    console.error('Chapter metadata extraction error:', error);
    throw error;
  }
}
```

---

### 2. Schema Validation Layer

**File:** `server/services/validationService.ts`

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  invalidFields: string[];
}

/**
 * Validate book context schema
 */
export function validateBookContextSchema(
  data: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];
  const invalidFields: string[] = [];
  
  // Required fields
  const requiredFields = ['summary', 'characters', 'writing_style', 'story_arc'];
  requiredFields.forEach(field => {
    if (!data[field]) {
      missingFields.push(field);
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate summary
  if (data.summary) {
    const wordCount = data.summary.split(/\s+/).length;
    if (wordCount < 500) {
      warnings.push('Summary is shorter than recommended (500 words)');
    }
    if (wordCount > 1000) {
      warnings.push('Summary is longer than recommended (1000 words)');
    }
  }
  
  // Validate characters
  if (data.characters) {
    if (!Array.isArray(data.characters)) {
      invalidFields.push('characters');
      errors.push('Characters must be an array');
    } else if (data.characters.length === 0) {
      warnings.push('No characters found in book');
    }
    
    // Validate each character
    data.characters.forEach((char: any, index: number) => {
      if (!char.name) {
        errors.push(`Character ${index}: missing name`);
      }
      if (!char.role || !['main', 'supporting', 'minor'].includes(char.role)) {
        warnings.push(`Character ${index}: invalid role`);
      }
    });
  }
  
  // Validate writing style
  if (data.writing_style) {
    if (!data.writing_style.pov || !['first', 'second', 'third'].includes(data.writing_style.pov)) {
      warnings.push('Invalid POV in writing style');
    }
  }
  
  // Validate story arc
  if (data.story_arc) {
    const requiredActs = ['act1', 'act2', 'act3'];
    requiredActs.forEach(act => {
      if (!data.story_arc[act]) {
        missingFields.push(`story_arc.${act}`);
        errors.push(`Missing story arc: ${act}`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingFields,
    invalidFields,
  };
}

/**
 * Validate chapter metadata schema
 */
export function validateChapterMetadataSchema(
  data: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];
  const invalidFields: string[] = [];
  
  // Required fields
  const requiredFields = ['summary', 'plot_points'];
  requiredFields.forEach(field => {
    if (!data[field]) {
      missingFields.push(field);
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate summary
  if (data.summary) {
    const wordCount = data.summary.split(/\s+/).length;
    if (wordCount < 100) {
      warnings.push('Chapter summary is shorter than recommended (100 words)');
    }
    if (wordCount > 300) {
      warnings.push('Chapter summary is longer than recommended (300 words)');
    }
  }
  
  // Validate key scenes
  if (data.key_scenes && !Array.isArray(data.key_scenes)) {
    invalidFields.push('key_scenes');
    errors.push('Key scenes must be an array');
  }
  
  // Validate character appearances
  if (data.character_appearances && !Array.isArray(data.character_appearances)) {
    invalidFields.push('character_appearances');
    errors.push('Character appearances must be an array');
  }
  
  // Validate plot points
  if (data.plot_points) {
    if (!data.plot_points.events || !Array.isArray(data.plot_points.events)) {
      errors.push('Plot points.events must be an array');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingFields,
    invalidFields,
  };
}

/**
 * Calculate confidence score (0-1)
 */
export function calculateConfidence(
  validation: ValidationResult
): number {
  let score = 1.0;
  
  // Deduct for errors
  score -= validation.errors.length * 0.2;
  
  // Deduct for warnings
  score -= validation.warnings.length * 0.05;
  
  // Deduct for missing fields
  score -= validation.missingFields.length * 0.1;
  
  // Deduct for invalid fields
  score -= validation.invalidFields.length * 0.15;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}
```

---

### 3. Vertex AI Embedding Service

**File:** `server/services/vertexEmbeddingService.ts`

```typescript
import { VertexAI } from '@google-cloud/aiplatform';

const vertexAI = new VertexAI({
  project: process.env.VERTEX_AI_PROJECT_ID!,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1',
});

const CURRENT_EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate embedding using Vertex AI
 */
export async function generateEmbedding(
  content: string,
  modelVersion: string = CURRENT_EMBEDDING_MODEL
): Promise<number[]> {
  try {
    const prediction = await vertexAI.preview.predict({
      endpoint: `projects/${process.env.VERTEX_AI_PROJECT_ID}/locations/${process.env.VERTEX_AI_LOCATION}/publishers/google/models/${modelVersion}`,
      instances: [
        {
          content: content,
        },
      ],
    });
    
    // Extract embedding vector from response
    const embedding = prediction.predictions[0].embeddings.values;
    
    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimensions: ${embedding?.length}`);
    }
    
    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

/**
 * Generate embeddings in batch
 */
export async function generateEmbeddingsBatch(
  contents: string[],
  modelVersion: string = CURRENT_EMBEDDING_MODEL
): Promise<number[][]> {
  try {
    const instances = contents.map(content => ({ content }));
    
    const prediction = await vertexAI.preview.predict({
      endpoint: `projects/${process.env.VERTEX_AI_PROJECT_ID}/locations/${process.env.VERTEX_AI_LOCATION}/publishers/google/models/${modelVersion}`,
      instances,
    });
    
    const embeddings = prediction.predictions.map(
      (pred: any) => pred.embeddings.values
    );
    
    return embeddings;
  } catch (error) {
    console.error('Batch embedding generation error:', error);
    throw error;
  }
}
```

---

### 4. Hierarchical Embedding Service

**File:** `server/services/hierarchicalEmbeddingService.ts`

```typescript
import { generateEmbedding, generateEmbeddingsBatch } from './vertexEmbeddingService';
import { extractChapterMetadata } from './geminiService';

const CHUNK_SIZE_WORDS = 800;
const CHUNK_OVERLAP_WORDS = 100;

interface Chunk {
  text: string;
  index: number;
  wordCount: number;
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text: string): Chunk[] {
  const words = text.split(/\s+/);
  const chunks: Chunk[] = [];
  
  for (let i = 0; i < words.length; i += CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS) {
    const chunkWords = words.slice(i, i + CHUNK_SIZE_WORDS);
    chunks.push({
      text: chunkWords.join(' '),
      index: chunks.length,
      wordCount: chunkWords.length,
    });
  }
  
  return chunks;
}

/**
 * Generate hierarchical embeddings for chapter
 */
export async function generateHierarchicalEmbeddings(
  chapterContent: string
): Promise<{
  chapterEmbedding: number[];
  chunkEmbeddings: Array<{
    chunkIndex: number;
    embedding: number[];
    text: string;
  }>;
}> {
  // 1. Generate summary for chapter-level embedding
  const metadata = await extractChapterMetadata(chapterContent, 0);
  const summary = metadata.data.summary;
  
  // 2. Generate chapter-level embedding (from summary)
  const chapterEmbedding = await generateEmbedding(summary);
  
  // 3. Check if chapter is long enough to chunk
  const wordCount = chapterContent.split(/\s+/).length;
  if (wordCount <= CHUNK_SIZE_WORDS) {
    // Short chapter: only chapter-level embedding
    return {
      chapterEmbedding,
      chunkEmbeddings: [],
    };
  }
  
  // 4. Chunk content
  const chunks = chunkText(chapterContent);
  
  // 5. Generate chunk-level embeddings (batch)
  const chunkTexts = chunks.map(chunk => chunk.text);
  const chunkEmbeddings = await generateEmbeddingsBatch(chunkTexts);
  
  return {
    chapterEmbedding,
    chunkEmbeddings: chunks.map((chunk, index) => ({
      chunkIndex: chunk.index,
      embedding: chunkEmbeddings[index],
      text: chunk.text,
    })),
  };
}
```

---

## 🧪 Testing Guide

### Unit Tests
```typescript
// tests/services/geminiService.test.ts
describe('Gemini Service', () => {
  it('should extract book context', async () => {
    // Test extraction
  });
  
  it('should extract chapter metadata', async () => {
    // Test extraction
  });
});

// tests/services/validationService.test.ts
describe('Validation Service', () => {
  it('should validate book context schema', () => {
    // Test validation
  });
  
  it('should calculate confidence score', () => {
    // Test confidence calculation
  });
});
```

---

## ✅ Acceptance Criteria

### LLM Extraction
- [ ] Book context extraction working
- [ ] Chapter metadata extraction working
- [ ] Schema validation working
- [ ] Confidence scoring working (>0.7 average)

### Embeddings
- [ ] Vertex AI integration working
- [ ] Embedding generation working
- [ ] Hierarchical embeddings working (chapter + chunks)
- [ ] Cache integration working

### Quality
- [ ] Validation errors <5%
- [ ] Confidence scores tracked
- [ ] Manual review flagging working

---

## 🚀 Next Steps

After completing Phase 2, proceed to:
- **Phase 3**: Query & Search (semantic search, agent integration)
- Review: `PHASE_3_QUERY_SEARCH.md`

---

**Status:** Ready to Start (After Phase 1)  
**Estimated Time:** 2 weeks  
**Priority:** HIGH















