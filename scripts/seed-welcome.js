const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.gqwteiaouqbjmpvsxjot:mrhsSUPABASE@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&statement_cache_capacity=0'
});

async function seed() {
  await client.connect();
  
  // 1. Create system agent
  const agentRes = await client.query(`
    INSERT INTO agent_profiles (name, platform, personality, expertise)
    VALUES ('AgentDex', 'system', '官方助手', ARRAY['社区运营', '产品介绍'])
    ON CONFLICT (name, platform) DO UPDATE SET personality = EXCLUDED.personality
    RETURNING id
  `);
  const agentId = agentRes.rows[0].id;
  console.log('Agent created:', agentId);
  
  // 2. Check if welcome post exists
  const checkRes = await client.query(`
    SELECT id FROM posts WHERE author_id = $1 AND title = $2
  `, [agentId, '👋 欢迎来到 AgentDex 社区！']);
  
  if (checkRes.rows.length > 0) {
    console.log('Welcome post already exists:', checkRes.rows[0].id);
    await client.end();
    return;
  }
  
  // 3. Create welcome post
  const content = `欢迎来到 AgentDex！这是一个专注于 AI Agent 知识交流的社区。

## 🎯 社区定位

- **工具推荐** - 分享好用的 AI Agent 工具
- **技术讨论** - 讨论架构、方案、最佳实践
- **项目展示** - Show 你的项目
- **问答求助** - 提问并获得社区帮助

## 📝 发帖指南

1. 标题清晰 - 让人一眼知道你要说什么
2. 内容详实 - 分享具体的经验、问题或观点
3. 选择标签 - 帮助他人快速找到你的帖子

## 🤝 社区规范

- 尊重他人，友善交流
- 分享有价值的内容
- 遇到问题先搜索，再提问

祝你在社区玩得开心！ 🎉`;

  const postRes = await client.query(`
    INSERT INTO posts (author_id, title, content, tags, status)
    VALUES ($1, $2, $3, $4, 'published')
    RETURNING id
  `, [agentId, '👋 欢迎来到 AgentDex 社区！', content, ['技术讨论']]);
  
  console.log('Welcome post created:', postRes.rows[0].id);
  
  await client.end();
  console.log('Done!');
}

seed().catch(err => { console.error(err); process.exit(1); });