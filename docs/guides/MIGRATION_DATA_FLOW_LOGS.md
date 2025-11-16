# Migration: Data Flow Logs Table

Hướng dẫn áp dụng bảng `data_flow_logs` vào PostgreSQL.

## Cách 1: Sử dụng Script TypeScript (Khuyến nghị)

Chạy script migration:

```bash
npx tsx server/db/migrateDataFlowLogs.ts
```

Script này sẽ:
- Kiểm tra xem bảng đã tồn tại chưa
- Tạo bảng nếu chưa có
- Tạo các index cần thiết
- Báo cáo trạng thái migration

## Cách 2: Sử dụng SQL trực tiếp

Nếu bạn muốn chạy SQL trực tiếp trong PostgreSQL:

```bash
psql -U your_username -d your_database -f server/db/migrate_data_flow_logs.sql
```

Hoặc trong psql console:

```sql
\i server/db/migrate_data_flow_logs.sql
```

## Cách 3: Sử dụng deploySchema (Nếu chưa có schema)

Nếu bạn chưa có schema nào, có thể chạy toàn bộ schema (bao gồm cả `data_flow_logs`):

```bash
npx tsx server/db/migrate.ts
```

## Kiểm tra Migration

Sau khi migration, kiểm tra xem bảng đã được tạo chưa:

```bash
npx tsx server/db/checkSchema.ts
```

Hoặc kiểm tra trực tiếp trong PostgreSQL:

```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'data_flow_logs';

-- Xem cấu trúc bảng
\d data_flow_logs

-- Xem các index
SELECT indexname FROM pg_indexes 
WHERE tablename = 'data_flow_logs';
```

## Cấu trúc Bảng

Bảng `data_flow_logs` có các cột:

- `log_id`: UUID (Primary Key)
- `entity_type`: TEXT ('book' | 'chapter' | 'chunk' | 'system')
- `entity_id`: UUID (nullable)
- `stage`: TEXT ('ingest' | 'extraction' | 'embedding' | 'storage' | 'validation' | 'cache')
- `level`: TEXT ('info' | 'warn' | 'error' | 'debug')
- `message`: TEXT
- `metadata`: JSONB (nullable)
- `duration_ms`: INTEGER (nullable)
- `created_at`: TIMESTAMP

## Indexes

Bảng có 4 indexes để tối ưu truy vấn:

1. `idx_data_flow_logs_entity`: (entity_type, entity_id, created_at DESC)
2. `idx_data_flow_logs_stage`: (stage, created_at DESC)
3. `idx_data_flow_logs_level`: (level, created_at DESC)
4. `idx_data_flow_logs_created`: (created_at DESC)

## Lưu ý

- Migration sử dụng `CREATE TABLE IF NOT EXISTS`, nên an toàn khi chạy nhiều lần
- Nếu bảng đã tồn tại, script sẽ chỉ kiểm tra và tạo các index còn thiếu
- Migration không xóa dữ liệu hiện có (nếu có)

