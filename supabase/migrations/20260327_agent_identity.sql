-- Migration: AI Agent Identity System
-- Issue: #84 - AI Agent 身份认证系统设计

-- 1. user_identities - 用户身份（渠道来源）
CREATE TABLE IF NOT EXISTS user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(50) NOT NULL,           -- 'feishu', 'telegram', 'web', etc.
    channel_user_id VARCHAR(255) NOT NULL,  -- ou_xxx, telegram_xxx, etc.
    display_name VARCHAR(100),
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel, channel_user_id)
);

-- 2. agent_identities - Agent 身份
CREATE TABLE IF NOT EXISTS agent_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identity_id UUID REFERENCES user_identities(id) ON DELETE CASCADE,
    agent_profile_id UUID REFERENCES agent_profiles(id) ON DELETE SET NULL,
    agent_name VARCHAR(50) NOT NULL,
    agent_slug VARCHAR(50) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. service_bindings - 第三方服务绑定
CREATE TABLE IF NOT EXISTS service_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_identity_id UUID REFERENCES agent_identities(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL,            -- 'agentdex', 'moltbook', 'openclaw', etc.
    service_user_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    identity_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_identity_id, service)
);

-- 4. identity_tokens - 身份令牌（临时令牌）
CREATE TABLE IF NOT EXISTS identity_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_identity_id UUID REFERENCES agent_identities(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    token_type VARCHAR(20) DEFAULT 'access' CHECK (token_type IN ('access', 'refresh', 'identity')),
    service VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_identities_channel ON user_identities(channel);
CREATE INDEX IF NOT EXISTS idx_user_identities_channel_user ON user_identities(channel_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_identities_user ON agent_identities(user_identity_id);
CREATE INDEX IF NOT EXISTS idx_agent_identities_profile ON agent_identities(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_identities_api_key ON agent_identities(api_key);
CREATE INDEX IF NOT EXISTS idx_agent_identities_slug ON agent_identities(agent_slug);
CREATE INDEX IF NOT EXISTS idx_service_bindings_agent ON service_bindings(agent_identity_id);
CREATE INDEX IF NOT EXISTS idx_service_bindings_service ON service_bindings(service);
CREATE INDEX IF NOT EXISTS idx_identity_tokens_agent ON identity_tokens(agent_identity_id);
CREATE INDEX IF NOT EXISTS idx_identity_tokens_token ON identity_tokens(token);
CREATE INDEX IF NOT EXISTS idx_identity_tokens_expires ON identity_tokens(expires_at);

-- 表注释
COMMENT ON TABLE user_identities IS '用户身份 - 存储来自不同渠道的用户身份信息';
COMMENT ON TABLE agent_identities IS 'Agent 身份 - 用户拥有的 Agent 实例，包含 API Key';
COMMENT ON TABLE service_bindings IS '第三方服务绑定 - Agent 与外部服务的身份关联';
COMMENT ON TABLE identity_tokens IS '身份令牌 - 临时访问令牌，用于跨服务认证';

-- 启用 RLS
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_tokens ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 允许 service role 完全访问
CREATE POLICY "Allow service role all on user_identities" ON user_identities
    FOR ALL USING (true);
CREATE POLICY "Allow service role all on agent_identities" ON agent_identities
    FOR ALL USING (true);
CREATE POLICY "Allow service role all on service_bindings" ON service_bindings
    FOR ALL USING (true);
CREATE POLICY "Allow service role all on identity_tokens" ON identity_tokens
    FOR ALL USING (true);

-- 触发器: 自动更新 updated_at
DROP TRIGGER IF EXISTS trigger_user_identities_updated_at ON user_identities;
CREATE TRIGGER trigger_user_identities_updated_at
    BEFORE UPDATE ON user_identities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_agent_identities_updated_at ON agent_identities;
CREATE TRIGGER trigger_agent_identities_updated_at
    BEFORE UPDATE ON agent_identities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_service_bindings_updated_at ON service_bindings;
CREATE TRIGGER trigger_service_bindings_updated_at
    BEFORE UPDATE ON service_bindings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Helper function: 清理过期令牌
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM identity_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Helper function: 生成 agent_slug
CREATE OR REPLACE FUNCTION generate_agent_slug(agent_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- 生成基础 slug: 小写、去空格、加随机后缀
    base_slug := lower(regexp_replace(agent_name, '[^a-zA-Z0-9]', '-', 'g'));
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- 添加 6 位随机字符
    final_slug := base_slug || '-' || encode(gen_random_bytes(3), 'hex');
    
    -- 检查唯一性（最多尝试 10 次）
    WHILE EXISTS (SELECT 1 FROM agent_identities WHERE agent_slug = final_slug) AND counter < 10 LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || encode(gen_random_bytes(3), 'hex');
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;