# 📚 Tài Liệu Dự Án - Dei8 AI Writing Studio

**Cập nhật:** 2024

---

## 🎯 Tài Liệu Chính

- **[README.md](../README.md)** - Tài liệu tổng quan và hướng dẫn sử dụng chính
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Tình trạng dự án và roadmap

---

## 📂 Cấu Trúc Tài Liệu

### 🛠️ Setup & Installation (`docs/setup/`)

**Database Setup:**
- [SETUP_POSTGRESQL_WINDOWS.md](./setup/SETUP_POSTGRESQL_WINDOWS.md) - Hướng dẫn cài đặt PostgreSQL trên Windows
- [DATABASE_SETUP.md](./setup/DATABASE_SETUP.md) - Hướng dẫn setup database (tổng hợp: quick start, chi tiết, troubleshooting)
- [DATABASE_URL_GUIDE.md](./setup/DATABASE_URL_GUIDE.md) - Hướng dẫn cấu hình DATABASE_URL
- [VERIFY_DATABASE_CONNECTION.md](./setup/VERIFY_DATABASE_CONNECTION.md) - Kiểm tra kết nối database
- [DB_RESET_GUIDE.md](./setup/DB_RESET_GUIDE.md) - Hướng dẫn reset database
- [DATABASE_TABLES_OVERVIEW.md](./setup/DATABASE_TABLES_OVERVIEW.md) - Tổng quan các bảng database

**pgvector Setup:**
- [PGVECTOR_SETUP.md](./setup/PGVECTOR_SETUP.md) - Hướng dẫn cài đặt pgvector (tổng hợp: build từ source, pre-built binary, Docker)

**Build Tools:**
- [SETUP_VS_BUILD_TOOLS.md](./setup/SETUP_VS_BUILD_TOOLS.md) - Setup Visual Studio Build Tools

**Authentication & Services:**
- [GOOGLE_SIGNIN_SETUP.md](./setup/GOOGLE_SIGNIN_SETUP.md) - Setup Google Sign-In
- [DOCKER_SETUP.md](./setup/DOCKER_SETUP.md) - Setup Docker

---

### 🏗️ Implementation (`docs/implementation/`)

**Tổng Quan:**
- [IMPLEMENTATION_PHASES.md](./implementation/IMPLEMENTATION_PHASES.md) - Tổng quan các phase implementation

**Các Phase:**
- [PHASE_1_FOUNDATION.md](./implementation/PHASE_1_FOUNDATION.md) - Phase 1: Foundation (bao gồm quick start)
- [PHASE_2_NORMALIZATION.md](./implementation/PHASE_2_NORMALIZATION.md) - Phase 2: Normalization (bao gồm issues fixed)
- [PHASE_3_QUERY_SEARCH.md](./implementation/PHASE_3_QUERY_SEARCH.md) - Phase 3: Query & Search
- [PHASE_4_ASYNC_PROCESSING.md](./implementation/PHASE_4_ASYNC_PROCESSING.md) - Phase 4: Async Processing
- [PHASE_5_OPTIMIZATION.md](./implementation/PHASE_5_OPTIMIZATION.md) - Phase 5: Optimization

---

### 🐛 Troubleshooting (`docs/troubleshooting/`)

- [TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md) - Hướng dẫn xử lý lỗi chung
- [FIX_ORIGIN_ERROR.md](./troubleshooting/FIX_ORIGIN_ERROR.md) - Sửa lỗi CORS/Origin
- [CHECK_ORIGIN_ISSUES.md](./troubleshooting/CHECK_ORIGIN_ISSUES.md) - Kiểm tra vấn đề Origin
- [FIX_PORT_5433.md](./troubleshooting/FIX_PORT_5433.md) - Sửa lỗi port 5433
- [FIX_PASSWORD_AND_VECTOR.md](./troubleshooting/FIX_PASSWORD_AND_VECTOR.md) - Sửa lỗi password và vector
- [SCHEMA_SCRIPT_ISSUES.md](./troubleshooting/SCHEMA_SCRIPT_ISSUES.md) - Vấn đề khi chạy schema script
- [AUTH_AND_PERSISTENCE_FIX.md](./troubleshooting/AUTH_AND_PERSISTENCE_FIX.md) - Sửa lỗi authentication và persistence
- [DOCKER_TROUBLESHOOTING.md](./troubleshooting/DOCKER_TROUBLESHOOTING.md) - Xử lý lỗi Docker

---

### 📖 Guides (`docs/guides/`)

**Quick Start:**
- [QUICK_START.md](./guides/QUICK_START.md) - Hướng dẫn khởi động nhanh
- [WHERE_TO_RUN.md](./guides/WHERE_TO_RUN.md) - Vị trí chạy lệnh

**System Workflows:**
- [SYSTEM_WORKFLOWS.md](./guides/SYSTEM_WORKFLOWS.md) - **Tài liệu tổng hợp mô tả tất cả các luồng hoạt động hệ thống**
- [WORKFLOW_EXAMPLE.md](./guides/WORKFLOW_EXAMPLE.md) - **Ví dụ trực quan: Xử lý một đoạn truyện từ đầu đến cuối** ⭐
- [WORKFLOW_ISSUES.md](./guides/WORKFLOW_ISSUES.md) - **Các vấn đề còn tồn tại trong các luồng hoạt động** ⚠️
- [FIX_PLAN.md](./guides/FIX_PLAN.md) - **Kế hoạch chi tiết để sửa các vấn đề** 🔧

**UI/UX Design:**
- [FIGMA_MAKE_PROMPT.md](./guides/FIGMA_MAKE_PROMPT.md) - **Prompt để Figma Make tạo UI components** 🎨
- [FIGMA_REVIEW_GUIDE.md](./guides/FIGMA_REVIEW_GUIDE.md) - **Hướng dẫn review UI design từ Figma** 🔍
- [FIGMA_COMMUNITY_PUBLISH.md](./guides/FIGMA_COMMUNITY_PUBLISH.md) - **Hướng dẫn publish design lên Figma Community** 📤
- [UI_IMPLEMENTATION_PLAN.md](./guides/UI_IMPLEMENTATION_PLAN.md) - **Kế hoạch implementation UI upgrade từ Figma** 🚀

**Data Flow & Analysis:**
- [GOOGLE_DOCS_TO_DB_FLOW.md](./guides/GOOGLE_DOCS_TO_DB_FLOW.md) - Luồng dữ liệu từ Google Docs đến DB
- [DATA_ANALYSIS_FLOW.md](./guides/DATA_ANALYSIS_FLOW.md) - Luồng phân tích dữ liệu
- [VIEW_DATA_FLOW_LOGS.md](./guides/VIEW_DATA_FLOW_LOGS.md) - Xem logs data flow
- [MIGRATION_DATA_FLOW_LOGS.md](./guides/MIGRATION_DATA_FLOW_LOGS.md) - Migration data flow logs
- [VIEW_PROCESSED_RESULTS.md](./guides/VIEW_PROCESSED_RESULTS.md) - Xem kết quả đã xử lý

**Features:**
- [SEMANTIC_SEARCH_IMPLEMENTATION.md](./guides/SEMANTIC_SEARCH_IMPLEMENTATION.md) - Implementation semantic search
- [LOCAL_EMBEDDING_GUIDE.md](./guides/LOCAL_EMBEDDING_GUIDE.md) - Hướng dẫn local embedding
- [QUICK_START_LOCAL_EMBEDDING.md](./guides/QUICK_START_LOCAL_EMBEDDING.md) - Quick start local embedding

**Utilities:**
- [START_SERVICES.md](./guides/START_SERVICES.md) - Khởi động services
- [QUICK_COMMANDS_WINDOWS.md](./guides/QUICK_COMMANDS_WINDOWS.md) - Các lệnh nhanh trên Windows
- [IMPLEMENTATION_CHECKLIST.md](./guides/IMPLEMENTATION_CHECKLIST.md) - Checklist implementation

---

### 🏛️ Architecture (`docs/architecture/`)

**UI & Design:**
- [UI_UPGRADE_PLAN.md](./architecture/UI_UPGRADE_PLAN.md) - Kế hoạch nâng cấp UI
- [UI_FIX_PLAN.md](./architecture/UI_FIX_PLAN.md) - Kế hoạch sửa lỗi UI
- [ui_update.md](./architecture/ui_update.md) - Cập nhật UI

**Storage & Data:**
- [STORAGE_ARCHITECTURE_PLAN.md](./architecture/STORAGE_ARCHITECTURE_PLAN.md) - Kế hoạch kiến trúc storage
- [STORAGE_MASTER_PLAN.md](./architecture/STORAGE_MASTER_PLAN.md) - Master plan storage
- [STORAGE_PLAN_SUMMARY.md](./architecture/STORAGE_PLAN_SUMMARY.md) - Tóm tắt kế hoạch storage
- [STORAGE_ISSUES_SOLUTIONS.md](./architecture/STORAGE_ISSUES_SOLUTIONS.md) - Vấn đề và giải pháp storage

**Desktop App:**
- [DESKTOP_APP_ARCHITECTURE.md](./architecture/DESKTOP_APP_ARCHITECTURE.md) - Kiến trúc desktop app
- [DESKTOP_APP_SUMMARY.md](./architecture/DESKTOP_APP_SUMMARY.md) - Tóm tắt desktop app
- [DESKTOP_APP_AI_REQUIREMENTS.md](./architecture/DESKTOP_APP_AI_REQUIREMENTS.md) - Yêu cầu AI cho desktop app

**General:**
- [FREE_FIRST_ARCHITECTURE.md](./architecture/FREE_FIRST_ARCHITECTURE.md) - Kiến trúc free-first

---

## 🔍 Tìm Kiếm Nhanh

### Bắt Đầu Từ Đâu?

1. **Lần đầu setup?** → Xem [QUICK_START.md](./guides/QUICK_START.md)
2. **Xem ví dụ trực quan?** → Xem [WORKFLOW_EXAMPLE.md](./guides/WORKFLOW_EXAMPLE.md) ⭐
3. **Hiểu các luồng hoạt động?** → Xem [SYSTEM_WORKFLOWS.md](./guides/SYSTEM_WORKFLOWS.md)
4. **Xem các vấn đề còn tồn tại?** → Xem [WORKFLOW_ISSUES.md](./guides/WORKFLOW_ISSUES.md) ⚠️
5. **Lập plan sửa các vấn đề?** → Xem [FIX_PLAN.md](./guides/FIX_PLAN.md) 🔧
6. **Cài đặt PostgreSQL?** → Xem [SETUP_POSTGRESQL_WINDOWS.md](./setup/SETUP_POSTGRESQL_WINDOWS.md)
7. **Setup database?** → Xem [DATABASE_SETUP.md](./setup/DATABASE_SETUP.md)
8. **Cài đặt pgvector?** → Xem [PGVECTOR_SETUP.md](./setup/PGVECTOR_SETUP.md)
9. **Gặp lỗi?** → Xem [TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md)
10. **Xem tình trạng dự án?** → Xem [PROJECT_STATUS.md](./PROJECT_STATUS.md)

### Theo Chủ Đề

**Database:**
- Setup: `docs/setup/DATABASE_*.md`
- Troubleshooting: `docs/troubleshooting/FIX_*.md`

**Implementation:**
- Tổng quan: `docs/implementation/IMPLEMENTATION_PHASES.md`
- Chi tiết: `docs/implementation/PHASE_*.md`

**UI/UX:**
- Plans: `docs/architecture/UI_*.md`

**Data Flow:**
- Guides: `docs/guides/*_FLOW.md`, `docs/guides/VIEW_*.md`

---

## 📝 Ghi Chú

- Tất cả file `.md` mới sẽ được tự động lưu vào thư mục `docs/` với phân loại phù hợp
- File `README.md` ở root là file chính, không di chuyển
- File trong `components/docs/` là tài liệu component, giữ nguyên

---

**Last Updated:** 2024

