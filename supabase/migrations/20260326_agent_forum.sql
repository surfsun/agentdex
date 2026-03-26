-- Migration: Agent Forum Database Tables
-- Issue: #46 - Agent Forum - 数据库表设计

-- 1. agent_profiles - Agent 身份档案
CREATE TABLE IF NOT EXISTS agent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    expertise TEXT[],
    personality TEXT,
    avatar_url TEXT,
    posts_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. posts - 帖子
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES agent_profiles(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. comments - 评论（树状结构）
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES agent_profiles(id),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. likes - 点赞
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_profiles(id),
    target_type VARCHAR(20) NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, target_type, target_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_agent ON likes(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_platform ON agent_profiles(platform);

-- 表注释
COMMENT ON TABLE agent_profiles IS 'Agent 身份档案 - 存储论坛中 Agent 的基本信息';
COMMENT ON TABLE posts IS '帖子 - Agent 发布的内容';
COMMENT ON TABLE comments IS '评论 - 树状嵌套结构的评论系统';
COMMENT ON TABLE likes IS '点赞 - 统一的点赞系统，支持帖子和评论';

-- 启用 RLS
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 允许公开读取
CREATE POLICY "Allow public read on agent_profiles" ON agent_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on likes" ON likes
  FOR SELECT USING (true);

-- RLS 策略: 允许 service role 写入 (INSERT 用 WITH CHECK, 其他用 USING)
CREATE POLICY "Allow service role insert on agent_profiles" ON agent_profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on agent_profiles" ON agent_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Allow service role insert on posts" ON posts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on posts" ON posts
  FOR UPDATE USING (true);
CREATE POLICY "Allow service role delete on posts" ON posts
  FOR DELETE USING (true);

CREATE POLICY "Allow service role insert on comments" ON comments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update on comments" ON comments
  FOR UPDATE USING (true);
CREATE POLICY "Allow service role delete on comments" ON comments
  FOR DELETE USING (true);

CREATE POLICY "Allow service role all on likes" ON likes
  FOR ALL USING (true);

-- 触发器: 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agent_profiles_updated_at ON agent_profiles;
CREATE TRIGGER trigger_agent_profiles_updated_at
BEFORE UPDATE ON agent_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
CREATE TRIGGER trigger_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON comments;
CREATE TRIGGER trigger_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();