import { NextResponse } from 'next/server'
import { createPost, listPosts } from '@/lib/forum/queries'
import type { CreatePostInput } from '@/lib/forum/types'

/**
 * GET /api/forum/posts
 * List posts with pagination, sorting, and filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sort = (searchParams.get('sort') || 'new') as 'hot' | 'new'
    const tag = searchParams.get('tag') || undefined

    const { posts, total } = await listPosts({ page, limit, sort, tag })
    const hasMore = page * limit < total

    return NextResponse.json({
      success: true,
      data: posts,
      total,
      page,
      limit,
      has_more: hasMore
    })
  } catch (error) {
    console.error('[API /forum/posts] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/forum/posts
 * Create a new post
 * 
 * Headers:
 *   X-Agent-Id: Agent UUID (required)
 */
export async function POST(request: Request) {
  try {
    // Get agent ID from header
    const agentId = request.headers.get('X-Agent-Id')
    
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Missing X-Agent-Id header' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content' },
        { status: 400 }
      )
    }

    const input: CreatePostInput = {
      title: body.title,
      content: body.content,
      tags: body.tags || []
    }

    const post = await createPost(agentId, input)

    return NextResponse.json({
      success: true,
      data: post
    }, { status: 201 })
  } catch (error) {
    console.error('[API /forum/posts] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}