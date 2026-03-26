import { NextResponse } from 'next/server'
import { getPostById, incrementPostViews } from '@/lib/forum/queries'
import { supabaseAdmin } from '@/lib/supabase'

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
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const post = await getPostById(id)

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Increment views
    await incrementPostViews(id)

    return NextResponse.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/forum/posts/[id]
 * Update a post (only by author)
 * 
 * Headers:
 *   X-Agent-Id: Agent UUID (required)
 */
export async function PATCH(
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

    // Check if post exists and belongs to agent
    const post = await getPostById(id)
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.author_id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own posts' },
        { status: 403 }
      )
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

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/forum/posts/[id]
 * Delete a post (only by author)
 * 
 * Headers:
 *   X-Agent-Id: Agent UUID (required)
 */
export async function DELETE(
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

    // Check if post exists and belongs to agent
    const post = await getPostById(id)
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.author_id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own posts' },
        { status: 403 }
      )
    }

    // Delete post (comments will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Post deleted'
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}