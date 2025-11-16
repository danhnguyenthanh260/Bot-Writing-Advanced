-- Migration: Add data_flow_logs table
-- This migration adds the data_flow_logs table for tracking data processing pipeline events

-- Create data_flow_logs table
CREATE TABLE IF NOT EXISTS data_flow_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'book' | 'chapter' | 'chunk' | 'system'
  entity_id UUID,
  stage TEXT NOT NULL, -- 'ingest' | 'extraction' | 'embedding' | 'storage' | 'validation' | 'cache'
  level TEXT NOT NULL, -- 'info' | 'warn' | 'error' | 'debug'
  message TEXT NOT NULL,
  metadata JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_data_flow_logs_entity ON data_flow_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_flow_logs_stage ON data_flow_logs(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_flow_logs_level ON data_flow_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_flow_logs_created ON data_flow_logs(created_at DESC);

-- Verify the table was created
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'data_flow_logs'
  ) THEN
    RAISE NOTICE '✓ data_flow_logs table created successfully';
  ELSE
    RAISE EXCEPTION '✗ Failed to create data_flow_logs table';
  END IF;
END $$;

