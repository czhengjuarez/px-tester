-- Add screenshot_url column to sites table
ALTER TABLE sites ADD COLUMN screenshot_url TEXT;

-- Add thumbnail_url column for optimized thumbnails
ALTER TABLE sites ADD COLUMN thumbnail_url TEXT;

-- Add embedding_id for vector search
ALTER TABLE sites ADD COLUMN embedding_id TEXT;

-- Create index on embedding_id for faster lookups
CREATE INDEX idx_sites_embedding_id ON sites(embedding_id);
