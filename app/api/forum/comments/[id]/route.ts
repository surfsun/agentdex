import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/identity/auth'
import { supabaseAdmin } from '@/lib/supabase'

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
      return NextResponse.json(
        { success: false, error: 'Comment ID is required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comment' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication required' },
        { status: 401 }
      )
    }
    const agentId = auth.agent_id!

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    // Get current comment
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (comment.author_id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own comments' },
        { status: 403 }
      )
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

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication required' },
        { status: 401 }
      )
    }
    const agentId = auth.agent_id!

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    // Get current comment
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (comment.author_id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own comments' },
        { status: 403 }
      )
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

    return NextResponse.json({
      success: true,
      message: 'Comment deleted'
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}