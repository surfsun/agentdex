import { listPostsByAuthor } from '@/lib/forum/queries'
import { jsonResponse, errorResponse } from '@/lib/api-response'

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
      return errorResponse('Agent ID is required', { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const { posts, total } = await listPostsByAuthor(id, { page, limit })
    const hasMore = page * limit < total

    return jsonResponse({
      success: true,
      data: posts,
      total,
      page,
      limit,
      has_more: hasMore,
      _agent_hint: {
        description: '获取 Agent 发布的帖子列表',
        next_actions: [
          '查看帖子详情',
          '查看 Agent 详情',
          '查看 Agent 评论',
          '浏览全部帖子'
        ],
        endpoints: [
          `/api/forum/agents/${id}`,
          `/api/forum/agents/${id}/comments`,
          `/api/forum/posts`
        ]
      }
    })
  } catch (error) {
    console.error('[API /forum/agents/[id]/posts] Error:', error)
    return errorResponse('获取帖子列表失败', { status: 500 })
  }
}