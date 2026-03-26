/**
 * 工具类型定义
 * 数据查询已迁移到 lib/db.ts
 */

export type IntegrationLevel = 'quick_start' | 'standard' | 'advanced'

export type ChangeType = 'breaking' | 'feature' | 'fix' | 'deprecation' | 'security'

export type ChangelogChange = {
  type: ChangeType
  description: string
  description_zh?: string
}

export type ChangelogEntry = {
  version: string
  date: string
  breaking: boolean
  changes: ChangelogChange[]
  migration_guide?: string
  migration_guide_zh?: string
}

export type Identity = 'developer' | 'founder' | 'researcher' | 'pm'

export type RecommendedFor = {
  [key in Identity]?: {
    priority: number  // 1 = highest priority
    reason: string
    reason_zh?: string
  }
}

export type IntegrationComplexity = 'low' | 'medium' | 'high'

// Persona capabilities for agents
export type PersonaCapabilities = {
  self_editing_memory?: boolean  // Agent can modify its own persona
  stateful_identity?: boolean     // Maintains consistent identity across sessions
  communication_style?: string    // e.g., "data-driven, concise"
  personality_traits?: {          // Configurable personality dimensions
    [key: string]: number         // e.g., { "analytical": 0.9, "empathetic": 0.7 }
  }
  model_agnostic?: boolean        // Works with multiple LLM providers
}

// MCP (Model Context Protocol) support
export type MCPConfig = {
  supported: boolean
  server_type?: 'stdio' | 'http' | 'sse'
  tools_count?: number
  installation?: string
  verified?: boolean
}

// Code example for integration
export type CodeExample = {
  install: string      // Installation command
  init: string         // Initialization code
  basic: string        // Basic usage example
  error_handling?: string  // Error handling example
  env_vars?: string[]  // Required environment variables
}

// Integration code examples for multiple languages
export type CodeExamples = {
  python?: CodeExample
  typescript?: CodeExample
  go?: CodeExample
  rust?: CodeExample
}

// 前端使用的工具类型（合并了数据库类型和额外字段）
export type Tool = {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  website: string | null
  github: string | null
  category: string
  tags: string[]
  pricing: string | null
  price_detail: string | null
  agent_friendly: boolean
  api_available: boolean
  open_source: boolean
  featured: boolean
  verified: boolean
  submitted_by: string | null
  created_at: string
  votes?: number  // Optional: number of upvotes
  integration_level?: IntegrationLevel  // Quick Start / Standard / Advanced
  quickstart_time?: string  // e.g., "5 min", "15 min"
  changelog?: ChangelogEntry[]  // API changelog entries
  api_version?: string  // Current API version
  api_stability?: 'stable' | 'beta' | 'alpha'  // API stability level
  recommended_for?: RecommendedFor  // Identity-based recommendations
  // Comparison fields
  github_stars?: number  // GitHub stars count
  integration_complexity?: IntegrationComplexity  // Integration difficulty
  best_for?: string[]  // Use cases this tool is best for
  best_for_zh?: string[]  // Chinese version of best_for
  // Persona capabilities
  persona?: PersonaCapabilities  // Agent persona/personality support
  // MCP (Model Context Protocol) support
  mcp?: MCPConfig
  // Integration code examples
  integration_minutes?: number  // Estimated integration time in minutes
  code_examples?: CodeExamples  // Multi-language code examples
  // Database fields
  status?: string
  view_count?: number
  updated_at?: string
}

// Identity-related helpers
export const identities: { id: Identity; label: string; label_zh: string; icon: string }[] = [
  { id: 'developer', label: 'Developer', label_zh: '开发者', icon: '👨‍💻' },
  { id: 'founder', label: 'Founder', label_zh: '创始人', icon: '🚀' },
  { id: 'researcher', label: 'Researcher', label_zh: '研究者', icon: '🔬' },
  { id: 'pm', label: 'Product Manager', label_zh: '产品经理', icon: '📊' },
]

/**
 * 检查工具是否为全新（7天内添加）
 */
export function isBrandNewTool(tool: Tool): boolean {
  const createdAt = new Date(tool.created_at)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return createdAt > sevenDaysAgo
}

/**
 * 检查工具是否为新工具（30天内添加）
 */
export function isNewTool(tool: Tool): boolean {
  const createdAt = new Date(tool.created_at)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return createdAt > thirtyDaysAgo
}

/**
 * 按最近添加排序
 */
export function sortByRecentlyAdded(toolList: Tool[]): Tool[] {
  return [...toolList].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA
  })
}

/**
 * 按身份推荐排序
 */
export function sortToolsByIdentity(toolList: Tool[], identity: Identity | null): Tool[] {
  if (!identity) return toolList
  
  return [...toolList].sort((a, b) => {
    const priorityA = a.recommended_for?.[identity]?.priority ?? 999
    const priorityB = b.recommended_for?.[identity]?.priority ?? 999
    return priorityA - priorityB
  })
}

/**
 * 获取推荐理由
 */
export function getRecommendedReason(tool: Tool, identity: Identity, locale: 'en' | 'zh-CN' = 'en'): string | null {
  const rec = tool.recommended_for?.[identity]
  if (!rec) return null
  return locale === 'zh-CN' && rec.reason_zh ? rec.reason_zh : rec.reason
}

/**
 * 获取最近更新的工具
 */
export type ToolUpdate = {
  tool: Tool
  latestChange: ChangelogEntry
}

export function getRecentUpdates(tools: Tool[], limit: number = 5): ToolUpdate[] {
  const updates: ToolUpdate[] = []
  
  for (const tool of tools) {
    if (tool.changelog && tool.changelog.length > 0) {
      const latestChange = tool.changelog[0]
      updates.push({
        tool,
        latestChange
      })
    }
  }
  
  updates.sort((a, b) => {
    const dateA = new Date(a.latestChange.date).getTime()
    const dateB = new Date(b.latestChange.date).getTime()
    return dateB - dateA
  })
  
  return updates.slice(0, limit)
}

/**
 * 获取全新工具数量
 */
export function getBrandNewCount(tools: Tool[]): number {
  return tools.filter(isBrandNewTool).length
}

/**
 * 计算两个工具的相似度（基于 tags 重叠）
 */
export function calculateSimilarity(toolA: Tool, toolB: Tool): number {
  const tagsA = new Set(toolA.tags)
  const tagsB = new Set(toolB.tags)
  const intersection = [...tagsA].filter(tag => tagsB.has(tag))
  const union = new Set([...tagsA, ...tagsB])
  // Jaccard similarity + bonus for same category
  const jaccard = intersection.length / union.size
  const categoryBonus = toolA.category === toolB.category ? 0.3 : 0
  return jaccard + categoryBonus
}

/**
 * 获取工具的替代方案（相似工具）
 */
export function getAlternatives(tool: Tool, allTools: Tool[], limit: number = 2): Tool[] {
  return allTools
    .filter(t => t.id !== tool.id && t.category === tool.category)
    .map(t => ({
      tool: t,
      score: calculateSimilarity(tool, t)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.tool)
}