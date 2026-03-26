/**
 * Pre-defined tool comparison presets for common scenarios
 */

export interface ComparePreset {
  id: string
  name: string
  name_zh: string
  description: string
  description_zh: string
  icon: string
  toolIds: string[]  // Tool IDs or slugs
  category: string
}

export const comparePresets: ComparePreset[] = [
  {
    id: 'web-browsing',
    name: 'Web Browsing',
    name_zh: '网页浏览',
    description: 'Compare web browsing and scraping tools',
    description_zh: '对比网页浏览和抓取工具',
    icon: '🌐',
    toolIds: ['browserbase', 'jina-reader', 'apify', 'firecrawl'],
    category: 'web'
  },
  {
    id: 'memory',
    name: 'Agent Memory',
    name_zh: 'Agent 记忆',
    description: 'Compare memory and state management tools',
    description_zh: '对比记忆和状态管理工具',
    icon: '🧠',
    toolIds: ['mem0', 'zep', 'letta'],
    category: 'memory'
  },
  {
    id: 'framework',
    name: 'Agent Frameworks',
    name_zh: 'Agent 框架',
    description: 'Compare agent development frameworks',
    description_zh: '对比 Agent 开发框架',
    icon: '🔧',
    toolIds: ['langchain', 'crewai', 'dify', 'llamaindex'],
    category: 'framework'
  },
  {
    id: 'code-execution',
    name: 'Code Execution',
    name_zh: '代码执行',
    description: 'Compare code execution and sandbox tools',
    description_zh: '对比代码执行和沙箱工具',
    icon: '⚡',
    toolIds: ['e2b', 'modal', 'daytona'],
    category: 'execution'
  },
  {
    id: 'observability',
    name: 'Observability',
    name_zh: '可观测性',
    description: 'Compare LLM observability and monitoring tools',
    description_zh: '对比 LLM 可观测性和监控工具',
    icon: '📊',
    toolIds: ['langfuse', 'langsmith', 'helicone'],
    category: 'observability'
  },
  {
    id: 'email',
    name: 'Email Agents',
    name_zh: '邮件 Agent',
    description: 'Compare email communication tools',
    description_zh: '对比邮件通信工具',
    icon: '📧',
    toolIds: ['agentmail', 'resend', 'postmark'],
    category: 'communication'
  }
]

/**
 * Get preset by ID
 */
export function getPresetById(id: string): ComparePreset | undefined {
  return comparePresets.find(p => p.id === id)
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: string): ComparePreset[] {
  return comparePresets.filter(p => p.category === category)
}