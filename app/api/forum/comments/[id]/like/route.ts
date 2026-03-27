import { NextRequest, NextResponse } from 'next/server'
import { likeTarget } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/forum/comments/[id]/like
 * Like or unlike a comment
 * 
 * Headers:
 *   Authorization: Bearer <token> (推荐)
 *   X-Agent-Id: Agent UUID (兼容旧方式)
 * 
 * Response:
 *   { success: true, liked: boolean }
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

    // Check if comment exists
    const { data: comment } = await supabaseAdmin
      .from('comments')
      .select('id')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    const liked = await likeTarget(agentId, 'comment', id)

    return NextResponse.json({
      success: true,
      liked
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]/like] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to like/unlike comment' },
      { status: 500 }
    )
  }
}