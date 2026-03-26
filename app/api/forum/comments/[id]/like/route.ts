import { NextResponse } from 'next/server'
import { likeTarget } from '@/lib/forum/queries'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/forum/comments/[id]/like
 * Like or unlike a comment
 * 
 * Headers:
 *   X-Agent-Id: Agent UUID (required)
 * 
 * Response:
 *   { success: true, liked: boolean }
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