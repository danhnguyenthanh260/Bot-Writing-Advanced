-- Migration Script: Update vector dimensions from 768 to 384
-- For Local Embedding Provider (all-MiniLM-L6-v2)
-- 
-- ⚠️ WARNING: This will drop existing embeddings!
-- Only run this if you want to regenerate embeddings with Local model.
--
-- Usage:
--   psql -U postgres -d bot_writing_advanced -f server/db/migrate_to_384.sql

BEGIN;

-- Drop existing embeddings (will be regenerated with Local model)
UPDATE recent_chapters SET embedding_vector = NULL;
UPDATE chapter_chunks SET chunk_embedding = NULL;
DELETE FROM embedding_cache;

-- Update column types
ALTER TABLE recent_chapters 
  ALTER COLUMN embedding_vector TYPE vector(384);

ALTER TABLE chapter_chunks 
  ALTER COLUMN chunk_embedding TYPE vector(384);

ALTER TABLE embedding_cache 
  ALTER COLUMN embedding_vector TYPE vector(384);

-- Update archive table if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapter_archive') THEN
    ALTER TABLE chapter_archive 
      ALTER COLUMN embedding_vector TYPE vector(384);
  END IF;
END $$;

COMMIT;

-- Verify migration
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name IN ('recent_chapters', 'chapter_chunks', 'embedding_cache')
  AND column_name LIKE '%embedding%'
ORDER BY table_name, column_name;



