import { getCachedEmbedding, cacheEmbedding } from './embeddingCacheService';
import { createEmbeddingProvider, getEmbeddingProviderConfig, type IEmbeddingProvider } from './embeddingProvider';

// Initialize provider (singleton pattern)
let embeddingProvider: IEmbeddingProvider | null = null;

/**
 * Get or create embedding provider instance
 * Fixed architecture - provider determined by EMBEDDING_PROVIDER env var
 */
function getEmbeddingProvider(): IEmbeddingProvider {
  if (!embeddingProvider) {
    embeddingProvider = createEmbeddingProvider();
    const config = getEmbeddingProviderConfig();
    console.log(`✅ Embedding provider initialized: ${config.provider} (${config.model}, ${config.dimensions}D)`);
  }
  return embeddingProvider;
}

/**
 * Generate embedding using configured provider
 * 
 * Architecture: Free-first (local by default), switchable via EMBEDDING_PROVIDER
 * - local: Sentence Transformers (free, offline)
 * - openai: OpenAI API (paid)
 * - vertex-ai: Google Vertex AI (paid)
 * 
 * @param content Text to embed
 * @param modelVersion Optional model version (provider-specific)
 * @returns Embedding vector
 */
export async function generateEmbedding(
  content: string,
  modelVersion?: string
): Promise<number[]> {
  try {
    const provider = getEmbeddingProvider();
    const modelName = modelVersion || provider.getModelName();
    
    // Check cache first
    const cached = await getCachedEmbedding(content, modelName);
    if (cached) {
      return cached;
    }
    
    // Generate embedding using configured provider
    const embedding = await provider.generateEmbedding(content);
    
    // Validate dimensions
    const expectedDimensions = provider.getDimensions();
    if (embedding.length !== expectedDimensions) {
      throw new Error(
        `Expected ${expectedDimensions} dimensions, got ${embedding.length}. ` +
        `Provider: ${provider.getProvider()}, Model: ${modelName}`
      );
    }
    
    // Cache the embedding
    await cacheEmbedding(content, embedding, modelName);
    
    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

/**
 * Generate embeddings in batch
 * Uses provider's batch method if available, otherwise sequential
 */
export async function generateEmbeddingsBatch(
  contents: string[],
  modelVersion?: string
): Promise<number[][]> {
  try {
    const provider = getEmbeddingProvider();
    
    // Use provider's batch method (more efficient)
    const embeddings = await provider.generateEmbeddingsBatch(contents);
    
    // Cache each embedding
    const modelName = modelVersion || provider.getModelName();
    for (let i = 0; i < contents.length; i++) {
      await cacheEmbedding(contents[i], embeddings[i], modelName);
    }
    
    return embeddings;
  } catch (error) {
    console.error('Batch embedding generation error:', error);
    throw error;
  }
}

/**
 * Get embedding model info
 * Returns current provider configuration
 */
export function getEmbeddingModelInfo() {
  const provider = getEmbeddingProvider();
  const config = getEmbeddingProviderConfig();
  
  return {
    provider: config.provider,
    model: config.model || provider.getModelName(),
    dimensions: config.dimensions || provider.getDimensions(),
  };
}

/**
 * Reset embedding provider (useful for testing or config changes)
 */
export function resetEmbeddingProvider() {
  embeddingProvider = null;
}


