-- Migration: Fix integration_level data
-- Issue: #69 - Tool Directory Filter 计数修复
-- 修复数据库中工具缺少 integration_level 字段值的问题

-- 1. 确保 integration_level 列存在
ALTER TABLE tools ADD COLUMN IF NOT EXISTS integration_level VARCHAR(50) 
  CHECK (integration_level IN ('quick_start', 'standard', 'advanced'));

-- 2. 确保 integration_minutes 列存在
ALTER TABLE tools ADD COLUMN IF NOT EXISTS integration_minutes INTEGER;

-- 3. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_tools_integration_level ON tools(integration_level);

-- 4. 根据 integration_minutes 设置 integration_level（如果有分钟数但没级别）
UPDATE tools SET integration_level = 
  CASE 
    WHEN integration_minutes <= 15 THEN 'quick_start'
    WHEN integration_minutes <= 60 THEN 'standard'
    WHEN integration_minutes > 60 THEN 'advanced'
    ELSE NULL
  END
WHERE integration_minutes IS NOT NULL 
  AND (integration_level IS NULL OR integration_level = '');

-- 5. 为特定工具设置 integration_level（根据工具特性）
-- Memory tools - 快速集成
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug IN ('mem0', 'zep', 'letta') AND (integration_level IS NULL OR integration_level = '');

-- Web tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 2
WHERE slug = 'jina-reader' AND (integration_level IS NULL OR integration_level = '');

UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug IN ('x402') AND (integration_level IS NULL OR integration_level = '');

UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug IN ('browserbase', 'firecrawl') AND (integration_level IS NULL OR integration_level = '');

UPDATE tools SET integration_level = 'standard', integration_minutes = 20
WHERE slug IN ('apify', 'stagehand') AND (integration_level IS NULL OR integration_level = '');

-- Execution tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug = 'e2b' AND (integration_level IS NULL OR integration_level = '');

UPDATE tools SET integration_level = 'standard', integration_minutes = 30
WHERE slug IN ('daytona', 'modal') AND (integration_level IS NULL OR integration_level = '');

-- Communication tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug = 'agentmail' AND (integration_level IS NULL OR integration_level = '');

UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug IN ('composio', 'sendgrid') AND (integration_level IS NULL OR integration_level = '');

-- Framework tools
UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug = 'langchain' AND (integration_level IS NULL OR integration_level = '');

UPDATE tools SET integration_level = 'standard', integration_minutes = 20
WHERE slug IN ('crewai', 'autogen') AND (integration_level IS NULL OR integration_level = '');

-- Observability tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug IN ('langfuse', 'arize-phoenix') AND (integration_level IS NULL OR integration_level = '');

-- Payment tools
UPDATE tools SET integration_level = 'standard', integration_minutes = 30
WHERE slug IN ('stripe', 'braintree') AND (integration_level IS NULL OR integration_level = '');

-- Security tools
UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug IN ('polygon', 'pangea') AND (integration_level IS NULL OR integration_level = '');

-- Social tools (Moltbook, etc.)
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 1
WHERE slug = 'moltbook' AND (integration_level IS NULL OR integration_level = '');

-- Integration tools
UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE category = 'integration' AND (integration_level IS NULL OR integration_level = '');

-- 6. 为剩余工具设置默认值
-- Agent-friendly 工具默认快速集成
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 10
WHERE agent_friendly = true 
  AND (integration_level IS NULL OR integration_level = '');

-- 非 agent-friendly 工具默认标准集成
UPDATE tools SET integration_level = 'standard', integration_minutes = 30
WHERE agent_friendly = false 
  AND (integration_level IS NULL OR integration_level = '');

-- 7. 验证修复结果
SELECT 
  integration_level, 
  COUNT(*) as count 
FROM tools 
WHERE status = 'active'
GROUP BY integration_level 
ORDER BY integration_level;

-- 8. 输出总览
SELECT 
  'Total active tools' as metric,
  COUNT(*) as value
FROM tools 
WHERE status = 'active'
UNION ALL
SELECT 
  'Tools with integration_level',
  COUNT(*)
FROM tools 
WHERE status = 'active' AND integration_level IS NOT NULL;

COMMENT ON COLUMN tools.integration_level IS 'Integration difficulty level: quick_start (< 15 min), standard (15-60 min), advanced (> 60 min)';