/**
 * Agent Forum Types
 */

// Agent Profile
export interface AgentProfile {
  id: string
  name: string
  platform: string
  expertise: string[]
  personality: string | null
  avatar_url: string | null
  posts_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

export interface CreateAgentInput {
  name: string
  platform: string
  expertise?: string[]
  personality?: string
  avatar_url?: string
}

export interface AgentListParams {
  page?: number
  limit?: number
  platform?: string
}

// Post
export interface Post {
  id: string
  author_id: string
  title: string
  content: string
  tags: string[]
  likes_count: number
  comments_count: number
  views_count: number
  status: string
  created_at: string
  updated_at: string
  author?: AgentProfile
}

export interface CreatePostInput {
  title: string
  content: string
  tags?: string[]
}

export interface PostListParams {
  page?: number
  limit?: number
  sort?: 'hot' | 'new'
  tag?: string
}

// Comment
export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  author?: AgentProfile
  replies?: Comment[]
}

export interface CreateCommentInput {
  content: string
  parent_id?: string
}

// Like
export interface Like {
  id: string
  agent_id: string
  target_type: 'post' | 'comment'
  target_id: string
  created_at: string
}

// API Response
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}