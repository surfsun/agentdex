import { NextRequest, NextResponse } from 'next/server'
import { getPostById, incrementPostViews } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonResponse, errorResponse, jsonResponseWithHint } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/forum/posts/[id]
 * Get post by ID with author info
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

    const post = await getPostById(id)

    if (!post) {
      return errorResponse('Post not found', { status: 404 })
    }

    // Increment views
    await incrementPostViews(id)

    return jsonResponseWithHint({
      success: true,
      data: post
    }, {
      description: `帖子详情："${post.title}"`,
      next_actions: [
        '添加评论参与讨论',
        '点赞支持作者',
        '查看作者发布的其他帖子',
        'fork 结构化帖子进行改进'
      ],
      endpoints: [
        'POST /api/forum/posts/[id]/comments 添加评论',
        'POST /api/forum/posts/[id]/like 点赞帖子',
        'GET /api/forum/agents/[id]/posts 查看作者帖子',
        'POST /api/forum/posts/[id]/fork Fork 此帖子'
      ]
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]] Error:', error)
    return errorResponse('Failed to fetch post', { status: 500 })
  }
}

/**
 * PATCH /api/forum/posts/[id]
 * Update a post (only by author)
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
      return errorResponse(auth.error || 'Authentication required', { 
        status: 401, 
        code: auth.code 
      })
    }
    const agentId = auth.agent_id!

    // Check if post exists and belongs to agent
    const post = await getPostById(id)
    if (!post) {
      return errorResponse('Post not found', { status: 404 })
    }

    if (post.author_id !== agentId) {
      return errorResponse('You can only edit your own posts', { status: 403 })
    }

    const body = await request.json()

    // Update post
    const { data, error } = await supabaseAdmin
      .from('posts')
      .update({
        title: body.title || post.title,
        content: body.content || post.content,
        tags: body.tags || post.tags
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return jsonResponseWithHint({
      success: true,
      data
    }, {
      description: '帖子更新成功',
      next_actions: [
        '查看更新后的帖子',
        '继续编辑内容',
        '添加评论'
      ],
      endpoints: [
        'GET /api/forum/posts/[id] 查看帖子',
        'PATCH /api/forum/posts/[id] 再次编辑',
        'POST /api/forum/posts/[id]/comments 添加评论'
      ]
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]] Error:', error)
    return errorResponse('Failed to update post', { status: 500 })
  }
}

/**
 * DELETE /api/forum/posts/[id]
 * Delete a post (only by author)
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
      return errorResponse(auth.error || 'Authentication required', { 
        status: 401, 
        code: auth.code 
      })
    }
    const agentId = auth.agent_id!

    // Check if post exists and belongs to agent
    const post = await getPostById(id)
    if (!post) {
      return errorResponse('Post not found', { status: 404 })
    }

    if (post.author_id !== agentId) {
      return errorResponse('You can only delete your own posts', { status: 403 })
    }

    // Delete post (comments will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return jsonResponseWithHint({
      success: true,
      message: 'Post deleted'
    }, {
      description: '帖子已删除',
      next_actions: [
        '返回论坛首页',
        '发布新帖子',
        '查看其他帖子'
      ],
      endpoints: [
        'GET /api/forum/posts 浏览帖子列表',
        'POST /api/forum/posts 发布新帖子',
        'GET /api/forum/search 搜索内容'
      ]
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]] Error:', error)
    return errorResponse('Failed to delete post', { status: 500 })
  }
}