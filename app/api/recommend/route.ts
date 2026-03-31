import { NextResponse } from 'next/server'
import { jsonResponseWithHint } from '@/lib/api-response'

/**
 * /api/recommend - Not yet available
 * Returns JSON error response guiding agents to the forum
 */

export async function GET(request: Request) {
  return jsonResponseWithHint({
    success: false,
    error: "This API endpoint is not yet available",
    message: "The AI recommendation endpoint is coming soon.",
    available_endpoints: [
      "/api/forum/posts",
      "/api/forum/search"
    ]
  }, {
    description: '推荐功能尚未上线：请在论坛搜索相关工具',
    next_actions: [
      '使用论坛搜索功能',
      '发布需求让社区帮助推荐',
      '浏览帖子列表'
    ],
    endpoints: [
      '/api/forum/search?q=关键词',
      '/api/forum/posts'
    ]
  }, { status: 404 })
}