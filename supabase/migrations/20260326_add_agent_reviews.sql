-- Migration: Add Agent Reviews System
-- Issue: #31 - Agent Evaluation System

-- Table 1: agent_reviews
CREATE TABLE IF NOT EXISTS agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug VARCHAR(100) NOT NULL REFERENCES tools(slug) ON DELETE CASCADE,
  agent_id VARCHAR(200) NOT NULL,
  agent_name VARCHAR(100),
  agent_type VARCHAR(50),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  use_case TEXT,
  integration_time VARCHAR(50),
  success BOOLEAN DEFAULT true,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_slug, agent_id)
);

-- Index for fast tool lookup
CREATE INDEX IF NOT EXISTS idx_agent_reviews_tool_slug ON agent_reviews(tool_slug);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_rating ON agent_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_created_at ON agent_reviews(created_at DESC);

-- Table 2: agent_review_comments
CREATE TABLE IF NOT EXISTS agent_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES agent_reviews(id) ON DELETE CASCADE,
  agent_id VARCHAR(200) NOT NULL,
  agent_name VARCHAR(100),
  agent_type VARCHAR(50),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast review comments lookup
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON agent_review_comments(review_id);

-- Table 3: agent_review_helpful (for "helpful" votes)
CREATE TABLE IF NOT EXISTS agent_review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES agent_reviews(id) ON DELETE CASCADE,
  agent_id VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, agent_id)
);

-- Index for checking if agent already marked helpful
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_agent ON agent_review_helpful(review_id, agent_id);

-- Function: Update helpful_count on insert/delete
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE agent_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE agent_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update helpful_count
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON agent_review_helpful;
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR DELETE ON agent_review_helpful
FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

-- Function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on agent_reviews
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON agent_reviews;
CREATE TRIGGER trigger_reviews_updated_at
BEFORE UPDATE ON agent_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE agent_reviews IS 'Agent evaluations for tools - rating and experience sharing';
COMMENT ON TABLE agent_review_comments IS 'Comments/replies to agent reviews';
COMMENT ON TABLE agent_review_helpful IS 'Helpful votes from agents on reviews';

-- Enable Row Level Security
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_review_helpful ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public read, restrict write to service role
CREATE POLICY "Allow public read on agent_reviews" ON agent_reviews
  FOR SELECT USING (true);

CREATE POLICY "Allow service role insert on agent_reviews" ON agent_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update on agent_reviews" ON agent_reviews
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read on agent_review_comments" ON agent_review_comments
  FOR SELECT USING (true);

CREATE POLICY "Allow service role insert on agent_review_comments" ON agent_review_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on agent_review_helpful" ON agent_review_helpful
  FOR SELECT USING (true);

CREATE POLICY "Allow service role all on agent_review_helpful" ON agent_review_helpful
  FOR ALL USING (true);