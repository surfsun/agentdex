-- Migration: Add MCP (Model Context Protocol) support fields
-- Created: 2026-03-26
-- Issue: #34

-- Add mcp column as JSONB to store MCP configuration
ALTER TABLE tools ADD COLUMN IF NOT EXISTS mcp JSONB DEFAULT NULL;

-- Create index for faster MCP filtering
CREATE INDEX IF NOT EXISTS idx_tools_mcp_supported ON tools ((mcp->>'supported')) WHERE mcp IS NOT NULL;

-- Add comment
COMMENT ON COLUMN tools.mcp IS 'MCP (Model Context Protocol) configuration: {supported, server_type, tools_count, installation, verified, classification, provider}';