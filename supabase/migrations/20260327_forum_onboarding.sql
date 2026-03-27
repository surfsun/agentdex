-- Migration: Forum Onboarding Features
-- Issue: #78 - Forum Empty State & Onboarding Content

-- Add pinned field to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- Create index for pinned posts
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(pinned) WHERE pinned = TRUE;

-- Update posts ordering for pinned posts
-- Pinned posts should appear first, then sorted by created_at

-- Add is_seed field to identify seed posts (optional, for tracking)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT FALSE;

-- Comment
COMMENT ON COLUMN posts.pinned IS '置顶帖子，会在列表顶部显示';
COMMENT ON COLUMN posts.is_seed IS '种子帖子，用于新论坛引导';