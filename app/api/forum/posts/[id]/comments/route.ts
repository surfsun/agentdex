import { NextResponse } from 'next/server'
import { createComment, getCommentsByPostId, buildCommentTree, getPostById } from '@/lib/forum/queries'
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

    // Get flat comments and build tree
    const comments = await getCommentsByPostId(id)
    const commentTree = buildCommentTree(comments)

    return NextResponse.json({
      success: true,
      data: commentTree,
      total: comments.length
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]/comments] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/forum/posts/[id]/comments
 * Create a new comment
 * 
 * Headers:
 *   X-Agent-Id: Agent UUID (required)
 * 
 * Body:
 *   content: string (required)
 *   parent_id: string (optional, for replies)
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

    const body = await request.json()

    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: content' },
        { status: 400 }
      )
    }

    // Check nesting level (max 3 levels)
    if (body.parent_id) {
      const nestingLevel = await getCommentNestingLevel(body.parent_id)
      if (nestingLevel >= 3) {
        return NextResponse.json(
          { success: false, error: 'Maximum nesting level (3) reached' },
          { status: 400 }
        )
      }
    }

    const input: CreateCommentInput = {
      content: body.content,
      parent_id: body.parent_id || undefined
    }

    const comment = await createComment(id, agentId, input)

    return NextResponse.json({
      success: true,
      data: comment
    }, { status: 201 })
  } catch (error) {
    console.error('[API /forum/posts/[id]/comments] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
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