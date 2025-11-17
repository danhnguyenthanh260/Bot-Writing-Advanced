# ⚠️ Các Vấn Đề Còn Tồn Tại Trong Các Luồng Hoạt Động

**Cập nhật:** 2024  
**Mục đích:** Tài liệu tổng hợp các vấn đề, hạn chế, và giải pháp cho các luồng hoạt động hệ thống

---

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Vấn Đề Critical (Cần Sửa Ngay)](#vấn-đề-critical-cần-sửa-ngay)
3. [Vấn Đề High Priority](#vấn-đề-high-priority)
4. [Vấn Đề Medium Priority](#vấn-đề-medium-priority)
5. [Vấn Đề Low Priority](#vấn-đề-low-priority)
6. [Giải Pháp & Roadmap](#giải-pháp--roadmap)

---

## 📊 Tổng Quan

### Phân Loại Vấn Đề

| Priority | Số Lượng | Mô Tả |
|----------|----------|-------|
| 🔴 **Critical** | 3 | Ảnh hưởng trực tiếp đến functionality |
| 🟠 **High** | 5 | Ảnh hưởng đến performance và user experience |
| 🟡 **Medium** | 8 | Cần cải thiện nhưng không block |
| 🟢 **Low** | 4 | Nice-to-have, có thể làm sau |

**Tổng:** 20 vấn đề đã được xác định

---

## 🔴 Vấn Đề Critical (Cần Sửa Ngay)

### 1. Job Queue System - In-Memory Only

**Luồng bị ảnh hưởng:** Background Processing, Async Jobs

**Vấn đề:**
- Hiện tại dùng `simpleQueue.ts` - in-memory queue
- Jobs mất khi server restart
- Không có persistence
- Không scale được với multiple instances

**Code hiện tại:**
```typescript
// server/jobs/simpleQueue.ts
class SimpleQueue {
  private jobs: Map<string, Job> = new Map(); // ❌ In-memory only
  // ...
}
```

**Hậu quả:**
- ❌ Server restart → mất tất cả pending jobs
- ❌ Không thể scale với multiple backend instances
- ❌ Không có job history
- ❌ Khó debug khi job failed

**Giải pháp:**
- [ ] Setup Redis
- [ ] Migrate sang Bull/BullMQ
- [ ] Implement job persistence
- [ ] Add job monitoring dashboard

**File cần sửa:**
- `server/jobs/simpleQueue.ts` → Replace với Bull/BullMQ
- `server/jobs/bookProcessingJob.ts` → Update để dùng Bull queue
- `server/jobs/chapterProcessingJob.ts` → Update để dùng Bull queue

**Timeline:** Phase 4 (Week 7-8)

---

### 2. Vertex AI Embedding - Placeholder Implementation

**Luồng bị ảnh hưởng:** Embedding Generation, Semantic Search

**Vấn đề:**
- Hiện tại có thể đang dùng placeholder hoặc local embedding
- Chưa có integration thực tế với Vertex AI
- Embedding quality có thể không đủ tốt cho production

**Code hiện tại:**
```typescript
// server/services/vertexEmbeddingService.ts
// Có thể đang dùng hash-based placeholder
```

**Hậu quả:**
- ⚠️ Embedding quality thấp → Semantic search không chính xác
- ⚠️ Không tận dụng được Vertex AI embeddings
- ⚠️ Cần implement thực tế trước khi production

**Giải pháp:**
- [ ] Implement Vertex AI API integration
- [ ] Test embedding quality
- [ ] Add fallback mechanism
- [ ] Document embedding provider options

**File cần sửa:**
- `server/services/vertexEmbeddingService.ts`
- `server/services/embeddingProvider.ts`

**Timeline:** Phase 2 (đã có structure, cần implement)

---

### 3. Gemini Model Version - Có Thể Không Available

**Luồng bị ảnh hưởng:** AI Extraction, Chat Response

**Vấn đề:**
- Đang dùng `gemini-2.0-flash-exp` - experimental model
- Model có thể không available hoặc bị deprecated
- Không có fallback mechanism

**Code hiện tại:**
```typescript
// server/services/extractionService.ts
const model = 'gemini-2.0-flash-exp'; // ⚠️ Experimental
```

**Hậu quả:**
- ❌ API call có thể fail nếu model không available
- ❌ Không có fallback → toàn bộ extraction fails
- ❌ User experience bị ảnh hưởng

**Giải pháp:**
- [ ] Add model fallback chain: `gemini-2.0-flash-exp` → `gemini-2.0-flash` → `gemini-1.5-pro`
- [ ] Add model availability check
- [ ] Add error handling với fallback
- [ ] Make model configurable via env var

**File cần sửa:**
- `server/services/extractionService.ts`
- `services/geminiService.ts`

**Timeline:** Immediate fix

---

## 🟠 Vấn Đề High Priority

### 4. Redis Cache Layer - Chưa Có

**Luồng bị ảnh hưởng:** Query Performance, API Costs

**Vấn đề:**
- Chưa có Redis cache layer
- Mọi query đều hit database
- Không cache search results
- Không cache book context

**Hậu quả:**
- ⚠️ Database load cao
- ⚠️ Query latency cao
- ⚠️ API costs cao (repeated AI calls)
- ⚠️ Poor user experience với slow responses

**Giải pháp:**
- [ ] Setup Redis
- [ ] Implement cache service
- [ ] Cache strategies:
  - Book context (1 hour)
  - Recent chapters (30 minutes)
  - Search results (1 hour)
  - Embeddings (24 hours - đã có trong DB)
- [ ] Add cache invalidation logic

**Timeline:** Phase 5 (Week 9)

---

### 5. Error Handling & Retry Logic - Chưa Đầy Đủ

**Luồng bị ảnh hưởng:** Tất cả các luồng

**Vấn đề:**
- Một số services chưa có retry logic
- Error handling không consistent
- Không có error tracking service
- Không có alert system

**Code hiện tại:**
```typescript
// Một số nơi chỉ có try-catch đơn giản
try {
  await someOperation();
} catch (error) {
  console.error(error); // ❌ Chỉ log, không retry
  throw error;
}
```

**Hậu quả:**
- ⚠️ Transient errors không được retry
- ⚠️ Khó debug khi có lỗi
- ⚠️ Không có visibility vào error patterns
- ⚠️ User không biết lỗi gì xảy ra

**Giải pháp:**
- [ ] Implement retry utility với exponential backoff
- [ ] Add error tracking (Sentry hoặc custom)
- [ ] Standardize error handling pattern
- [ ] Add error alert system
- [ ] Add user-friendly error messages

**Timeline:** Phase 5 (Week 10)

---

### 6. Status Tracking API - Chưa Test

**Luồng bị ảnh hưở:** Background Processing, User Experience

**Vấn đề:**
- Status tracking service đã có nhưng chưa được test
- API endpoint có thể không hoạt động đúng
- Frontend không có real-time updates

**Code hiện tại:**
```typescript
// server/services/statusService.ts - Đã có
// server/routes/processingRoutes.ts - Cần verify
```

**Hậu quả:**
- ⚠️ User không biết processing status
- ⚠️ Không có progress updates
- ⚠️ Poor UX khi upload document

**Giải pháp:**
- [ ] Test status tracking API
- [ ] Add WebSocket hoặc polling cho real-time updates
- [ ] Add progress bar trong frontend
- [ ] Add error notifications

**Timeline:** Phase 4 (Week 7-8)

---

### 7. Database Query Optimization - Chưa Review

**Luồng bị ảnh hưởng:** Semantic Search, Context Retrieval

**Vấn đề:**
- Chưa review và optimize database queries
- Chưa có EXPLAIN ANALYZE cho slow queries
- Indexes có thể chưa optimal
- Query performance chưa được measure

**Hậu quả:**
- ⚠️ Slow queries → poor user experience
- ⚠️ Database load cao
- ⚠️ Semantic search có thể chậm với nhiều data

**Giải pháp:**
- [ ] Run EXPLAIN ANALYZE cho tất cả queries
- [ ] Optimize slow queries
- [ ] Review và optimize indexes
- [ ] Add query performance monitoring
- [ ] Set performance targets (<500ms for queries)

**Timeline:** Phase 5 (Week 9)

---

### 8. UI Visibility Issues - Chưa Verify

**Luồng bị ảnh hưởng:** User Experience

**Vấn đề:**
- Header, Sidebar, Chat widget có thể không visible
- Projects list có thể không accessible
- Login button có thể không visible

**Hậu quả:**
- ❌ User không thể sử dụng ứng dụng
- ❌ Critical functionality bị block

**Giải pháp:**
- [ ] Verify header luôn visible
- [ ] Verify sidebar luôn visible
- [ ] Verify chat widget toggle hoạt động
- [ ] Verify projects list accessible
- [ ] Verify login button visible
- [ ] Fix CSS z-index và layout issues

**Timeline:** Priority 1 (Làm ngay)

---

## 🟡 Vấn Đề Medium Priority

### 9. User Notifications - Chưa Có

**Luồng bị ảnh hưởng:** Background Processing, User Experience

**Vấn đề:**
- Không có notification system
- User không biết khi processing hoàn thành
- Không có in-app notifications
- Không có email notifications

**Giải pháp:**
- [ ] Implement notification service
- [ ] Add in-app notifications
- [ ] Add email notifications (optional)
- [ ] Add notification preferences

**Timeline:** Phase 4 (Week 8)

---

### 10. Monitoring & Metrics - Chưa Có

**Luồng bị ảnh hưởng:** Tất cả các luồng

**Vấn đề:**
- Không có metrics tracking
- Không có performance monitoring
- Không có cost tracking
- Không có alert system

**Giải pháp:**
- [ ] Implement metrics service
- [ ] Track: query latency, cache hit rate, API costs, error rate
- [ ] Add performance dashboards
- [ ] Add alert system

**Timeline:** Phase 5 (Week 10)

---

### 11. Testing - Chưa Đầy Đủ

**Luồng bị ảnh hưởng:** Tất cả các luồng

**Vấn đề:**
- Chưa có unit tests
- Chưa có integration tests
- Chưa có end-to-end tests
- Chưa có performance tests

**Giải pháp:**
- [ ] Add unit tests cho services
- [ ] Add integration tests cho API endpoints
- [ ] Add end-to-end tests
- [ ] Add performance tests

**Timeline:** Ongoing

---

### 12. Service Integration - Chưa Verify

**Luồng bị ảnh hưởng:** Tất cả các luồng

**Vấn đề:**
- Chưa verify tất cả services được sử dụng
- Chưa verify routes được register
- Chưa verify error handling đầy đủ

**Giải pháp:**
- [ ] Verify tất cả services được import và sử dụng
- [ ] Verify tất cả routes được register trong `server/index.ts`
- [ ] Verify error handling đầy đủ
- [ ] Test tất cả API endpoints

**Timeline:** Priority 1 (Làm ngay)

---

### 13. TypeScript Errors trong Test Files

**Luồng bị ảnh hưởng:** Development, Testing

**Vấn đề:**
- 2 lỗi TypeScript trong test files cũ
- `services/tests/actionEffects.test.ts:24` - readonly array issue
- `services/tests/actionSchema.test.ts:27` - missing property

**Hậu quả:**
- ⚠️ TypeScript compilation warnings
- ⚠️ Không ảnh hưởng code mới nhưng cần sửa

**Giải pháp:**
- [ ] Fix TypeScript errors trong test files
- [ ] Update test files với correct types

**Timeline:** Low priority (có thể làm sau)

---

### 14. Rate Limiting - Chưa Có

**Luồng bị ảnh hưởng:** API Calls, Cost Control

**Vấn đề:**
- Không có rate limiting
- Có thể bị abuse
- API costs không được control
- Không có quota management

**Giải pháp:**
- [ ] Implement rate limiting middleware
- [ ] Add per-user rate limits
- [ ] Add per-endpoint rate limits
- [ ] Add quota management

**Timeline:** Phase 5 (Week 9)

---

### 15. Database Connection Pooling - Chưa Tune

**Luồng bị ảnh hưởng:** Database Performance

**Vấn đề:**
- Connection pooling chưa được tune
- Có thể thiếu connections hoặc thừa
- Không có monitoring

**Giải pháp:**
- [ ] Review connection pool settings
- [ ] Tune pool size based on load
- [ ] Add connection pool monitoring
- [ ] Add connection leak detection

**Timeline:** Phase 5 (Week 9)

---

### 16. Content Validation - Chưa Đầy Đủ

**Luồng bị ảnh hưởng:** Data Quality

**Vấn đề:**
- Validation service đã có nhưng có thể chưa đầy đủ
- Chưa validate content quality
- Chưa validate encoding issues

**Giải pháp:**
- [ ] Review validation rules
- [ ] Add content quality checks
- [ ] Add encoding validation
- [ ] Add content length limits

**Timeline:** Ongoing

---

## 🟢 Vấn Đề Low Priority

### 17. Documentation - Chưa Đầy Đủ

**Vấn đề:**
- API documentation chưa complete
- Deployment guide chưa complete
- Runbook chưa có
- User guide chưa có

**Giải pháp:**
- [ ] Complete API documentation
- [ ] Write deployment guide
- [ ] Create runbook
- [ ] Write user guide

**Timeline:** Ongoing

---

### 18. UI Component Styling - Chưa Apply Specs

**Vấn đề:**
- UI_UPGRADE_PLAN specs chưa được apply đầy đủ
- Component styling chưa consistent
- Micro-interactions chưa có

**Giải pháp:**
- [ ] Apply UI_UPGRADE_PLAN specs
- [ ] Improve component styling
- [ ] Add micro-interactions

**Timeline:** Priority 2 (Tuần này)

---

### 19. Accessibility - Chưa Audit

**Vấn đề:**
- Chưa có accessibility audit
- Keyboard navigation chưa đầy đủ
- Screen reader support chưa có
- ARIA labels chưa có

**Giải pháp:**
- [ ] Accessibility audit
- [ ] Add keyboard navigation
- [ ] Add screen reader support
- [ ] Add ARIA labels

**Timeline:** Low priority

---

### 20. Performance Targets - Chưa Đạt

**Vấn đề:**
- Query latency chưa measure
- Cache hit rate chưa track
- Embedding generation time chưa optimize
- Database query time chưa optimize

**Targets:**
- Query latency <500ms (95th percentile)
- Cache hit rate >80%
- Embedding generation <5s/chapter
- Database query time <100ms

**Giải pháp:**
- [ ] Measure current performance
- [ ] Set up monitoring
- [ ] Optimize để đạt targets
- [ ] Track metrics

**Timeline:** Phase 5 (Week 9-10)

---

## 🔧 Giải Pháp & Roadmap

### Immediate Actions (Tuần này)

1. ✅ **Fix Gemini Model Fallback** - Add fallback chain
2. ✅ **Verify UI Visibility** - Fix CSS issues
3. ✅ **Service Integration Check** - Verify all services used
4. ✅ **Test Status Tracking API** - Ensure it works

### Short Term (2-4 tuần)

1. **Phase 4: Async Processing**
   - Setup Redis
   - Migrate to Bull/BullMQ
   - Implement job persistence
   - Add notifications

2. **Error Handling Improvements**
   - Add retry logic
   - Add error tracking
   - Standardize error handling

### Medium Term (1-2 tháng)

1. **Phase 5: Optimization**
   - Setup Redis cache
   - Optimize database queries
   - Add monitoring & metrics
   - Performance tuning

2. **Testing & Documentation**
   - Add comprehensive tests
   - Complete documentation
   - Create runbook

---

## 📊 Impact Matrix

| Vấn Đề | Impact | Effort | Priority |
|--------|--------|--------|----------|
| Job Queue (Redis) | High | High | High |
| Model Fallback | High | Low | Critical |
| UI Visibility | High | Low | Critical |
| Redis Cache | High | Medium | High |
| Error Handling | Medium | Medium | High |
| Status Tracking | Medium | Low | High |
| Query Optimization | Medium | Medium | Medium |
| Monitoring | Low | High | Medium |
| Testing | Low | High | Medium |

---

## 🎯 Recommended Action Plan

### Week 1 (Critical Fixes)
- [ ] Fix Gemini model fallback
- [ ] Verify và fix UI visibility issues
- [ ] Service integration check
- [ ] Test status tracking API

### Week 2-3 (High Priority)
- [ ] Setup Redis
- [ ] Migrate job queue to Bull/BullMQ
- [ ] Implement error handling improvements
- [ ] Add retry logic

### Week 4-5 (Medium Priority)
- [ ] Setup Redis cache layer
- [ ] Optimize database queries
- [ ] Add monitoring & metrics
- [ ] Performance tuning

### Week 6+ (Ongoing)
- [ ] Add comprehensive tests
- [ ] Complete documentation
- [ ] Accessibility improvements
- [ ] UI polish

---

## 📝 Notes

- **Job Queue:** Hiện tại dùng in-memory queue, cần migrate sang Redis + Bull
- **Embedding:** Cần verify implementation và quality
- **Model:** Cần add fallback mechanism
- **Cache:** Chưa có Redis cache layer
- **Monitoring:** Chưa có metrics và monitoring
- **Testing:** Cần thêm tests

---

**Xem thêm:**
- [SYSTEM_WORKFLOWS.md](./SYSTEM_WORKFLOWS.md) - Chi tiết các luồng hoạt động
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) - Tình trạng dự án
- [PHASE_4_ASYNC_PROCESSING.md](../implementation/PHASE_4_ASYNC_PROCESSING.md) - Phase 4 details
- [PHASE_5_OPTIMIZATION.md](../implementation/PHASE_5_OPTIMIZATION.md) - Phase 5 details

---

**Last Updated:** 2024

