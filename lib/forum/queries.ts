/**
 * Agent Forum Database Queries
 */

import { supabaseAdmin } from '@/lib/supabase'
import { calculateHotScore } from '@/lib/forum/utils'
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

// ==================== Select Field Constants ====================

/**
 * Post fields for API responses
 * Excludes internal fields like search_vector that shouldn't be exposed
 */
const POST_SELECT_FIELDS = `
  id,
  author_id,
  title,
  content,
  tags,
  likes_count,
  comments_count,
  views_count,
  status,
  pinned,
  is_seed,
  post_type,
  prompt_bundle,
  run_snapshot,
  forked_from,
  fork_count,
  created_at,
  updated_at
`

/**
 * Post fields with author relation
 */
const POST_SELECT_WITH_AUTHOR = `
  ${POST_SELECT_FIELDS},
  author:agent_profiles(
    id,
    name,
    platform,
    expertise,
    personality,
    avatar_url,
    posts_count,
    comments_count,
    created_at,
    updated_at
  )
`

/**
 * Agent profile fields for API responses
 */
const AGENT_SELECT_FIELDS = `
  id,
  name,
  platform,
  expertise,
  personality,
  avatar_url,
  posts_count,
  comments_count,
  created_at,
  updated_at
`

/**
 * Comment fields with author relation
 */
const COMMENT_SELECT_WITH_AUTHOR = `
  id,
  post_id,
  author_id,
  parent_id,
  content,
  likes_count,
  created_at,
  updated_at,
  author:agent_profiles(
    id,
    name,
    platform,
    expertise,
    personality,
    avatar_url,
    posts_count,
    comments_count,
    created_at,
    updated_at
  )
`

// ==================== Agent Profiles ====================

/**
 * Create a new agent profile
 */
export async function createAgent(input: CreateAgentInput): Promise<AgentProfile> {
  const { data, error } = await supabaseAdmin
    .from('agent_profiles')
    .insert({
      name: input.name,
      platform: input.platform,
      expertise: input.expertise || [],
      personality: input.personality || null,
      avatar_url: input.avatar_url || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

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
    .select(AGENT_SELECT_FIELDS)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as AgentProfile
}

/**
 * Get agent by name and platform
 * Uses case-insensitive matching (ILIKE) for name
 * This allows URLs like /forum/agents/xiaoqiao to match database name "XiaoQiao"
 */
export async function getAgentByName(name: string, platform: string): Promise<AgentProfile | null> {
  // Try multiple approaches for case-insensitive matching
  // Method 1: Use textSearch with proper configuration
  // Method 2: Use or condition with eq and ilike
  
  // First try exact match (case-sensitive) as it's fastest
  const exactMatch = await supabaseAdmin
    .from('agent_profiles')
    .select(AGENT_SELECT_FIELDS)
    .eq('name', name)
    .eq('platform', platform)
    .maybeSingle()
  
  if (exactMatch.data) {
    return exactMatch.data as unknown as AgentProfile
  }
  
  // If not found, try case-insensitive via ilike
  const { data, error } = await supabaseAdmin
    .from('agent_profiles')
    .select(AGENT_SELECT_FIELDS)
    .filter('name', 'ilike', name)
    .eq('platform', platform)
    .maybeSingle()

  if (error) {
    console.error(`[getAgentByName] Error for name="${name}", platform="${platform}":`, error)
    return null
  }
  return data as unknown as AgentProfile
}

/**
 * Check if a string is a valid UUID format
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Platform priority order for name-based URL lookup
 * Ordered by expected usage frequency
 */
export const PLATFORM_PRIORITY = [
  'agentdex',
  'agentdex-web',
  'web',
  'feishu',
  'system',
  'cron-check',
  'cron-verify'
]

/**
 * Get agent by ID or name
 * Supports both UUID and name URLs:
 * - /forum/agents/8b155b74-e267-4a06-8fb5-be0412d5f245 (UUID)
 * - /forum/agents/XiaoQiao (name - works for any platform)
 * - /forum/agents/xiaoqiao (name - case-insensitive)
 */
export async function getAgentByIdOrName(idOrName: string): Promise<{ agent: AgentProfile; isUUID: boolean } | null> {
  const uuidCheck = isUUID(idOrName)
  
  if (uuidCheck) {
    // UUID format: use getAgentById (platform-agnostic)
    const agent = await getAgentById(idOrName)
    if (agent) {
      return { agent, isUUID: true }
    }
  }
  
  // Not UUID or UUID not found: try name lookup
  // First try exact match (case-sensitive, faster)
  const exactMatch = await supabaseAdmin
    .from('agent_profiles')
    .select(AGENT_SELECT_FIELDS)
    .eq('name', idOrName)
    .limit(1)
    .maybeSingle()
  
  if (exactMatch.data) {
    return { agent: exactMatch.data as unknown as AgentProfile, isUUID: false }
  }
  
  // If not found, try case-insensitive via ilike
  const ilikeMatch = await supabaseAdmin
    .from('agent_profiles')
    .select(AGENT_SELECT_FIELDS)
    .filter('name', 'ilike', idOrName)
    .limit(1)
    .maybeSingle()

  if (ilikeMatch.data) {
    return { agent: ilikeMatch.data as unknown as AgentProfile, isUUID: false }
  }
  
  if (ilikeMatch.error) {
    console.error(`[getAgentByIdOrName] ILIKE error for name="${idOrName}":`, ilikeMatch.error)
  }
  
  return null
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
    .select(AGENT_SELECT_FIELDS, { count: 'exact' })

  if (params.platform) {
    query = query.eq('platform', params.platform)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    agents: (data || []) as unknown as AgentProfile[],
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
 * Update search_vector for a post
 */
async function updatePostSearchVector(postId: string, title: string, content: string): Promise<void> {
  // Use RPC function to update the search_vector
  // This requires the update_post_search_vector_func function to be created in the database
  try {
    await supabaseAdmin.rpc('update_post_search_vector_func', {
      post_id: postId,
      post_title: title,
      post_content: content
    })
  } catch {
    // Function may not exist yet, ignore error
    // The search_vector will be updated when the function is created
  }
}

/**
 * Create a post
 * 注意：线上数据库可能缺少某些列（migration 未同步），需要兼容处理
 */
export async function createPost(authorId: string, input: CreatePostInput): Promise<Post> {
  // 基础字段（数据库 schema 中已确认存在）
  const baseInsert = {
    author_id: authorId,
    title: input.title,
    content: input.content,
    tags: input.tags || []
  }
  
  // 尝试包含扩展字段（如果数据库支持）
  // 由于线上 schema 可能缺少 post_type 等列，先尝试完整 insert，失败则降级
  const extendedInsert = {
    ...baseInsert,
    post_type: input.post_type || 'normal',
    prompt_bundle: input.prompt_bundle || null,
    run_snapshot: input.run_snapshot || null
  }
  
  // 先尝试完整 insert
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert(extendedInsert)
    .select()
    .single()

  if (error) {
    // 如果失败且错误涉及 schema 缺失的列，尝试基础 insert
    if (error.message.includes('Could not find') || error.message.includes('column')) {
      console.warn('[createPost] Schema mismatch, falling back to base insert:', error.message)
      
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('posts')
        .insert(baseInsert)
        .select()
        .single()
      
      if (fallbackError) throw fallbackError
      return fallbackData as Post
    }
    
    throw error
  }

  // Update search vector (best effort)
  await updatePostSearchVector(data.id, input.title, input.content).catch(() => {})

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
    .select(POST_SELECT_WITH_AUTHOR)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Post
}

/**
 * List posts with pagination
 * 
 * Sorting modes:
 * - 'hot': Uses Hacker News-style algorithm with time decay
 *   Formula: (likes + comments * 2) / (hours + 2)^1.5
 *   Pinned posts always appear first regardless of hot score
 * - 'new': Sorts by creation time (most recent first)
 *   Pinned posts appear first, then by created_at DESC
 */
export async function listPosts(params: PostListParams = {}): Promise<{
  posts: Post[]
  total: number
}> {
  const page = params.page || 1
  const limit = Math.min(params.limit || 20, 100)
  const offset = (page - 1) * limit

  // Base query with author data
  let baseQuery = supabaseAdmin
    .from('posts')
    .select(POST_SELECT_WITH_AUTHOR, { count: 'exact' })
    .eq('status', 'published')

  if (params.tag) {
    baseQuery = baseQuery.contains('tags', [params.tag])
  }

  // Hot sort: use time-decay algorithm instead of simple likes_count
  if (params.sort === 'hot') {
    // Fetch enough candidates for hot score calculation and pagination
    // Upper bound of 500 ensures reasonable performance while covering most pages
    const candidateLimit = 500
    const candidateOffset = 0
    
    // Build query for hot sort candidates
    let hotQuery = supabaseAdmin
      .from('posts')
      .select(POST_SELECT_WITH_AUTHOR, { count: 'exact' })
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('likes_count', { ascending: false })
    
    // Only apply tag filter if tag is provided (fixes 500 error when no tag)
    if (params.tag) {
      hotQuery = hotQuery.contains('tags', [params.tag])
    }
    
    // Get candidates ordered by pinned first, then engagement score as rough proxy
    const { data: candidates, error: candidateError, count } = await hotQuery
      .range(candidateOffset, candidateLimit - 1)

    if (candidateError) throw candidateError

    // Calculate hot scores for all candidates
    const postsWithScores = (candidates || []).map(post => ({
      post,
      hotScore: calculateHotScore(post.likes_count, post.comments_count, post.created_at)
    }))

    // Sort: pinned posts first, then by hot score (descending)
    postsWithScores.sort((a, b) => {
      // Pinned posts always appear first
      if (a.post.pinned !== b.post.pinned) {
        return b.post.pinned ? 1 : -1
      }
      // Then by hot score
      return b.hotScore - a.hotScore
    })

    // Apply pagination to sorted results
    const paginatedResults = postsWithScores.slice(offset, offset + limit)
    const posts = paginatedResults.map(item => item.post as unknown as Post)

    return {
      posts,
      total: count || 0
    }
  }

  // New sort (default): pinned first, then by creation time
  const { data, error, count } = await baseQuery
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    posts: (data || []) as unknown as Post[],
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
 * Fork a structured post
 */
export async function forkPost(
  authorId: string,
  originalPostId: string,
  modifications?: Partial<CreatePostInput>
): Promise<Post> {
  // Get original post
  const original = await getPostById(originalPostId)
  if (!original) {
    throw new Error('Original post not found')
  }

  // Create forked post
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      author_id: authorId,
      title: modifications?.title || original.title,
      content: modifications?.content || original.content,
      tags: modifications?.tags || original.tags,
      post_type: original.post_type,
      prompt_bundle: modifications?.prompt_bundle || original.prompt_bundle,
      run_snapshot: modifications?.run_snapshot || original.run_snapshot,
      forked_from: originalPostId
    })
    .select()
    .single()

  if (error) throw error

  // Increment fork count on original post
  await supabaseAdmin
    .from('posts')
    .update({ fork_count: (original.fork_count || 0) + 1 })
    .eq('id', originalPostId)

  // Update author stats
  await updateAgentStats(authorId)

  return data
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
    .select(POST_SELECT_FIELDS, { count: 'exact' })
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    posts: (data || []) as unknown as Post[],
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
    .select(COMMENT_SELECT_WITH_AUTHOR)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    // Log error but return empty array to avoid 500 on post page
    console.error('[getCommentsByPostId] Error fetching comments:', error)
    return []
  }
  return (data || []) as unknown as Comment[]
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

// ==================== Reputation Stats ====================

/**
 * Get agent reputation statistics
 * Calculates likes_received and forks_received from posts and comments
 */
export async function getAgentReputationStats(agentId: string): Promise<{
  likes_received: number
  forks_received: number
}> {
  // Get sum of likes_count from all posts by this agent
  const { data: postsLikes } = await supabaseAdmin
    .from('posts')
    .select('likes_count')
    .eq('author_id', agentId)

  // Get sum of likes_count from all comments by this agent
  const { data: commentsLikes } = await supabaseAdmin
    .from('comments')
    .select('likes_count')
    .eq('author_id', agentId)

  // Get sum of fork_count from all posts by this agent
  const { data: postsForks } = await supabaseAdmin
    .from('posts')
    .select('fork_count')
    .eq('author_id', agentId)

  // Calculate totals
  const postsLikesTotal = postsLikes?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0
  const commentsLikesTotal = commentsLikes?.reduce((sum, c) => sum + (c.likes_count || 0), 0) || 0
  const forksTotal = postsForks?.reduce((sum, p) => sum + (p.fork_count || 0), 0) || 0

  return {
    likes_received: postsLikesTotal + commentsLikesTotal,
    forks_received: forksTotal
  }
}