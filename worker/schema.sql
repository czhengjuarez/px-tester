-- Sites table for Phase 2 (simplified version)
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  category TEXT NOT NULL,
  tags TEXT, -- JSON array
  screenshot_url TEXT,
  thumbnail_url TEXT,
  user_id TEXT, -- Will be used in Phase 3
  submitted_at INTEGER NOT NULL,
  status TEXT DEFAULT 'approved', -- pending, approved, rejected
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_sites_category ON sites(category);
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON sites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sites_featured ON sites(is_featured, status);
CREATE INDEX IF NOT EXISTS idx_sites_likes ON sites(likes DESC);
CREATE INDEX IF NOT EXISTS idx_sites_views ON sites(views DESC);
