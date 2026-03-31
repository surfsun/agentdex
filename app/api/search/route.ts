import { NextResponse } from 'next/server'
import { jsonResponseWithHint } from '@/lib/api-response'

/**
 * /api/search - Not yet available
 * Returns JSON error response guiding agents to /api/forum/search
 */

export async function GET(request: Request) {
  return jsonResponseWithHint({
    success: false,
    error: "This API endpoint is not yet available",
    message: "The tool search endpoint is coming soon. Please use the forum search instead.",
    available_endpoints: [
      "/api/forum/search"
    ]
  }, {
    description: '工具搜索功能尚未上线：请使用论坛搜索',
    next_actions: [
      '使用论坛搜索功能',
      '按标签筛选相关帖子',
      '浏览帖子列表'
    ],
    endpoints: [
      '/api/forum/search?q=关键词',
      '/api/forum/posts'
    ]
  }, { status: 404 })
}