/**
 * Embedding Provider Interface
 * 
 * Pluggable architecture for embedding generation
 * Supports: Local (free), OpenAI, Vertex AI
 * 
 * Fixed architecture pattern - reusable across projects
 */

export enum EmbeddingProvider {
  LOCAL = 'local',
  OPENAI = 'openai',
  VERTEX_AI = 'vertex-ai',
}

export interface EmbeddingProviderConfig {
  provider: EmbeddingProvider;
  dimensions: number;
  model?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  provider: EmbeddingProvider;
}

/**
 * Base interface for embedding providers
 */
export interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddingsBatch(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
  getModelName(): string;
  getProvider(): EmbeddingProvider;
}

/**
 * Local Embedding Provider (Free - Sentence Transformers)
 * 
 * Uses local FastAPI service running Sentence Transformers
 * No API costs, fully offline, data stays local
 */
export class LocalEmbeddingProvider implements IEmbeddingProvider {
  private readonly dimensions = 384; // all-MiniLM-L6-v2
  private readonly model = 'all-MiniLM-L6-v2';
  private readonly apiUrl: string;

  constructor(apiUrl: string = process.env.LOCAL_EMBEDDING_API_URL || 'http://localhost:8000') {
    this.apiUrl = apiUrl;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.apiUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Local embedding API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Local embedding generation error:', error);
      throw new Error(`Failed to generate local embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.apiUrl}/embed/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        throw new Error(`Local embedding API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embeddings;
    } catch (error) {
      console.error('Local batch embedding error:', error);
      // Fallback to sequential
      const embeddings: number[][] = [];
      for (const text of texts) {
        embeddings.push(await this.generateEmbedding(text));
      }
      return embeddings;
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModelName(): string {
    return this.model;
  }

  getProvider(): EmbeddingProvider {
    return EmbeddingProvider.LOCAL;
  }
}

/**
 * OpenAI Embedding Provider
 */
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly dimensions = 1536; // text-embedding-3-small
  private readonly model: string;
  private openai: any;

  constructor(model: string = 'text-embedding-3-small') {
    this.model = model;
    // Lazy load OpenAI to avoid dependency if not used
    try {
      const OpenAI = require('openai');
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      throw new Error('OpenAI package not installed. Run: npm install openai');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Check OPENAI_API_KEY in .env');
    }

    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text,
    });

    return response.data[0].embedding;
  }

  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Check OPENAI_API_KEY in .env');
    }

    const response = await this.openai.embeddings.create({
      model: this.model,
      input: texts,
    });

    return response.data.map((item: any) => item.embedding);
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModelName(): string {
    return this.model;
  }

  getProvider(): EmbeddingProvider {
    return EmbeddingProvider.OPENAI;
  }
}

/**
 * Vertex AI Embedding Provider
 */
export class VertexAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly dimensions = 768; // text-embedding-004
  private readonly model: string;
  private readonly projectId: string;
  private readonly location: string;

  constructor(
    model: string = 'text-embedding-004',
    projectId?: string,
    location: string = 'us-central1'
  ) {
    this.model = model;
    this.projectId = projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.location = location;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const accessToken = await this.getAccessToken();
    const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:predict`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ content: text }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vertex AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.predictions[0].embeddings.values;
  }

  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    // Vertex AI supports batch, but implementation depends on API
    const embeddings: number[][] = [];
    for (const text of texts) {
      embeddings.push(await this.generateEmbedding(text));
    }
    return embeddings;
  }

  private async getAccessToken(): Promise<string> {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token!;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModelName(): string {
    return this.model;
  }

  getProvider(): EmbeddingProvider {
    return EmbeddingProvider.VERTEX_AI;
  }
}

/**
 * Factory function to create embedding provider based on config
 * 
 * Fixed architecture pattern - switch provider via environment variable
 */
export function createEmbeddingProvider(): IEmbeddingProvider {
  const provider = (process.env.EMBEDDING_PROVIDER || 'local').toLowerCase() as EmbeddingProvider;

  switch (provider) {
    case EmbeddingProvider.LOCAL:
      return new LocalEmbeddingProvider();

    case EmbeddingProvider.OPENAI:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not set in .env');
      }
      return new OpenAIEmbeddingProvider();

    case EmbeddingProvider.VERTEX_AI:
      if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID not set in .env');
      }
      return new VertexAIEmbeddingProvider();

    default:
      console.warn(`Unknown embedding provider: ${provider}, falling back to LOCAL`);
      return new LocalEmbeddingProvider();
  }
}

/**
 * Get current provider configuration
 */
export function getEmbeddingProviderConfig(): EmbeddingProviderConfig {
  const provider = createEmbeddingProvider();
  return {
    provider: provider.getProvider(),
    dimensions: provider.getDimensions(),
    model: provider.getModelName(),
  };
}

