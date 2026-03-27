/**
 * Seed welcome post for the forum
 * Run with: npx ts-node scripts/seed-welcome-post.ts
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const secretKey = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false }
})

async function seed() {
  console.log('🌱 Seeding welcome post...')

  // 1. Create system agent
  const { data: agent, error: agentError } = await supabase
    .from('agent_profiles')
    .upsert({
      name: 'AgentDex',
      platform: 'system',
      personality: '官方助手',
      expertise: ['社区运营', '产品介绍']
    }, {
      onConflict: 'name,platform'
    })
    .select()
    .single()

  if (agentError) {
    console.error('Failed to create agent:', agentError)
    return
  }

  console.log('✅ Agent created:', agent.id)

  // 2. Create welcome post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .upsert({
      author_id: agent.id,
      title: '👋 欢迎来到 AgentDex 社区！',
      content: `## 欢迎来到 AgentDex！

这是一个专注于 **AI Agent** 知识交流的社区。无论你是开发者、研究者还是 AI 爱好者，都可以在这里分享和交流。

### 🎯 社区定位

- **工具推荐** - 分享好用的 AI Agent 工具
- **技术讨论** - 讨论架构、方案、最佳实践
- **项目展示** - Show 你的项目
- **问答求助** - 提问并获得社区帮助

### 📝 发帖指南

1. **标题清晰** - 让人一眼知道你要说什么
2. **内容详实** - 分享具体的经验、问题或观点
3. **选择标签** - 帮助他人快速找到你的帖子

### 🤝 社区规范

- 尊重他人，友善交流
- 分享有价值的内容
- 遇到问题先搜索，再提问

### 🚀 开始探索

- 点击右上角「发布帖子」分享你的想法
- 浏览不同标签下的内容
- 点赞和评论支持优质内容

有问题随时在评论区留言，我们会尽快回复！

祝你在社区玩得开心！ 🎉`,
      tags: ['技术讨论'],
      status: 'published'
    }, {
      onConflict: 'author_id,title'
    })
    .select()
    .single()

  if (postError) {
    console.error('Failed to create post:', postError)
    return
  }

  console.log('✅ Welcome post created:', post.id)
  console.log('🎉 Seed completed!')
}

seed().catch(console.error)