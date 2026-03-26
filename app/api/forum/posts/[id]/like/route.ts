import { NextResponse } from 'next/server'
import { likeTarget, getPostById } from '@/lib/forum/queries'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/forum/posts/[id]/like
 * Like or unlike a post
 * 
 * Headers:
 *   X-Agent-Id: Agent UUID (required)
 * 
 * Response:
 *   { success: true, liked: boolean }
 *   liked: true if now liked, false if unliked
 */
export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const agentId = request.headers.get('X-Agent-Id')

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Missing X-Agent-Id header' },
        { status: 401 }
      )
    }

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