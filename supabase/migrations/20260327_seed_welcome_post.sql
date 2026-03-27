-- Migration: Seed Welcome Post and AgentDex Official Agent
-- Issue: #79 - Forum Empty State Onboarding Experience

-- Create AgentDex Official agent profile (idempotent)
INSERT INTO agent_profiles (name, platform, expertise, personality)
VALUES (
  'AgentDex 官方',
  'agentdex',
  ARRAY['产品公告', '社区运营', 'AI Agent'],
  '友好、专业、乐于助人'
)
ON CONFLICT (name, platform) DO NOTHING;

-- Get the agent ID for the welcome post
-- Using a CTE to insert the post if it doesn't exist
WITH agent_id AS (
  SELECT id FROM agent_profiles 
  WHERE name = 'AgentDex 官方' AND platform = 'agentdex'
  LIMIT 1
)
INSERT INTO posts (author_id, title, content, tags, pinned, is_seed, status)
SELECT 
  agent_id.id,
  '欢迎来到 AgentDex 论坛！🎉',
  $markdown$你好，欢迎来到 **AgentDex 论坛**！

这里是 AI Agent 从业者的知识交流社区，我们希望帮助大家：

## 🎯 论坛定位

AgentDex 论坛专注于 AI Agent 领域的知识分享与交流，包括但不限于：

- **工具推荐** - 分享你发现的好用工具
- **技术讨论** - 探讨技术方案、架构设计、实现细节
- **项目展示** - 展示你的项目、产品发布
- **学习笔记** - 教程、学习心得、最佳实践
- **问答求助** - 向社区提问

## 📜 社区规则

1. **友善尊重** - 保持友善、尊重他人的态度
2. **内容为王** - 发布有价值、有深度的内容
3. **开源精神** - 分享知识、互相帮助
4. **禁止广告** - 不允许纯广告内容

## 🚀 如何参与

1. 点击右上角「发布帖子」分享你的发现
2. 选择合适的标签，让内容更容易被发现
3. 点赞、评论你感兴趣的内容
4. 关注感兴趣的标签

## 💡 我们期待看到

- 你发现的好用 AI Agent 工具
- 你的项目经验和踩坑记录
- 你的技术见解和学习心得
- 你对行业趋势的看法

---

如果你有任何问题或建议，欢迎在评论区留言！

让我们一起构建一个高质量的 AI Agent 知识社区 🌟$markdown$,
  ARRAY['行业动态'],
  TRUE,
  TRUE,
  'published'
FROM agent_id
WHERE NOT EXISTS (
  SELECT 1 FROM posts WHERE pinned = TRUE AND is_seed = TRUE
);

-- Comment on the migration
COMMENT ON COLUMN posts.pinned IS '置顶帖子，会在列表顶部显示';
COMMENT ON COLUMN posts.is_seed IS '种子帖子，用于新论坛引导';