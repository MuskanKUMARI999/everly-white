-- Add JSONB metadata columns for flexible content storage

ALTER TABLE collections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
