-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Insert existing categories from seed data
INSERT OR IGNORE INTO categories (name, slug, description) VALUES
  ('SaaS', 'saas', 'Software as a Service applications'),
  ('Portfolio', 'portfolio', 'Personal and professional portfolios'),
  ('E-commerce', 'ecommerce', 'Online stores and shopping platforms'),
  ('Blog', 'blog', 'Blogs and content platforms'),
  ('Agency', 'agency', 'Agency and business websites'),
  ('Productivity', 'productivity', 'Productivity and workflow tools'),
  ('Design', 'design', 'Design resources and tools'),
  ('Development', 'development', 'Developer tools and resources');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
