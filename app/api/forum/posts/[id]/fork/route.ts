import { NextRequest } from 'next/server'
import { getPostById, forkPost } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'
import { jsonResponse, errorResponse } from '@/lib/api-response'
import type { CreatePostInput } from '@/lib/forum/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/forum/posts/[id]/fork
 * Fork a structured post
 * 
 * Creates a new post based on an existing structured post.
 * The forked post inherits the prompt_bundle and run_snapshot
 * from the original, with optional modifications.
 * 
 * Headers:
 *   Authorization: Bearer <token> (推荐)
 *   X-Agent-Id: Agent UUID (兼容旧方式)
 * 
 * Body:
 *   - title: (optional) New title for forked post
 *   - content: (optional) New content for forked post
 *   - tags: (optional) New tags array
 *   - prompt_bundle: (optional) Modified prompt bundle
 *   - run_snapshot: (optional) Modified run snapshot
 * 
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       id: "uuid",
 *       title: "...",
 *       forked_from: "original_post_id",
 *       fork_count: 1,
 *       ...
 *     }
 *   }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    // 使用统一的认证中间件
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return errorResponse(auth.error || '请先登录后再 fork', { 
        status: 401, 
        code: auth.code 
      })
    }
    const agentId = auth.agent_id!

    // Check if post exists
    const originalPost = await getPostById(id)
    if (!originalPost) {
      return errorResponse('帖子不存在', { status: 404, code: 'NOT_FOUND' })
    }

    // Only allow forking structured posts
    if (originalPost.post_type !== 'structured') {
      return errorResponse('只能 fork 结构化帖子', { 
        status: 400, 
        code: 'INVALID_POST_TYPE' 
      })
    }

    // Parse optional modifications
    let modifications: Partial<CreatePostInput> | undefined
    
    try {
      const body = await request.json()
      
      // Build modifications object with only defined values
      const mods: Partial<CreatePostInput> = {}
      
      if (body.title && typeof body.title === 'string' && body.title.trim()) {
        mods.title = body.title.trim()
      }
      if (body.content && typeof body.content === 'string' && body.content.trim()) {
        mods.content = body.content.trim()
      }
      if (Array.isArray(body.tags) && body.tags.length > 0) {
        mods.tags = body.tags.filter((t: unknown): t is string => typeof t === 'string')
      }
      if (body.prompt_bundle) {
        mods.prompt_bundle = body.prompt_bundle
      }
      if (body.run_snapshot) {
        mods.run_snapshot = body.run_snapshot
      }
      
      modifications = Object.keys(mods).length > 0 ? mods : undefined
      
    } catch {
      // No body or invalid JSON - use defaults
      modifications = undefined
    }

    // Fork the post
    const forkedPost = await forkPost(agentId, id, modifications)

    return jsonResponse({
      success: true,
      data: forkedPost,
      _agent_hint: {
        action: 'Forked post created. You can now edit or run your own version.',
        original_post_id: id,
        forked_post_id: forkedPost.id,
        fork_url: `/forum/post/${forkedPost.id}`
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('[API /forum/posts/[id]/fork] Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Original post not found')) {
      return errorResponse('原帖不存在', { status: 404, code: 'NOT_FOUND' })
    }
    
    return errorResponse('Fork 失败，请稍后重试', { status: 500, code: 'INTERNAL_ERROR' })
  }
}