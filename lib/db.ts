/**
 * 数据库查询模块
 * 所有数据查询统一从这里走，只查 Supabase
 */
import { supabase, supabaseAdmin } from './supabase'
import { Tool } from './tools'

// 分类定义（前端展示用，不从数据库查）
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

/**
 * 获取所有工具（服务端）
 */
export async function getAllTools(): Promise<Tool[]> {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DB] Failed to fetch tools:', error)
    throw new Error(`Failed to fetch tools: ${error.message}`)
  }

  return data || []
}

/**
 * 根据 slug 获取单个工具（服务端）
 */
export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('[DB] Failed to fetch tool:', error)
    throw new Error(`Failed to fetch tool: ${error.message}`)
  }

  return data
}

/**
 * 获取所有工具的 slug 列表（用于 SSG）
 */
export async function getAllToolSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('tools')
    .select('slug')
    .eq('status', 'active')

  if (error) {
    console.error('[DB] Failed to fetch slugs:', error)
    throw new Error(`Failed to fetch slugs: ${error.message}`)
  }

  return data?.map(t => t.slug) || []
}

/**
 * 根据条件筛选工具
 */
export async function getToolsByFilter(options: {
  category?: string
  agent_friendly?: boolean
  open_source?: boolean
  pricing?: string
  integration_level?: string
  featured?: boolean
  limit?: number
  offset?: number
}): Promise<{ tools: Tool[]; total: number }> {
  let query = supabase
    .from('tools')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  if (options.category && options.category !== 'all') {
    query = query.eq('category', options.category)
  }
  if (options.agent_friendly) {
    query = query.eq('agent_friendly', true)
  }
  if (options.open_source) {
    query = query.eq('open_source', true)
  }
  if (options.pricing) {
    query = query.eq('pricing', options.pricing)
  }
  if (options.integration_level) {
    query = query.eq('integration_level', options.integration_level)
  }
  if (options.featured) {
    query = query.eq('featured', true)
  }

  const limit = options.limit || 100
  const offset = options.offset || 0

  const { data, error, count } = await query
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[DB] Failed to fetch tools by filter:', error)
    throw new Error(`Failed to fetch tools: ${error.message}`)
  }

  return {
    tools: data || [],
    total: count || 0
  }
}

/**
 * 搜索工具
 */
export async function searchTools(query: string): Promise<Tool[]> {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,tagline.ilike.%${query}%`)
    .order('featured', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[DB] Failed to search tools:', error)
    throw new Error(`Failed to search tools: ${error.message}`)
  }

  return data || []
}

/**
 * 记录工具访问
 */
export async function recordToolView(slug: string, source: string = 'web'): Promise<void> {
  try {
    // 记录访问日志
    await supabaseAdmin.from('tool_views').insert({
      tool_slug: slug,
      source
    })

    // 更新访问计数
    await supabaseAdmin.rpc('increment_view_count', { tool_slug: slug })
  } catch (error) {
    // 静默失败，不影响页面渲染
    console.error('[DB] Failed to record view:', error)
  }
}