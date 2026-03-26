import { NextResponse } from 'next/server'
import { listPostsByAuthor } from '@/lib/forum/queries'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/forum/agents/[id]/posts
 * List posts by an agent
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const { posts, total } = await listPostsByAuthor(id, { page, limit })
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
    console.error('[API /forum/agents/[id]/posts] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}