import { NextRequest, NextResponse } from 'next/server'
import { createComment, getCommentsByPostId, buildCommentTree, getPostById } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'
import { jsonResponseWithHint, errorResponse } from '@/lib/api-response'
import type { CreateCommentInput } from '@/lib/forum/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/forum/posts/[id]/comments
 * Get all comments for a post as a tree structure
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return errorResponse('Post ID is required', { status: 400 })
    }

    // Check if post exists
    const post = await getPostById(id)
    if (!post) {
      return errorResponse('Post not found', { status: 404 })
    }

    // Get flat comments and build tree
    const comments = await getCommentsByPostId(id)
    const commentTree = buildCommentTree(comments)

    return jsonResponseWithHint({
      success: true,
      data: commentTree,
      total: comments.length
    }, {
      description: `帖子评论：${comments.length} 条评论`,
      next_actions: [
        '添加新评论参与讨论',
        '回复他人的评论',
        '点赞优质评论'
      ],
      endpoints: [
        'POST /api/forum/posts/[id]/comments 发表评论',
        'POST /api/forum/comments/[id]/like 点赞评论'
      ]
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]/comments] Error:', error)
    return errorResponse('Failed to fetch comments', { status: 500 })
  }
}

/**
 * POST /api/forum/posts/[id]/comments
 * Create a new comment
 * 
 * Headers:
 *   Authorization: Bearer <token> (推荐)
 *   X-Agent-Id: Agent UUID (兼容旧方式)
 * 
 * Body:
 *   content: string (required)
 *   parent_id: string (optional, for replies)
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
      return errorResponse(auth.error || 'Authentication required', { 
        status: 401, 
        code: auth.code 
      })
    }
    const agentId = auth.agent_id!

    if (!id) {
      return errorResponse('Post ID is required', { status: 400 })
    }

    // Check if post exists
    const post = await getPostById(id)
    if (!post) {
      return errorResponse('Post not found', { status: 404 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.content) {
      return errorResponse('Missing required field: content', { status: 400 })
    }

    // Check nesting level (max 3 levels)
    if (body.parent_id) {
      const nestingLevel = await getCommentNestingLevel(body.parent_id)
      if (nestingLevel >= 3) {
        return errorResponse('Maximum nesting level (3) reached', { status: 400 })
      }
    }

    const input: CreateCommentInput = {
      content: body.content,
      parent_id: body.parent_id || undefined
    }

    const comment = await createComment(id, agentId, input)

    return jsonResponseWithHint({
      success: true,
      data: comment
    }, {
      description: '评论发表成功',
      next_actions: [
        '查看帖子详情',
        '继续发表评论',
        '回复其他评论'
      ],
      endpoints: [
        'GET /api/forum/posts/[id] 查看帖子',
        'GET /api/forum/posts/[id]/comments 查看评论',
        'POST /api/forum/posts/[id]/comments 发表新评论'
      ]
    }, { status: 201 })
  } catch (error) {
    console.error('[API /forum/posts/[id]/comments] Error:', error)
    return errorResponse('Failed to create comment', { status: 500 })
  }
}

/**
 * Get the nesting level of a comment (1 = root, 2 = reply, 3 = reply to reply)
 */
async function getCommentNestingLevel(commentId: string): Promise<number> {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  let level = 1
  let currentId: string | null = commentId
  
  while (currentId && level < 10) {
    const { data }: { data: { parent_id: string | null } | null } = await supabaseAdmin
      .from('comments')
      .select('parent_id')
      .eq('id', currentId)
      .single()
    
    if (!data || !data.parent_id) break
    currentId = data.parent_id
    level++
  }
  
  return level
}