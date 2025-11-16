# Storage Architecture Plan - Executive Summary

**Version:** 2.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation

---

## 📋 Overview

Master plan cho PostgreSQL storage architecture cho AI Writing Assistant với 3 storage layers:
1. **Storage 1**: Book Context (Lightweight, Whole Book)
2. **Storage 2**: Recent Chapters (Detailed, 5 Chapters)
3. **Storage 3**: Workspace State (UI Persistence)

---

## 🎯 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Embeddings** | Storage 2 only | Cost-effective, sufficient for semantic search |
| **Rolling Window** | Time-based (updated_at) | Always show most recently edited chapters |
| **Archive Strategy** | Move to archive, never delete | Preserve data for recovery |
| **Update Frequency** | Change detection + manual trigger | Balance accuracy and cost |
| **Processing** | Async with status tracking | Better UX, scalable |

---

## 📊 Storage Design Summary

### Storage 1: Book Context
- **Purpose**: Essential DNA of book
- **Data**: Summary, characters, world, style, arc
- **Size**: ~5-10KB per book (stable)
- **Update**: Manual trigger or significant changes
- **Query**: Fast lookup by book_id
- **Embeddings**: ❌ No (not needed)

### Storage 2: Recent Chapters
- **Purpose**: Immediate writing context
- **Data**: Full text, metadata, embeddings
- **Size**: ~100-500KB per chapter × 5 = 0.5-2.5MB per book
- **Update**: Time-based rolling window (updated_at)
- **Query**: Recent chapters + semantic search
- **Embeddings**: ✅ Yes (768 dimensions, Vertex AI)

### Storage 3: Workspace State
- **Purpose**: UI state persistence
- **Data**: Settings, chat messages, canvas pages
- **Size**: ~10-50KB per workspace
- **Update**: Auto-save on changes
- **Query**: Fast lookup by user_id
- **Embeddings**: ❌ No

---

## 🔄 Data Flow

```
Google Docs Input
    ↓
[Phase 1: Basic Info] → Immediate (1s)
    ↓
[Phase 2: Quick Summary] → Fast (5s)
    ↓
[Phase 3: Full Analysis] → Background (30-60s)
    ↓
[Phase 4: Chapter Processing] → Background (2-5min)
    ↓
[Phase 5: Embeddings] → Background (5-10min)
```

---

## 💰 Cost Optimization

| Strategy | Impact | Savings |
|----------|--------|---------|
| **Content Hash Caching** | High | 80-90% reduction in re-embedding |
| **Change Detection** | High | Skip unnecessary updates |
| **Incremental Updates** | Medium | 50-70% reduction in LLM calls |
| **768 Dimensions** | Medium | 50% storage reduction vs 1536 |
| **Batch Processing** | Medium | 30-40% API cost reduction |

**Estimated Cost per Book:**
- Import (first time): ~$0.20-0.50
- Updates (per chapter): ~$0.01-0.05
- Monthly (1000 books): ~$50-100

---

## ⚡ Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Query Latency (95th percentile) | <500ms | TBD |
| Embedding Generation | <5s/chapter | TBD |
| Cache Hit Rate | >80% | TBD |
| Data Consistency | 99.9% | TBD |

---

## 🏗️ Implementation Phases

### Phase 1: Foundation (Week 1-2) - CRITICAL
- Database setup & schema
- Basic services (hash, cache, change detection)

### Phase 2: Normalization (Week 3-4) - HIGH
- LLM extraction services
- Embedding generation
- Validation & quality checks

### Phase 3: Query & Search (Week 5-6) - HIGH
- Query classification
- Semantic search
- Agent integration

### Phase 4: Async Processing (Week 7-8) - MEDIUM
- Job queue system
- Background workers
- Status tracking

### Phase 5: Optimization (Week 9-10) - MEDIUM
- Performance tuning
- Cost optimization
- Monitoring

---

## 📚 Document Structure

1. **STORAGE_MASTER_PLAN.md** - Complete implementation guide
2. **STORAGE_ARCHITECTURE_PLAN.md** - Initial design & analysis
3. **STORAGE_ISSUES_SOLUTIONS.md** - Problem solutions & details
4. **STORAGE_PLAN_SUMMARY.md** - This executive summary

---

## ✅ Key Features

### Data Quality
- ✅ Schema validation for LLM output
- ✅ Confidence scoring (0-1)
- ✅ Manual review flagging (<0.7)
- ✅ Change detection & smart updates

### Performance
- ✅ Content hash caching (80-90% hit rate)
- ✅ Batch processing & rate limiting
- ✅ Index optimization (pgvector)
- ✅ Separate tables for large data

### Scalability
- ✅ Archive strategy (no data loss)
- ✅ Auto-truncation (chat, canvas)
- ✅ Async processing (job queue)
- ✅ Time-based rolling window

### Cost Control
- ✅ Smart caching (re-embed only if changed)
- ✅ Incremental updates (partial re-extraction)
- ✅ Model selection (768 vs 1536)
- ✅ Batch processing (reduce API calls)

---

## 🚀 Quick Start

### 1. Database Setup
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
-- Run schema.sql from STORAGE_MASTER_PLAN.md
```

### 2. Environment Variables
```bash
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
VERTEX_AI_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-api-key
REDIS_URL=redis://localhost:6379
```

### 3. Initialize Services
```typescript
// See STORAGE_MASTER_PLAN.md Section 8 for API design
```

---

## 📖 Next Steps

1. Review **STORAGE_MASTER_PLAN.md** for complete details
2. Setup database schema (Section 7)
3. Implement Phase 1: Foundation (Section 6)
4. Test with sample data
5. Iterate based on performance metrics

---

## 🔗 Related Documents

- **STORAGE_MASTER_PLAN.md** - Full implementation guide
- **STORAGE_ARCHITECTURE_PLAN.md** - Design analysis
- **STORAGE_ISSUES_SOLUTIONS.md** - Problem solutions

---

**Version:** 2.0  
**Status:** Ready for Implementation  
**Last Updated:** 2024















