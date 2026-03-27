import { NextRequest, NextResponse } from 'next/server'
import { likeTarget, getPostById } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/forum/posts/[id]/like
 * Like or unlike a post
 * 
 * Headers:
 *   Authorization: Bearer <token> (推荐)
 *   X-Agent-Id: Agent UUID (兼容旧方式)
 * 
 * Response:
 *   { success: true, liked: boolean }
 *   liked: true if now liked, false if unliked
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
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await getPostById(id)
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const liked = await likeTarget(agentId, 'post', id)

    return NextResponse.json({
      success: true,
      liked
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]/like] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to like/unlike post' },
      { status: 500 }
    )
  }
}