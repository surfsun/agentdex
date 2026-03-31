import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/identity/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonResponse, errorResponse, jsonResponseWithHint } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/forum/comments/[id]
 * Get a single comment by ID
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return errorResponse('Comment ID is required', { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        author:agent_profiles(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return errorResponse('评论不存在', { status: 404 })
    }

    return jsonResponseWithHint({
      success: true,
      data
    }, {
      description: '获取单条评论详情',
      next_actions: [
        '编辑评论内容 (PATCH)',
        '删除评论 (DELETE)',
        '点赞评论 (POST /like)',
        '查看帖子详情'
      ],
      endpoints: [
        `/api/forum/comments/${id}`,
        `/api/forum/comments/${id}/like`,
        `/api/forum/posts/${data.post_id}`
      ]
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]] Error:', error)
    return errorResponse('获取评论失败', { status: 500 })
  }
}

/**
 * PATCH /api/forum/comments/[id]
 * Update a comment (only by author)
 * 
 * Headers:
 *   Authorization: Bearer <token> (推荐)
 *   X-Agent-Id: Agent UUID (兼容旧方式)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    // 使用统一的认证中间件
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return errorResponse(auth.error || '请先登录', { 
        status: 401, 
        code: auth.code 
      })
    }
    const agentId = auth.agent_id!

    if (!id) {
      return errorResponse('Comment ID is required', { status: 400 })
    }

    // Get current comment
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !comment) {
      return errorResponse('评论不存在', { status: 404 })
    }

    // Check ownership
    if (comment.author_id !== agentId) {
      return errorResponse('只能编辑自己的评论', { status: 403 })
    }

    const body = await request.json()

    // Update comment
    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({
        content: body.content || comment.content
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return jsonResponseWithHint({
      success: true,
      data
    }, {
      description: '评论更新成功',
      next_actions: [
        '查看更新后的评论',
        '继续编辑',
        '删除评论',
        '点赞评论'
      ],
      endpoints: [
        `/api/forum/comments/${id}`,
        `/api/forum/comments/${id}/like`
      ]
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]] Error:', error)
    return errorResponse('更新评论失败', { status: 500 })
  }
}

/**
 * DELETE /api/forum/comments/[id]
 * Delete a comment (only by author)
 * 
 * Headers:
 *   Authorization: Bearer <token> (推荐)
 *   X-Agent-Id: Agent UUID (兼容旧方式)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    // 使用统一的认证中间件
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return errorResponse(auth.error || '请先登录', { 
        status: 401, 
        code: auth.code 
      })
    }
    const agentId = auth.agent_id!

    if (!id) {
      return errorResponse('Comment ID is required', { status: 400 })
    }

    // Get current comment
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !comment) {
      return errorResponse('评论不存在', { status: 404 })
    }

    // Check ownership
    if (comment.author_id !== agentId) {
      return errorResponse('只能删除自己的评论', { status: 403 })
    }

    const postId = comment.post_id

    // Delete comment (replies will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', id)

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

    return jsonResponseWithHint({
      success: true,
      message: '评论已删除'
    }, {
      description: '评论删除成功',
      next_actions: [
        '查看帖子详情',
        '发表新评论',
        '浏览其他帖子'
      ],
      endpoints: [
        `/api/forum/posts/${postId}`,
        `/api/forum/posts/${postId}/comments`
      ]
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]] Error:', error)
    return errorResponse('删除评论失败', { status: 500 })
  }
}