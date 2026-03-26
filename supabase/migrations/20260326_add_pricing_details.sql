-- Migration: Add pricing_details for Cost Calculator
-- Issue: #27 - Tool Cost Estimator

-- Add pricing_details column (JSONB for flexibility)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS pricing_details JSONB DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tools_pricing_details ON tools(pricing_details) WHERE pricing_details IS NOT NULL;

-- Comment on column
COMMENT ON COLUMN tools.pricing_details IS 'Detailed pricing information for cost calculator: {model, currency, unit, rate, tiers, free_tier, scenarios, cost_factors, notes}';

-- Update pricing_details for key tools

-- Browserbase (Usage-based: $0.05/minute)
UPDATE tools SET pricing_details = '{
  "model": "usage_based",
  "currency": "USD",
  "unit": "minute",
  "rate": 0.05,
  "free_tier": {
    "included": 1000,
    "unit": "minutes/month"
  },
  "scenarios": [
    {
      "label": "Light Usage",
      "label_zh": "轻度使用",
      "description": "500 sessions/month, 3 min avg",
      "description_zh": "每月 500 次会话，平均 3 分钟",
      "monthly_cost": 15
    },
    {
      "label": "Moderate Usage",
      "label_zh": "中度使用",
      "description": "2,000 sessions/month, 5 min avg",
      "description_zh": "每月 2000 次会话，平均 5 分钟",
      "monthly_cost": 75
    },
    {
      "label": "Heavy Usage",
      "label_zh": "重度使用",
      "description": "10,000 sessions/month, 7 min avg",
      "description_zh": "每月 10000 次会话，平均 7 分钟",
      "monthly_cost": 350
    }
  ],
  "cost_factors": [
    {"name": "Sessions/day", "description": "Number of browser sessions per day", "description_zh": "每日浏览器会话数", "default_value": 100, "unit": "sessions"},
    {"name": "Avg duration", "description": "Average session duration", "description_zh": "平均会话时长", "default_value": 5, "unit": "minutes"}
  ],
  "notes": "Price varies by plan tier. Enterprise plans available.",
  "notes_zh": "价格因套餐等级而异，提供企业套餐。"
}'::jsonb
WHERE slug = 'browserbase';

-- E2B (Usage-based: $0.0002/second)
UPDATE tools SET pricing_details = '{
  "model": "usage_based",
  "currency": "USD",
  "unit": "second",
  "rate": 0.0002,
  "free_tier": {
    "included": 500,
    "unit": "seconds/month"
  },
  "scenarios": [
    {
      "label": "Light Usage",
      "label_zh": "轻度使用",
      "description": "100 code runs/day, 10 sec avg",
      "description_zh": "每日 100 次代码运行，平均 10 秒",
      "monthly_cost": 6
    },
    {
      "label": "Moderate Usage",
      "label_zh": "中度使用",
      "description": "500 code runs/day, 30 sec avg",
      "description_zh": "每日 500 次代码运行，平均 30 秒",
      "monthly_cost": 90
    },
    {
      "label": "Heavy Usage",
      "label_zh": "重度使用",
      "description": "2000 code runs/day, 60 sec avg",
      "description_zh": "每日 2000 次代码运行，平均 60 秒",
      "monthly_cost": 720
    }
  ],
  "cost_factors": [
    {"name": "Executions/day", "description": "Code executions per day", "description_zh": "每日代码执行次数", "default_value": 100, "unit": "runs"},
    {"name": "Avg duration", "description": "Average execution time", "description_zh": "平均执行时间", "default_value": 10, "unit": "seconds"}
  ],
  "notes": "Sandbox usage billed per second. CPU/GPU options available.",
  "notes_zh": "沙箱按秒计费，提供 CPU/GPU 选项。"
}'::jsonb
WHERE slug = 'e2b';

-- Mem0 (Tiered pricing)
UPDATE tools SET pricing_details = '{
  "model": "tiered",
  "currency": "USD",
  "unit": "operation",
  "free_tier": {
    "included": 10000,
    "unit": "operations/month"
  },
  "scenarios": [
    {
      "label": "Developer",
      "label_zh": "开发者",
      "description": "10K ops/month, basic features",
      "description_zh": "每月 1 万次操作，基础功能",
      "monthly_cost": 0
    },
    {
      "label": "Pro",
      "label_zh": "专业版",
      "description": "100K ops/month, advanced features",
      "description_zh": "每月 10 万次操作，高级功能",
      "monthly_cost": 49
    },
    {
      "label": "Enterprise",
      "label_zh": "企业版",
      "description": "Unlimited ops, dedicated support",
      "description_zh": "无限操作，专属支持",
      "monthly_cost": 499
    }
  ],
  "cost_factors": [
    {"name": "Memory ops", "description": "Add/search/delete operations", "description_zh": "添加/搜索/删除操作", "default_value": 5000, "unit": "ops/day"},
    {"name": "Memory size", "description": "Total memory storage", "description_zh": "总记忆存储量", "default_value": 100, "unit": "MB"}
  ],
  "notes": "Open-source version available for self-hosting.",
  "notes_zh": "提供开源版本可自托管。"
}'::jsonb
WHERE slug = 'mem0';

-- Firecrawl (Per-request pricing)
UPDATE tools SET pricing_details = '{
  "model": "per_request",
  "currency": "USD",
  "unit": "page",
  "rate": 0.001,
  "free_tier": {
    "included": 500,
    "unit": "pages/month"
  },
  "scenarios": [
    {
      "label": "Light Scraping",
      "label_zh": "轻度抓取",
      "description": "1,000 pages/month",
      "description_zh": "每月 1000 页",
      "monthly_cost": 0.5
    },
    {
      "label": "Moderate Scraping",
      "label_zh": "中度抓取",
      "description": "10,000 pages/month",
      "description_zh": "每月 1 万页",
      "monthly_cost": 9.5
    },
    {
      "label": "Heavy Scraping",
      "label_zh": "重度抓取",
      "description": "100,000 pages/month",
      "description_zh": "每月 10 万页",
      "monthly_cost": 99
    }
  ],
  "cost_factors": [
    {"name": "Pages/month", "description": "Web pages to scrape", "description_zh": "需要抓取的网页数", "default_value": 1000, "unit": "pages"}
  ],
  "notes": "Crawl and batch operations priced differently. See pricing page for details.",
  "notes_zh": "爬取和批量操作定价不同，详见定价页面。"
}'::jsonb
WHERE slug = 'firecrawl';

-- Jina Reader (Free)
UPDATE tools SET pricing_details = '{
  "model": "flat_rate",
  "currency": "USD",
  "rate": 0,
  "scenarios": [
    {
      "label": "Free Tier",
      "label_zh": "免费版",
      "description": "Unlimited URL-to-markdown",
      "description_zh": "无限 URL 转 Markdown",
      "monthly_cost": 0
    }
  ],
  "notes": "Free service with rate limits. Pro API available for higher limits.",
  "notes_zh": "免费服务有速率限制，Pro API 提供更高限制。"
}'::jsonb
WHERE slug = 'jina-reader';

-- AgentMail (Usage-based)
UPDATE tools SET pricing_details = '{
  "model": "usage_based",
  "currency": "USD",
  "unit": "email",
  "rate": 0.001,
  "free_tier": {
    "included": 1000,
    "unit": "emails/month"
  },
  "scenarios": [
    {
      "label": "Light Email",
      "label_zh": "轻度邮件",
      "description": "500 emails/month",
      "description_zh": "每月 500 封邮件",
      "monthly_cost": 0
    },
    {
      "label": "Moderate Email",
      "label_zh": "中度邮件",
      "description": "5,000 emails/month",
      "description_zh": "每月 5000 封邮件",
      "monthly_cost": 4
    },
    {
      "label": "Heavy Email",
      "label_zh": "重度邮件",
      "description": "50,000 emails/month",
      "description_zh": "每月 5 万封邮件",
      "monthly_cost": 49
    }
  ],
  "cost_factors": [
    {"name": "Emails/day", "description": "Emails sent/received per day", "description_zh": "每日发送/接收邮件数", "default_value": 50, "unit": "emails"}
  ],
  "notes": "Pricing based on email volume. Inboxes are free.",
  "notes_zh": "按邮件量计费，邮箱地址免费。"
}'::jsonb
WHERE slug = 'agentmail';

-- Langfuse (Tiered for cloud)
UPDATE tools SET pricing_details = '{
  "model": "tiered",
  "currency": "USD",
  "unit": "trace",
  "free_tier": {
    "included": 50000,
    "unit": "traces/month"
  },
  "scenarios": [
    {
      "label": "Free Tier",
      "label_zh": "免费版",
      "description": "50K traces/month, basic features",
      "description_zh": "每月 5 万追踪，基础功能",
      "monthly_cost": 0
    },
    {
      "label": "Pro",
      "label_zh": "专业版",
      "description": "500K traces/month, advanced analytics",
      "description_zh": "每月 50 万追踪，高级分析",
      "monthly_cost": 59
    },
    {
      "label": "Enterprise",
      "label_zh": "企业版",
      "description": "Unlimited traces, SSO, support",
      "description_zh": "无限追踪，SSO，专属支持",
      "monthly_cost": 299
    }
  ],
  "cost_factors": [
    {"name": "Traces/day", "description": "Observability traces per day", "description_zh": "每日可观测性追踪数", "default_value": 1000, "unit": "traces"},
    {"name": "Team size", "description": "Number of team members", "description_zh": "团队成员数量", "default_value": 3, "unit": "users"}
  ],
  "notes": "Open-source version available for self-hosting.",
  "notes_zh": "提供开源版本可自托管。"
}'::jsonb
WHERE slug = 'langfuse';

-- Zep (Tiered)
UPDATE tools SET pricing_details = '{
  "model": "tiered",
  "currency": "USD",
  "unit": "session",
  "free_tier": {
    "included": 10000,
    "unit": "sessions/month"
  },
  "scenarios": [
    {
      "label": "Free Tier",
      "label_zh": "免费版",
      "description": "10K sessions/month, graph memory",
      "description_zh": "每月 1 万会话，图谱记忆",
      "monthly_cost": 0
    },
    {
      "label": "Pro",
      "label_zh": "专业版",
      "description": "100K sessions/month, priority support",
      "description_zh": "每月 10 万会话，优先支持",
      "monthly_cost": 99
    },
    {
      "label": "Enterprise",
      "label_zh": "企业版",
      "description": "Unlimited sessions, SLA, support",
      "description_zh": "无限会话，SLA，专属支持",
      "monthly_cost": 499
    }
  ],
  "cost_factors": [
    {"name": "Sessions/day", "description": "Active user sessions per day", "description_zh": "每日活跃用户会话数", "default_value": 500, "unit": "sessions"},
    {"name": "Memory size", "description": "Total memory storage", "description_zh": "总记忆存储量", "default_value": 1, "unit": "GB"}
  ],
  "notes": "Open-source version available for self-hosting.",
  "notes_zh": "提供开源版本可自托管。"
}'::jsonb
WHERE slug = 'zep';

-- Apify (Usage-based)
UPDATE tools SET pricing_details = '{
  "model": "usage_based",
  "currency": "USD",
  "unit": "compute_unit",
  "rate": 0.25,
  "free_tier": {
    "included": 5,
    "unit": "compute_units/month"
  },
  "scenarios": [
    {
      "label": "Starter",
      "label_zh": "入门版",
      "description": "$5/month plan, basic scraping",
      "description_zh": "每月 $5 套餐，基础抓取",
      "monthly_cost": 5
    },
    {
      "label": "Pro",
      "label_zh": "专业版",
      "description": "$49/month plan, high volume",
      "description_zh": "每月 $49 套餐，大量抓取",
      "monthly_cost": 49
    },
    {
      "label": "Team",
      "label_zh": "团队版",
      "description": "$149/month plan, team features",
      "description_zh": "每月 $149 套餐，团队功能",
      "monthly_cost": 149
    }
  ],
  "cost_factors": [
    {"name": "Actor runs", "description": "Number of scraper executions", "description_zh": "抓取器执行次数", "default_value": 100, "unit": "runs"},
    {"name": "Data size", "description": "Scraped data volume", "description_zh": "抓取数据量", "default_value": 100, "unit": "MB"}
  ],
  "notes": "Pricing varies by actor and compute usage. Free tier available.",
  "notes_zh": "价格因抓取器和计算用量而异，提供免费套餐。"
}'::jsonb
WHERE slug = 'apify';

-- Composio (Tiered)
UPDATE tools SET pricing_details = '{
  "model": "tiered",
  "currency": "USD",
  "unit": "action",
  "free_tier": {
    "included": 1000,
    "unit": "actions/month"
  },
  "scenarios": [
    {
      "label": "Free Tier",
      "label_zh": "免费版",
      "description": "1K actions/month, basic integrations",
      "description_zh": "每月 1000 次操作，基础集成",
      "monthly_cost": 0
    },
    {
      "label": "Pro",
      "label_zh": "专业版",
      "description": "50K actions/month, all integrations",
      "description_zh": "每月 5 万次操作，全部集成",
      "monthly_cost": 49
    },
    {
      "label": "Enterprise",
      "label_zh": "企业版",
      "description": "Unlimited actions, custom connectors",
      "description_zh": "无限操作，自定义连接器",
      "monthly_cost": 299
    }
  ],
  "cost_factors": [
    {"name": "Actions/day", "description": "API calls to external services", "description_zh": "对外部服务的 API 调用", "default_value": 100, "unit": "actions"},
    {"name": "Integrations", "description": "Number of connected services", "description_zh": "连接的服务数量", "default_value": 5, "unit": "services"}
  ],
  "notes": "100+ integrations available. Custom connector development for enterprise.",
  "notes_zh": "支持 100+ 集成，企业版可开发自定义连接器。"
}'::jsonb
WHERE slug = 'composio';