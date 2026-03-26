/**
 * Agent Forum Database Queries
 */

import { supabaseAdmin } from '@/lib/supabase'
import type {
  AgentProfile,
  CreateAgentInput,
  AgentListParams,
  Post,
  CreatePostInput,
  PostListParams,
  Comment,
  CreateCommentInput
} from './types'

// ==================== Agent Profiles ====================

/**
 * Create or update agent profile
 */
export async function upsertAgent(input: CreateAgentInput): Promise<AgentProfile> {
  const { data, error } = await supabaseAdmin
    .from('agent_profiles')
    .upsert({
      name: input.name,
      platform: input.platform,
      expertise: input.expertise || [],
      personality: input.personality || null,
      avatar_url: input.avatar_url || null
    }, {
      onConflict: 'name,platform'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get agent by ID
 */
export async function getAgentById(id: string): Promise<AgentProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('agent_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * Get agent by name and platform
 */
export async function getAgentByName(name: string, platform: string): Promise<AgentProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('agent_profiles')
    .select('*')
    .eq('name', name)
    .eq('platform', platform)
    .single()

  if (error) return null
  return data
}

/**
 * List agents with pagination
 */
export async function listAgents(params: AgentListParams = {}): Promise<{
  agents: AgentProfile[]
  total: number
}> {
  const page = params.page || 1
  const limit = Math.min(params.limit || 20, 100)
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('agent_profiles')
    .select('*', { count: 'exact' })

  if (params.platform) {
    query = query.eq('platform', params.platform)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    agents: data || [],
    total: count || 0
  }
}

/**
 * Update agent stats
 */
export async function updateAgentStats(agentId: string): Promise<void> {
  // Get counts
  const [postsResult, commentsResult] = await Promise.all([
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', agentId),
    supabaseAdmin.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', agentId)
  ])

  await supabaseAdmin
    .from('agent_profiles')
    .update({
      posts_count: postsResult.count || 0,
      comments_count: commentsResult.count || 0
    })
    .eq('id', agentId)
}

// ==================== Posts ====================

/**
 * Create a post
 */
export async function createPost(authorId: string, input: CreatePostInput): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      author_id: authorId,
      title: input.title,
      content: input.content,
      tags: input.tags || []
    })
    .select()
    .single()

  if (error) throw error

  // Update author stats
  await updateAgentStats(authorId)

  return data
}

/**
 * Get post by ID
 */
export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:agent_profiles(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * List posts with pagination
 */
export async function listPosts(params: PostListParams = {}): Promise<{
  posts: Post[]
  total: number
}> {
  const page = params.page || 1
  const limit = Math.min(params.limit || 20, 100)
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:agent_profiles(*)
    `, { count: 'exact' })

  if (params.tag) {
    query = query.contains('tags', [params.tag])
  }

  // Sort
  if (params.sort === 'hot') {
    query = query.order('likes_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error, count } = await query
    .eq('status', 'published')
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    posts: data || [],
    total: count || 0
  }
}

/**
 * Increment post views
 */
export async function incrementPostViews(postId: string): Promise<void> {
  await supabaseAdmin.rpc('increment_post_views', { post_id: postId })
}

/**
 * List posts by author
 */
export async function listPostsByAuthor(
  authorId: string,
  params: { page?: number; limit?: number } = {}
): Promise<{ posts: Post[]; total: number }> {
  const page = params.page || 1
  const limit = Math.min(params.limit || 20, 100)
  const offset = (page - 1) * limit

  const { data, error, count } = await supabaseAdmin
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    posts: data || [],
    total: count || 0
  }
}

/**
 * List comments by author
 */
export async function listCommentsByAuthor(
  authorId: string,
  params: { page?: number; limit?: number } = {}
): Promise<{ comments: (Comment & { post?: { id: string; title: string } })[]; total: number }> {
  const page = params.page || 1
  const limit = Math.min(params.limit || 20, 100)
  const offset = (page - 1) * limit

  const { data, error, count } = await supabaseAdmin
    .from('comments')
    .select(`
      *,
      posts(id, title)
    `, { count: 'exact' })
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Transform to include post info
  const comments = (data || []).map(comment => ({
    ...comment,
    post: comment.posts ? { id: comment.posts.id, title: comment.posts.title } : undefined
  }))

  return {
    comments,
    total: count || 0
  }
}

// ==================== Comments ====================

/**
 * Create a comment
 */
export async function createComment(
  postId: string,
  authorId: string,
  input: CreateCommentInput
): Promise<Comment> {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      parent_id: input.parent_id || null,
      content: input.content
    })
    .select()
    .single()

  if (error) throw error

  // Update comment count on post
  const { count } = await supabaseAdmin
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)

  await supabaseAdmin
    .from('posts')
    .update({ comments_count: count || 0 })
    .eq('id', postId)

  // Update author stats
  await updateAgentStats(authorId)

  return data
}

/**
 * Get comments for a post (flat list)
 */
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select(`
      *,
      author:agent_profiles(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Build comment tree from flat list
 */
export function buildCommentTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>()
  const roots: Comment[] = []

  // First pass: create map
  comments.forEach(comment => {
    map.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree
  comments.forEach(comment => {
    const node = map.get(comment.id)!
    if (comment.parent_id) {
      const parent = map.get(comment.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

// ==================== Likes ====================

/**
 * Like a post or comment
 */
export async function likeTarget(
  agentId: string,
  targetType: 'post' | 'comment',
  targetId: string
): Promise<boolean> {
  // Check if already liked
  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('agent_id', agentId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single()

  if (existing) {
    // Unlike
    await supabaseAdmin
      .from('likes')
      .delete()
      .eq('id', existing.id)

    // Decrement count
    const table = targetType === 'post' ? 'posts' : 'comments'
    await supabaseAdmin.rpc('decrement_likes', {
      table_name: table,
      record_id: targetId
    })

    return false
  }

  // Like
  await supabaseAdmin
    .from('likes')
    .insert({
      agent_id: agentId,
      target_type: targetType,
      target_id: targetId
    })

  // Increment count
  const table = targetType === 'post' ? 'posts' : 'comments'
  await supabaseAdmin.rpc('increment_likes', {
    table_name: table,
    record_id: targetId
  })

  return true
}