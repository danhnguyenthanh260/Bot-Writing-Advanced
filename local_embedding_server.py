"""
Local Embedding Server (Free-First Architecture)
================================================

FastAPI service running Sentence Transformers locally
- No API costs
- Fully offline
- Data stays local
- ~85% performance of OpenAI embeddings

Usage:
    pip install sentence-transformers fastapi uvicorn
    uvicorn local_embedding_server:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from typing import List
import os

# Initialize FastAPI app
app = FastAPI(
    title="Local Embedding Server",
    description="Free semantic embeddings using Sentence Transformers",
    version="1.0.0"
)

# CORS middleware (allow backend to call)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
# Options:
# - all-MiniLM-L6-v2 (384 dims, best balance)
# - paraphrase-MiniLM-L3-v2 (256 dims, faster)
# - all-mpnet-base-v2 (768 dims, better quality but slower)

print(f"Loading embedding model: {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)
# Use ASCII-safe output for Windows console
print(f"[OK] Model loaded: {MODEL_NAME} ({model.get_sentence_embedding_dimension()} dimensions)")

# Request/Response models
class EmbedRequest(BaseModel):
    text: str

class BatchEmbedRequest(BaseModel):
    texts: List[str]

class EmbedResponse(BaseModel):
    embedding: List[float]
    dimensions: int
    model: str

class BatchEmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int
    model: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "dimensions": model.get_sentence_embedding_dimension(),
        "service": "local-embedding-server"
    }

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "model": MODEL_NAME}

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    """
    Generate embedding for a single text
    
    Args:
        request: EmbedRequest with text field
        
    Returns:
        EmbedResponse with embedding vector
    """
    try:
        # Generate embedding
        embedding = model.encode([request.text])[0].tolist()
        
        return EmbedResponse(
            embedding=embedding,
            dimensions=len(embedding),
            model=MODEL_NAME
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding error: {str(e)}")

@app.post("/embed/batch", response_model=BatchEmbedResponse)
async def embed_batch(request: BatchEmbedRequest):
    """
    Generate embeddings for multiple texts (batch processing)
    
    Args:
        request: BatchEmbedRequest with texts list
        
    Returns:
        BatchEmbedResponse with embeddings list
    """
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="Empty texts list")
        
        # Generate embeddings in batch (more efficient)
        embeddings = model.encode(request.texts).tolist()
        
        return BatchEmbedResponse(
            embeddings=embeddings,
            dimensions=len(embeddings[0]) if embeddings else 0,
            model=MODEL_NAME
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch embedding error: {str(e)}")

@app.get("/info")
async def info():
    """Get model information"""
    return {
        "model": MODEL_NAME,
        "dimensions": model.get_sentence_embedding_dimension(),
        "max_seq_length": model.max_seq_length,
        "device": str(model.device),
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

