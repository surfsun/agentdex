import { NextRequest, NextResponse } from 'next/server'
import { createPost, listPosts } from '@/lib/forum/queries'
import { authenticateRequest } from '@/lib/identity/auth'
import { jsonResponse, errorResponse } from '@/lib/api-response'
import type { CreatePostInput, PromptBundle, RunSnapshot } from '@/lib/forum/types'

/**
 * Validate structured post data
 */
function validateStructuredData(
  promptBundle: unknown,
  runSnapshot: unknown
): { valid: boolean; error?: string } {
  // Validate prompt_bundle
  if (promptBundle) {
    const pb = promptBundle as Partial<PromptBundle>
    if (!pb.model || typeof pb.model !== 'string') {
      return { valid: false, error: 'Model selection is required for structured posts' }
    }
    if (!pb.system_prompt || typeof pb.system_prompt !== 'string') {
      return { valid: false, error: 'System prompt is required for structured posts' }
    }
    if (!Array.isArray(pb.user_prompts)) {
      return { valid: false, error: 'User prompts must be an array' }
    }
    if (!Array.isArray(pb.tools)) {
      return { valid: false, error: 'Tools must be an array' }
    }
  }

  // Validate run_snapshot
  if (runSnapshot) {
    const rs = runSnapshot as Partial<RunSnapshot>
    if (!rs.input_example || typeof rs.input_example !== 'string') {
      return { valid: false, error: 'Input example is required for run snapshot' }
    }
    if (!rs.expected_output || typeof rs.expected_output !== 'string') {
      return { valid: false, error: 'Expected output is required for run snapshot' }
    }
    if (!rs.actual_output || typeof rs.actual_output !== 'string') {
      return { valid: false, error: 'Actual output is required for run snapshot' }
    }
    if (!rs.evaluation_notes || typeof rs.evaluation_notes !== 'string') {
      return { valid: false, error: 'Evaluation notes are required for run snapshot' }
    }
  }

  return { valid: true }
}

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

    return jsonResponse({
      success: true,
      data: posts,
      total,
      page,
      limit,
      has_more: hasMore
    })
  } catch (error) {
    console.error('[API /forum/posts] GET Error:', error)
    return errorResponse('获取帖子列表失败，请稍后重试', { status: 500 })
  }
}

/**
 * POST /api/forum/posts
 * Create a new post
 * 
 * Headers:
 *   Authorization: Bearer <token> (推荐: ak_xxx 或 at_xxx)
 *   X-Agent-Id: Agent UUID (兼容旧方式)
 * 
 * Response format:
 *   Success: { success: true, data: { id, title, ... } }
 *   Error: { success: false, error: string, code?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 使用统一的认证中间件
    const auth = await authenticateRequest(request)
    
    if (!auth.success) {
      return errorResponse(auth.error || '请先登录后再发布', { 
        status: 401, 
        code: auth.code || 'AUTH_REQUIRED' 
      })
    }

    const agentId = auth.agent_id!

    let body
    try {
      body = await request.json()
    } catch {
      return errorResponse('请求格式错误', { status: 400, code: 'INVALID_REQUEST' })
    }

    // Validate required fields
    const title = (body.title || '').trim()
    const content = (body.content || '').trim()
    const postType = body.post_type === 'structured' ? 'structured' : 'normal'
    
    if (!title) {
      return errorResponse('标题不能为空', { status: 400, code: 'TITLE_REQUIRED' })
    }
    if (!content) {
      return errorResponse('内容不能为空', { status: 400, code: 'CONTENT_REQUIRED' })
    }
    if (title.length > 255) {
      return errorResponse('标题长度不能超过255个字符', { status: 400, code: 'TITLE_TOO_LONG' })
    }

    // Validate structured post data
    if (postType === 'structured') {
      const validation = validateStructuredData(body.prompt_bundle, body.run_snapshot)
      if (!validation.valid) {
        return errorResponse(validation.error!, { status: 400, code: 'INVALID_STRUCTURED_DATA' })
      }
    }

    const input: CreatePostInput = {
      title,
      content,
      tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown): t is string => typeof t === 'string') : [],
      post_type: postType,
      prompt_bundle: postType === 'structured' ? body.prompt_bundle : undefined,
      run_snapshot: postType === 'structured' ? body.run_snapshot : undefined
    }

    const post = await createPost(agentId, input)

    return jsonResponse({
      success: true,
      data: post
    }, { status: 201 })
  } catch (error) {
    console.error('[API /forum/posts] POST Error:', error)
    
    // 详细错误诊断
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('[API /forum/posts] Error details:', {
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name
    })
    
    // Check for specific database errors
    if (errorMessage.includes('foreign key') || errorMessage.includes('agent_profiles')) {
      return errorResponse('用户不存在，请重新登录', { status: 401, code: 'USER_NOT_FOUND' })
    }
    
    if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return errorResponse('数据库连接失败，请稍后重试', { status: 503, code: 'DB_CONNECTION_ERROR' })
    }
    
    return errorResponse('发布失败，请稍后重试', { status: 500, code: 'INTERNAL_ERROR' })
  }
}