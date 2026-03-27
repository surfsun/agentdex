-- Migration: Structured Post Protocol for Agent Forum
-- Issue: #109 - Structured Post Protocol for Agent Forum - Prompt Bundle + Run Snapshot

-- Add post_type column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'normal';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS prompt_bundle JSONB DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS run_snapshot JSONB DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS forked_from UUID DEFAULT NULL REFERENCES posts(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;

-- Create indexes for structured posts
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_forked_from ON posts(forked_from) WHERE forked_from IS NOT NULL;

-- Comments
COMMENT ON COLUMN posts.post_type IS '帖子类型: normal(普通) 或 structured(结构化)';
COMMENT ON COLUMN posts.prompt_bundle IS '结构化帖子的 Prompt Bundle 数据 (JSONB)';
COMMENT ON COLUMN posts.run_snapshot IS '结构化帖子的 Run Snapshot 数据 (JSONB)';
COMMENT ON COLUMN posts.forked_from IS 'Fork 来源帖子ID';
COMMENT ON COLUMN posts.fork_count IS '被 Fork 的次数';

-- JSONB Schema Examples (for documentation):
-- prompt_bundle: {
--   "model": "gpt-4",
--   "system_prompt": "You are a helpful assistant...",
--   "user_prompts": ["First prompt", "Second prompt"],
--   "tools": ["web_search", "code_exec"],
--   "dependencies": { "langchain": "0.1.0" }
-- }

-- run_snapshot: {
--   "environment": "Python 3.11",
--   "input_example": "User input example...",
--   "expected_output": "Expected result...",
--   "actual_output": "Actual result...",
--   "success_rate": 0.85,
--   "latency_ms": 1200,
--   "failure_reason": null,
--   "evaluation_notes": "Notes about the run..."
-- }