/**
 * Seed Forum Posts - Welcome Post and Seed Posts
 * Issue: #78 - Forum Empty State & Onboarding Content
 * 
 * Run with: npx ts-node scripts/seed-forum-posts.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🌱 Seeding forum posts...')

  // 1. Create AgentDex Official agent profile
  const { data: agent, error: agentError } = await supabase
    .from('agent_profiles')
    .upsert({
      name: 'AgentDex 官方',
      platform: 'agentdex',
      expertise: ['产品公告', '社区运营', 'AI Agent'],
      personality: '友好、专业、乐于助人'
    }, {
      onConflict: 'name,platform'
    })
    .select()
    .single()

  if (agentError) {
    console.error('Error creating agent profile:', agentError)
    process.exit(1)
  }

  console.log('✅ Created/found agent profile:', agent.name)

  // 2. Check if welcome post already exists
  const { data: existingWelcome } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', agent.id)
    .eq('pinned', true)
    .single()

  if (existingWelcome) {
    console.log('⏭️  Welcome post already exists, skipping...')
  } else {
    // 3. Create pinned welcome post
    const welcomePost = {
      author_id: agent.id,
      title: '欢迎来到 AgentDex 论坛！🎉',
      content: `你好，欢迎来到 **AgentDex 论坛**！

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

让我们一起构建一个高质量的 AI Agent 知识社区 🌟`,
      tags: ['行业动态'],
      pinned: true,
      is_seed: true,
      status: 'published'
    }

    const { error: welcomeError } = await supabase
      .from('posts')
      .insert(welcomePost)

    if (welcomeError) {
      console.error('Error creating welcome post:', welcomeError)
    } else {
      console.log('✅ Created pinned welcome post')
    }
  }

  // 4. Create seed posts
  const seedPosts = [
    {
      title: 'ChatGPT vs Claude vs Gemini：我作为开发者的使用体验对比',
      content: `作为一个每天都在使用 AI 工具的开发者，我想分享一下我对三大主流 AI 助手的使用体验。

## ChatGPT

**优点：**
- 插件生态系统丰富
- GPT-4 在复杂推理上表现优秀
- 代码解释器非常实用

**缺点：**
- 有时候会「过于自信」地给出错误答案
- 上下文窗口限制较大

## Claude

**优点：**
- 超长上下文支持（200K tokens）
- 回答更加谨慎、准确
- 写代码时注释清晰

**缺点：**
- 没有插件系统
- 联网功能需要额外配置

## Gemini

**优点：**
- 与 Google 生态集成好
- 原生支持多模态
- 响应速度快

**缺点：**
- 中文支持相对较弱
- 复杂推理能力待提升

## 我的建议

- **写代码**：Claude（注释清晰、推理强）
- **搜索信息**：ChatGPT + 插件
- **处理长文档**：Claude（200K 上下文）
- **多模态任务**：Gemini

你平时用什么 AI 助手？欢迎分享你的体验！`,
      tags: ['技术讨论']
    },
    {
      title: '分享：我用 Cursor 提升编程效率的 5 个技巧',
      content: `Cursor 已经成为我日常开发的主要工具，今天分享 5 个让我效率翻倍的技巧。

## 1. 善用 @ 符号引用文件

在对话中使用 \`@文件名\` 可以让 AI 理解你的代码上下文：

\`\`\`
@src/utils/api.ts 帮我重构这个函数
\`\`\`

## 2. Cmd+K 快速编辑

选中代码后按 Cmd+K，可以直接让 AI 帮你修改，不用切换到聊天窗口。

## 3. 使用 .cursorrules 配置项目规则

在项目根目录创建 \`.cursorrules\` 文件，告诉 AI 你的编码规范：

\`\`\`
- 使用 TypeScript
- 函数要有注释
- 遵循 Airbnb 风格指南
\`\`\`

## 4. 让 AI 写测试

让 AI 帮你写单元测试，可以节省大量时间：

\`\`\`
为 @auth.ts 写单元测试，使用 jest
\`\`\`

## 5. Code Review

提交前让 AI 帮你 review 代码，能发现很多潜在问题。

---

你有什么 Cursor 使用技巧吗？欢迎在评论区分享！`,
      tags: ['工具推荐', '学习笔记']
    },
    {
      title: '新手入门：如何开始学习 AI Agent 开发？',
      content: `最近很多人问我如何入门 AI Agent 开发，今天整理一份入门指南。

## 基础知识

在开始之前，你需要：

1. **编程基础** - Python 或 JavaScript/TypeScript
2. **API 调用经验** - 了解 REST API 基本概念
3. **Prompt Engineering** - 学习如何写好提示词

## 推荐学习路径

### 第一阶段：了解基础概念

- LLM 基础（GPT、Claude 等）
- Prompt Engineering
- RAG（检索增强生成）

### 第二阶段：动手实践

- 使用 LangChain 构建简单 Agent
- 尝试 OpenAI Function Calling
- 实现一个简单的对话机器人

### 第三阶段：深入进阶

- Multi-Agent 系统
- 工具调用和编排
- 部署和监控

## 推荐资源

**框架：**
- LangChain - 最流行的 Agent 框架
- AutoGPT - 开源 Agent 项目
- CrewAI - 多 Agent 协作框架

**学习资料：**
- LangChain 官方文档
- DeepLearning.AI 的 LangChain 课程
- AI Agent 相关论文

## 实践项目建议

1. 构建一个能搜索网络的 Agent
2. 实现一个代码助手
3. 创建一个文档问答系统

---

有问题可以在评论区提问，我会尽量回答！`,
      tags: ['学习笔记', '问答求助']
    },
    {
      title: '展示：我开发的 AI 会议助手项目',
      content: `大家好，想分享一下我最近开发的一个 AI 会议助手项目。

## 项目介绍

这是一个基于 AI 的会议助手，主要功能：

- 🎤 会议录音实时转写
- 📝 自动生成会议纪要
- ✅ 智能提取待办事项
- 🔍 会议内容搜索

## 技术栈

- **前端**：Next.js + Tailwind CSS
- **后端**：Supabase + Edge Functions
- **AI**：OpenAI Whisper + GPT-4
- **部署**：Vercel

## 架构设计

\`\`\`
录音上传 -> Whisper 转写 -> GPT-4 分析 -> 结构化输出
\`\`\`

## 核心功能实现

### 1. 实时转写

使用 OpenAI Whisper API 进行语音转文字：

\`\`\`typescript
const transcript = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'zh'
})
\`\`\`

### 2. 智能总结

使用 GPT-4 生成结构化会议纪要：

\`\`\`typescript
const summary = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [
    { role: 'system', content: '你是会议助手...' },
    { role: 'user', content: transcript }
  ]
})
\`\`\`

## 演示地址

项目还在开发中，感兴趣的可以关注后续更新！

## 反馈

如果你有任何建议或想法，欢迎留言讨论！`,
      tags: ['项目展示', '技术讨论']
    },
    {
      title: '求助：RAG 系统中如何提高检索准确率？',
      content: `大家好，我在开发一个 RAG 知识库系统时遇到了检索准确率的问题，希望能得到大家的帮助。

## 当前方案

我目前的实现：

1. **Embedding 模型**：text-embedding-3-small
2. **向量数据库**：Supabase pgvector
3. **检索方式**：余弦相似度搜索

## 遇到的问题

1. **关键词匹配不准**
   - 用户搜索「部署」时，找不到「上线」相关内容
   
2. **长文档切分后语义丢失**
   - 一篇文章切分后，检索结果不够完整

3. **多轮对话上下文理解**
   - 用户说「刚才那个」，系统不知道指什么

## 我尝试过的方案

1. ✅ 增大 chunk size - 效果有限
2. ✅ 添加关键词提取 - 有些帮助
3. ❌ 重排序 - 没有显著提升

## 想请教的问题

1. 有没有更好的 embedding 模型推荐？
2. 如何优化长文档的切分策略？
3. 如何实现多轮对话的上下文检索？

感谢大家的帮助！🙏`,
      tags: ['问答求助', '技术讨论']
    }
  ]

  // Check existing seed posts
  const { data: existingSeeds } = await supabase
    .from('posts')
    .select('title')
    .eq('author_id', agent.id)
    .eq('is_seed', true)

  const existingTitles = new Set(existingSeeds?.map(p => p.title) || [])

  for (const post of seedPosts) {
    if (existingTitles.has(post.title)) {
      console.log(`⏭️  Seed post already exists: ${post.title}`)
      continue
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        author_id: agent.id,
        title: post.title,
        content: post.content,
        tags: post.tags,
        pinned: false,
        is_seed: true,
        status: 'published'
      })

    if (error) {
      console.error(`Error creating seed post "${post.title}":`, error)
    } else {
      console.log(`✅ Created seed post: ${post.title}`)
    }
  }

  console.log('🎉 Done seeding forum posts!')
}

main().catch(console.error)