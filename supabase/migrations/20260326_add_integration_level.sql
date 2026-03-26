-- Migration: Add integration level data
-- Issue: #38 - 工具集成难度评估系统

-- Add integration_level column if not exists
ALTER TABLE tools ADD COLUMN IF NOT EXISTS integration_level VARCHAR(50) 
  CHECK (integration_level IN ('quick_start', 'standard', 'advanced'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tools_integration_level ON tools(integration_level);

-- Comment on column
COMMENT ON COLUMN tools.integration_level IS 'Integration difficulty level: quick_start (< 15 min), standard (15-60 min), advanced (> 60 min)';

-- Update integration_level based on integration_minutes for existing tools
UPDATE tools SET integration_level = 
  CASE 
    WHEN integration_minutes <= 15 THEN 'quick_start'
    WHEN integration_minutes <= 60 THEN 'standard'
    WHEN integration_minutes > 60 THEN 'advanced'
    ELSE NULL
  END
WHERE integration_minutes IS NOT NULL AND integration_level IS NULL;

-- Fill integration_level for tools without integration_minutes based on category and complexity
-- Memory tools (usually simple API)
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug IN ('mem0', 'zep', 'letta') AND integration_level IS NULL;

-- Web tools (varied complexity)
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 2
WHERE slug = 'jina-reader' AND integration_level IS NULL;

UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug = 'x402' AND integration_level IS NULL;

UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug IN ('browserbase', 'firecrawl') AND integration_level IS NULL;

UPDATE tools SET integration_level = 'standard', integration_minutes = 20
WHERE slug IN ('apify', 'stagehand') AND integration_level IS NULL;

-- Execution tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug = 'e2b' AND integration_level IS NULL;

UPDATE tools SET integration_level = 'standard', integration_minutes = 30
WHERE slug IN ('daytona', 'modal') AND integration_level IS NULL;

-- Communication tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug = 'agentmail' AND integration_level IS NULL;

UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug IN ('composio', 'sendgrid') AND integration_level IS NULL;

-- Framework tools
UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug = 'langchain' AND integration_level IS NULL;

UPDATE tools SET integration_level = 'standard', integration_minutes = 20
WHERE slug IN ('crewai', 'autogen') AND integration_level IS NULL;

-- Observability tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug IN ('langfuse', 'arize-phoenix') AND integration_level IS NULL;

-- Payment tools
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 5
WHERE slug = 'x402' AND integration_level IS NULL;

UPDATE tools SET integration_level = 'standard', integration_minutes = 30
WHERE slug IN ('stripe', 'braintree') AND integration_level IS NULL;

-- Security tools
UPDATE tools SET integration_level = 'standard', integration_minutes = 15
WHERE slug IN ('polygon', 'pangea') AND integration_level IS NULL;

-- Set default for remaining tools without integration_level
-- Most agent tools are quick_start by default
UPDATE tools SET integration_level = 'quick_start', integration_minutes = 10
WHERE agent_friendly = true AND integration_level IS NULL;

-- Non-agent-friendly tools tend to be more complex
UPDATE tools SET integration_level = 'standard', integration_minutes = 30
WHERE agent_friendly = false AND integration_level IS NULL;

-- Verify the counts
SELECT integration_level, COUNT(*) FROM tools GROUP BY integration_level ORDER BY integration_level;