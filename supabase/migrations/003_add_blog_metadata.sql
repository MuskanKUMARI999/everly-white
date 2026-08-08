-- Add metadata column to blog_posts for category, date, readTime, authorRole

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
