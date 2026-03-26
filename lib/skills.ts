// Agent Skills data for AgentDex
// Skills are reusable agent behavior patterns that can be directly installed

export interface Skill {
  id: string
  name: string
  name_zh?: string
  description: string
  description_zh?: string
  category: string
  icon: string
  trigger: string
  install: string
  install_alt?: string
  author: string
  github: string
  stars: number
  verified: boolean
  tags: string[]
  dependencies: string[]
  examples: {
    input: string
    output: string
  }[]
}

export const skillCategories = [
  { id: 'research', icon: '🔍', label: 'Research', label_zh: '研究' },
  { id: 'code-review', icon: '💻', label: 'Code Review', label_zh: '代码审查' },
  { id: 'analysis', icon: '📊', label: 'Analysis', label_zh: '数据分析' },
  { id: 'writing', icon: '✍️', label: 'Writing', label_zh: '写作' },
  { id: 'automation', icon: '⚙️', label: 'Automation', label_zh: '自动化' },
  { id: 'integration', icon: '🔗', label: 'Integration', label_zh: '集成' },
]

export const skills: Skill[] = [
  {
    id: 'last30days',
    name: 'Multi-Source Research Skill',
    name_zh: '多源信息研究',
    description: 'Aggregate research from Reddit, X, YouTube, Hacker News and synthesize actionable insights.',
    description_zh: '从 Reddit、X、YouTube、Hacker News 聚合研究信息并合成可操作的洞察。',
    category: 'research',
    icon: '🔍',
    trigger: '/last30days',
    install: 'git clone https://github.com/mvanhorn/last30days-skill.git ~/.claude/skills/last30days',
    install_alt: '/plugin marketplace add mvanhorn/last30days-skill',
    author: 'mvanhorn',
    github: 'https://github.com/mvanhorn/last30days-skill',
    stars: 1200,
    verified: true,
    tags: ['research', 'aggregation', 'summarization'],
    dependencies: ['brave-search', 'scrapecreators'],
    examples: [
      {
        input: '/last30days prompting techniques for ChatGPT',
        output: 'JSON prompting is the dominant technique... Key patterns: structured prompts, JSON format, 5-element formulas...'
      }
    ]
  },
  {
    id: 'pr-reviewer',
    name: 'PR Reviewer',
    name_zh: 'PR 代码审查',
    description: 'Automatically review pull requests with code quality checks, security analysis, and suggestions.',
    description_zh: '自动审查 PR，包含代码质量检查、安全分析和改进建议。',
    category: 'code-review',
    icon: '💻',
    trigger: '/review-pr',
    install: 'git clone https://github.com/example/pr-reviewer-skill.git ~/.claude/skills/pr-reviewer',
    author: 'community',
    github: 'https://github.com/example/pr-reviewer-skill',
    stars: 450,
    verified: false,
    tags: ['code-review', 'github', 'security'],
    dependencies: ['github-api'],
    examples: [
      {
        input: '/review-pr https://github.com/owner/repo/pull/123',
        output: '## Review Summary\n- 2 potential issues found\n- 3 style suggestions\n- 1 security concern'
      }
    ]
  },
  {
    id: 'doc-summarizer',
    name: 'Document Summarizer',
    name_zh: '文档摘要',
    description: 'Extract key insights from long documents with structured summaries and action items.',
    description_zh: '从长文档中提取关键洞察，生成结构化摘要和行动项。',
    category: 'writing',
    icon: '✍️',
    trigger: '/summarize',
    install: 'git clone https://github.com/example/doc-summarizer-skill.git ~/.claude/skills/doc-summarizer',
    author: 'community',
    github: 'https://github.com/example/doc-summarizer-skill',
    stars: 320,
    verified: false,
    tags: ['summarization', 'documents', 'writing'],
    dependencies: ['jina-reader'],
    examples: [
      {
        input: '/summarize https://example.com/long-article',
        output: '## Key Points\n1. Main argument...\n2. Supporting evidence...\n\n## Action Items\n- Follow up on...'
      }
    ]
  },
  {
    id: 'web-researcher',
    name: 'Web Researcher',
    name_zh: '网页研究',
    description: 'Deep research on any topic from web sources with citation-backed findings.',
    description_zh: '从网页来源深入研究任何主题，提供带引用的研究结果。',
    category: 'research',
    icon: '🔬',
    trigger: '/research',
    install: 'git clone https://github.com/example/web-researcher-skill.git ~/.claude/skills/web-researcher',
    author: 'community',
    github: 'https://github.com/example/web-researcher-skill',
    stars: 280,
    verified: false,
    tags: ['research', 'web', 'citations'],
    dependencies: ['brave-search', 'firecrawl'],
    examples: [
      {
        input: '/research best practices for LLM prompt engineering',
        output: '## Research Summary\nBased on 15 sources...\n\nKey findings:\n1. Chain-of-thought prompting...'
      }
    ]
  },
  {
    id: 'data-explorer',
    name: 'Data Explorer',
    name_zh: '数据探索',
    description: 'Analyze datasets with automatic visualization and statistical insights.',
    description_zh: '分析数据集，自动生成可视化和统计洞察。',
    category: 'analysis',
    icon: '📊',
    trigger: '/explore',
    install: 'git clone https://github.com/example/data-explorer-skill.git ~/.claude/skills/data-explorer',
    author: 'community',
    github: 'https://github.com/example/data-explorer-skill',
    stars: 190,
    verified: false,
    tags: ['data', 'visualization', 'analysis'],
    dependencies: ['e2b'],
    examples: [
      {
        input: '/explore sales_data.csv',
        output: '## Data Overview\n- 1,234 rows, 15 columns\n- Key trends: revenue up 23%...\n\n[Visualization generated]'
      }
    ]
  },
  {
    id: 'task-runner',
    name: 'Task Runner',
    name_zh: '任务运行器',
    description: 'Schedule and execute automated tasks with configurable triggers and notifications.',
    description_zh: '调度和执行自动化任务，支持可配置的触发器和通知。',
    category: 'automation',
    icon: '⚙️',
    trigger: '/schedule',
    install: 'git clone https://github.com/example/task-runner-skill.git ~/.claude/skills/task-runner',
    author: 'community',
    github: 'https://github.com/example/task-runner-skill',
    stars: 150,
    verified: false,
    tags: ['automation', 'scheduling', 'tasks'],
    dependencies: [],
    examples: [
      {
        input: '/schedule daily report at 9am',
        output: 'Task scheduled. I will generate and send the daily report every day at 9am.'
      }
    ]
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    name_zh: '安全扫描',
    description: 'Scan code for security vulnerabilities with remediation suggestions.',
    description_zh: '扫描代码中的安全漏洞，提供修复建议。',
    category: 'code-review',
    icon: '🛡️',
    trigger: '/security-scan',
    install: 'git clone https://github.com/example/security-scanner-skill.git ~/.claude/skills/security-scanner',
    author: 'community',
    github: 'https://github.com/example/security-scanner-skill',
    stars: 220,
    verified: false,
    tags: ['security', 'code-review', 'vulnerabilities'],
    dependencies: [],
    examples: [
      {
        input: '/security-scan ./src',
        output: '## Security Report\n- 3 medium risks found\n- 1 high risk: SQL injection in user.ts:45\n- Remediation: Use parameterized queries'
      }
    ]
  },
  {
    id: 'blog-writer',
    name: 'Blog Writer',
    name_zh: '博客写作',
    description: 'Generate SEO-optimized blog posts from outlines or key points.',
    description_zh: '从大纲或要点生成 SEO 优化的博客文章。',
    category: 'writing',
    icon: '📝',
    trigger: '/write-blog',
    install: 'git clone https://github.com/example/blog-writer-skill.git ~/.claude/skills/blog-writer',
    author: 'community',
    github: 'https://github.com/example/blog-writer-skill',
    stars: 180,
    verified: false,
    tags: ['writing', 'blog', 'seo'],
    dependencies: [],
    examples: [
      {
        input: '/write-blog "Introduction to AI Agents"',
        output: '## Introduction to AI Agents\n\nIn recent years, AI agents have transformed how we...\n\n### Key Benefits\n1. Automation...'
      }
    ]
  },
  {
    id: 'multi-tool-orchestrator',
    name: 'Multi-Tool Orchestrator',
    name_zh: '多工具编排',
    description: 'Coordinate multiple tools and APIs for complex workflows.',
    description_zh: '协调多个工具和 API 完成复杂工作流。',
    category: 'integration',
    icon: '🔗',
    trigger: '/orchestrate',
    install: 'git clone https://github.com/example/orchestrator-skill.git ~/.claude/skills/orchestrator',
    author: 'community',
    github: 'https://github.com/example/orchestrator-skill',
    stars: 340,
    verified: false,
    tags: ['integration', 'workflow', 'orchestration'],
    dependencies: ['langchain', 'browserbase', 'mem0'],
    examples: [
      {
        input: '/orchestrate: fetch latest news, summarize, and send email',
        output: 'Workflow created:\n1. Fetch news via Brave Search\n2. Summarize with AI\n3. Send via AgentMail\n\nReady to execute?'
      }
    ]
  },
  {
    id: 'competitor-tracker',
    name: 'Competitor Tracker',
    name_zh: '竞品追踪',
    description: 'Monitor competitor websites and products for changes and updates.',
    description_zh: '监控竞争对手网站和产品的变化和更新。',
    category: 'research',
    icon: '🎯',
    trigger: '/track-competitor',
    install: 'git clone https://github.com/example/competitor-tracker-skill.git ~/.claude/skills/competitor-tracker',
    author: 'community',
    github: 'https://github.com/example/competitor-tracker-skill',
    stars: 120,
    verified: false,
    tags: ['research', 'monitoring', 'competitors'],
    dependencies: ['browserbase', 'firecrawl'],
    examples: [
      {
        input: '/track-competitor https://competitor.com/pricing',
        output: 'Monitoring started. I will check weekly and notify you of any changes to the pricing page.'
      }
    ]
  }
]

export function getSkillsByCategory(categoryId: string): Skill[] {
  return skills.filter(skill => skill.category === categoryId)
}

export function getSkillById(id: string): Skill | undefined {
  return skills.find(skill => skill.id === id)
}

export function getSkillsForTool(toolSlug: string): Skill[] {
  return skills.filter(skill => 
    skill.dependencies.some(dep => 
      dep.toLowerCase().includes(toolSlug.toLowerCase()) ||
      toolSlug.toLowerCase().includes(dep.toLowerCase())
    )
  )
}