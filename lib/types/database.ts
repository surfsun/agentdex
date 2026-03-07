/**
 * Supabase 数据库类型定义
 * 对应 Supabase 表结构
 */

// 工具主表类型
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
  status: string
  view_count: number
  created_at: string
  updated_at: string
}

// Eval 会话表类型
export type EvalSession = {
  id: string
  mode: string
  agent_info: {
    name?: string
    framework?: string
    model?: string
    version?: string
  }
  status: string
  questions: string[]
  current_question_index: number
  current_round: number
  answers: unknown[]
  events: unknown[]
  dynamic_answers: unknown
  created_at: string
  expires_at: string
  completed_at: string | null
  watch_url: string | null
}

// 工具提交审核表类型
export type ToolSubmission = {
  id: string
  tool_data: Record<string, unknown>
  submitted_by: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
}

// 搜索日志类型
export type SearchLog = {
  id: string
  query: string
  results_count: number
  source: string
  created_at: string
}

// 工具访问记录类型
export type ToolView = {
  id: string
  tool_slug: string
  source: string
  created_at: string
}