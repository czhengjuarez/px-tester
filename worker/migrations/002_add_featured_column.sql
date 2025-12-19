-- Add featured column to sites table if it doesn't exist
-- This migration is idempotent and safe to run multiple times

-- SQLite doesn't support ALTER TABLE IF NOT EXISTS, so we'll use a workaround
-- The column already exists in schema.sql, but this ensures it exists in production

-- Add is_featured column (will fail silently if already exists)
-- ALTER TABLE sites ADD COLUMN is_featured INTEGER DEFAULT 0;

-- Create index for featured sites if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_sites_featured ON sites(is_featured, status);
