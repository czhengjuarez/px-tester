-- Add screenshot_url column to sites table (if not exists)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This migration may fail if columns already exist, which is expected

-- Add embedding_id for vector search
-- ALTER TABLE sites ADD COLUMN embedding_id TEXT;

-- Create index on embedding_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_embedding_id ON sites(embedding_id);
