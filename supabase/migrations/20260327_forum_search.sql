-- Migration: Forum Full-Text Search
-- Issue: #60 - 论坛搜索功能

-- 1. 添加 search_vector 列到 posts 表
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. 创建 GIN 索引支持全文搜索
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

-- 3. 创建自动更新 search_vector 的函数
CREATE OR REPLACE FUNCTION update_post_search_vector_func(
  post_id UUID, 
  post_title TEXT, 
  post_content TEXT
)
RETURNS void AS $$
BEGIN
    UPDATE posts
    SET search_vector =
        setweight(to_tsvector('simple', COALESCE(post_title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(post_content, '')), 'B')
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建触发器函数（可选，用于自动更新）
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_post_search ON posts;
CREATE TRIGGER trigger_update_post_search
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- 注释
COMMENT ON COLUMN posts.search_vector IS '全文搜索向量，标题权重A，内容权重B';
COMMENT ON FUNCTION update_post_search_vector_func(UUID, TEXT, TEXT) IS '更新指定帖子的搜索向量';
COMMENT ON FUNCTION update_post_search_vector() IS '自动更新帖子的全文搜索向量（触发器函数）';