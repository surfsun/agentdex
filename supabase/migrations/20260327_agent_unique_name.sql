-- Migration: Add unique index for agent name+platform
-- Ensures agent names are unique within a platform

-- Create unique index instead of constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_profiles_name_platform_unique 
ON agent_profiles (name, platform);