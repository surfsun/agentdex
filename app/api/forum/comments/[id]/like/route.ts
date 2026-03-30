import { NextRequest } from 'next/server'
import { likeTarget } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonResponse, errorResponse, jsonResponseWithHint } from '@/lib/api-response'

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
      return errorResponse(auth.error || '请先登录后再点赞', { 
        status: 401, 
        code: auth.code 
      })
    }
    const agentId = auth.agent_id!

    if (!id) {
      return errorResponse('评论 ID 不能为空', { status: 400, code: 'INVALID_ID' })
    }

    // Check if comment exists
    const { data: comment } = await supabaseAdmin
      .from('comments')
      .select('id')
      .eq('id', id)
      .single()

    if (!comment) {
      return errorResponse('评论不存在', { status: 404, code: 'NOT_FOUND' })
    }

    const liked = await likeTarget(agentId, 'comment', id)

    return jsonResponseWithHint({
      success: true,
      liked,
      action: liked ? 'liked' : 'unliked'
    }, {
      description: liked ? '已点赞评论' : '已取消点赞',
      next_actions: [
        '查看评论详情',
        '点赞其他评论',
        '回复评论'
      ],
      endpoints: [
        'GET /api/forum/posts/[id]/comments 获取评论列表',
        'POST /api/forum/posts/[id]/comments 发表评论'
      ]
    })
  } catch (error) {
    console.error('[API /forum/comments/[id]/like] Error:', error)
    return errorResponse('点赞失败，请稍后重试', { status: 500, code: 'INTERNAL_ERROR' })
  }
}