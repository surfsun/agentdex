import toolsData from '@/data/tools.json'

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

export type Tool = {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  website: string
  github: string
  category: string
  tags: string[]
  pricing: 'free' | 'freemium' | 'paid'
  price_detail: string
  agent_friendly: boolean
  api_available: boolean
  open_source: boolean
  featured: boolean
  verified: boolean
  submitted_by: string
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
}

export const tools: Tool[] = toolsData as Tool[]

export const categories = [
  { id: 'all',           label: 'All Tools',      label_zh: '全部' },
  { id: 'framework',     label: 'Framework',      label_zh: '框架' },
  { id: 'social',        label: 'Social',         label_zh: '社交' },
  { id: 'communication', label: 'Communication',  label_zh: '通信' },
  { id: 'memory',        label: 'Memory',         label_zh: '记忆' },
  { id: 'web',           label: 'Web & Data',     label_zh: '网页数据' },
  { id: 'execution',     label: 'Execution',      label_zh: '代码执行' },
  { id: 'integration',   label: 'Integration',    label_zh: '集成' },
  { id: 'observability', label: 'Observability',  label_zh: '可观测' },
  { id: 'security',      label: 'Security',       label_zh: '安全' },
  { id: 'payment',       label: 'Payment',        label_zh: '支付' },
]

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find(t => t.slug === slug)
}

export function getToolsByCategory(category: string): Tool[] {
  if (category === 'all') return tools
  return tools.filter(t => t.category === category)
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase()
  return tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.tagline.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.includes(q))
  )
}

export function getFeaturedTools(): Tool[] {
  return tools.filter(t => t.featured)
}

// Check if a tool is brand new (added within the last 7 days)
export function isBrandNewTool(tool: Tool): boolean {
  const createdAt = new Date(tool.created_at)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return createdAt > sevenDaysAgo
}

// Check if a tool is new (added within the last 30 days)
export function isNewTool(tool: Tool): boolean {
  const createdAt = new Date(tool.created_at)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return createdAt > thirtyDaysAgo
}

// Get all new tools (within 30 days)
export function getNewTools(): Tool[] {
  return tools.filter(isNewTool)
}

// Sort tools by created_at (most recent first)
export function sortByRecentlyAdded(toolList: Tool[]): Tool[] {
  return [...toolList].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA
  })
}

// Get count of tools added within 7 days
export function getBrandNewCount(): number {
  return tools.filter(isBrandNewTool).length
}

// Identity-related functions
export function sortToolsByIdentity(toolList: Tool[], identity: Identity | null): Tool[] {
  if (!identity) return toolList
  
  return [...toolList].sort((a, b) => {
    const priorityA = a.recommended_for?.[identity]?.priority ?? 999
    const priorityB = b.recommended_for?.[identity]?.priority ?? 999
    return priorityA - priorityB
  })
}

export function getRecommendedReason(tool: Tool, identity: Identity, locale: 'en' | 'zh-CN' = 'en'): string | null {
  const rec = tool.recommended_for?.[identity]
  if (!rec) return null
  return locale === 'zh-CN' && rec.reason_zh ? rec.reason_zh : rec.reason
}

export const identities: { id: Identity; label: string; label_zh: string; icon: string }[] = [
  { id: 'developer', label: 'Developer', label_zh: '开发者', icon: '👨‍💻' },
  { id: 'founder', label: 'Founder', label_zh: '创始人', icon: '🚀' },
  { id: 'researcher', label: 'Researcher', label_zh: '研究者', icon: '🔬' },
  { id: 'pm', label: 'Product Manager', label_zh: '产品经理', icon: '📊' },
]

// Get tools with recent changelog updates
export type ToolUpdate = {
  tool: Tool
  latestChange: ChangelogEntry
}

export function getRecentUpdates(limit: number = 5): ToolUpdate[] {
  const updates: ToolUpdate[] = []
  
  for (const tool of tools) {
    if (tool.changelog && tool.changelog.length > 0) {
      // Get the latest changelog entry (first in array)
      const latestChange = tool.changelog[0]
      updates.push({
        tool,
        latestChange
      })
    }
  }
  
  // Sort by changelog date (most recent first)
  updates.sort((a, b) => {
    const dateA = new Date(a.latestChange.date).getTime()
    const dateB = new Date(b.latestChange.date).getTime()
    return dateB - dateA
  })
  
  return updates.slice(0, limit)
}

// Get changelog updates within last N days
export function getRecentChangelogUpdates(days: number = 30): ToolUpdate[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const updates: ToolUpdate[] = []
  
  for (const tool of tools) {
    if (tool.changelog && tool.changelog.length > 0) {
      const latestChange = tool.changelog[0]
      const changeDate = new Date(latestChange.date)
      
      if (changeDate > cutoffDate) {
        updates.push({
          tool,
          latestChange
        })
      }
    }
  }
  
  // Sort by date
  updates.sort((a, b) => {
    const dateA = new Date(a.latestChange.date).getTime()
    const dateB = new Date(b.latestChange.date).getTime()
    return dateB - dateA
  })
  
  return updates
}