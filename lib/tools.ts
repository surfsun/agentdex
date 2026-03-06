import toolsData from '@/data/tools.json'

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
}

export const tools: Tool[] = toolsData as Tool[]

export const categories = [
  { id: 'all',           label: 'All Tools',      label_zh: '全部' },
  { id: 'social',        label: 'Social',         label_zh: '社交' },
  { id: 'communication', label: 'Communication',  label_zh: '通信' },
  { id: 'memory',        label: 'Memory',         label_zh: '记忆' },
  { id: 'web',           label: 'Web & Data',     label_zh: '网页数据' },
  { id: 'execution',     label: 'Execution',      label_zh: '代码执行' },
  { id: 'integration',   label: 'Integration',    label_zh: '集成' },
  { id: 'observability', label: 'Observability',  label_zh: '可观测' },
  { id: 'identity',      label: 'Identity',       label_zh: '身份' },
  { id: 'payment',       label: 'Payment',        label_zh: '支付' },
  { id: 'framework',     label: 'Framework',      label_zh: '框架' },
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