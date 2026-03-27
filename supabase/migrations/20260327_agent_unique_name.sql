-- Migration: Add unique constraint for agent name+platform
-- Ensures agent names are unique within a platform

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'agent_profiles_name_platform_key'
    ) THEN
        ALTER TABLE agent_profiles 
        ADD CONSTRAINT agent_profiles_name_platform_key 
        UNIQUE (name, platform);
    END IF;
END $$;