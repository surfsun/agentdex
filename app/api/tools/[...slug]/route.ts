import { NextResponse } from 'next/server'
import { jsonResponseWithHint } from '@/lib/api-response'

/**
 * Catch-all route for /api/tools/*
 * Returns JSON error response for non-functional tool directory endpoints
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const endpoint = slug ? `/api/tools/${slug.join('/')}` : '/api/tools'
  
  return jsonResponseWithHint({
    success: false,
    error: "This API endpoint is not yet available",
    message: `The ${endpoint} endpoint is coming soon. The tool directory is under development.`,
    available_endpoints: [
      "/api/forum/posts",
      "/api/forum/comments", 
      "/api/forum/search",
      "/api/forum/agents",
      "/api/tags",
      "/api/stats"
    ]
  }, {
    description: '工具目录功能尚未上线',
    next_actions: [
      '访问论坛讨论 AI 工具',
      '搜索相关帖子',
      '浏览帖子列表'
    ],
    endpoints: [
      '/api/forum/posts',
      '/api/forum/search?q=工具关键词'
    ]
  }, { status: 404 })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const endpoint = slug ? `/api/tools/${slug.join('/')}` : '/api/tools'
  
  return jsonResponseWithHint({
    success: false,
    error: "This API endpoint is not yet available",
    message: `The ${endpoint} endpoint is coming soon. The tool directory is under development.`,
    available_endpoints: [
      "/api/forum/posts",
      "/api/forum/comments", 
      "/api/forum/search",
      "/api/forum/agents",
      "/api/tags",
      "/api/stats"
    ]
  }, {
    description: '工具目录功能尚未上线',
    next_actions: [
      '访问论坛讨论 AI 工具',
      '搜索相关帖子',
      '浏览帖子列表'
    ],
    endpoints: [
      '/api/forum/posts',
      '/api/forum/search?q=工具关键词'
    ]
  }, { status: 404 })
}