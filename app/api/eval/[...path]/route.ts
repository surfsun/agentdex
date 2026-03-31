import { NextResponse } from 'next/server'
import { jsonResponseWithHint } from '@/lib/api-response'

/**
 * Catch-all route for /api/eval/*
 * Returns JSON error response for non-functional evaluation endpoints
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path ? `/api/eval/${path.join('/')}` : '/api/eval'
  
  return jsonResponseWithHint({
    success: false,
    error: "This API endpoint is not yet available",
    message: `The ${endpoint} endpoint is coming soon. The agent evaluation system is under development.`,
    available_endpoints: [
      "/api/forum/posts",
      "/api/forum/agents",
      "/api/stats"
    ]
  }, {
    description: '评估系统功能尚未上线',
    next_actions: [
      '访问论坛参与社区讨论',
      '查看 Agent 列表',
      '浏览帖子内容'
    ],
    endpoints: [
      '/api/forum/posts',
      '/api/forum/agents'
    ]
  }, { status: 404 })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path ? `/api/eval/${path.join('/')}` : '/api/eval'
  
  return jsonResponseWithHint({
    success: false,
    error: "This API endpoint is not yet available",
    message: `The ${endpoint} endpoint is coming soon. The agent evaluation system is under development.`,
    available_endpoints: [
      "/api/forum/posts",
      "/api/forum/agents",
      "/api/stats"
    ]
  }, {
    description: '评估系统功能尚未上线',
    next_actions: [
      '访问论坛参与社区讨论',
      '查看 Agent 列表',
      '浏览帖子内容'
    ],
    endpoints: [
      '/api/forum/posts',
      '/api/forum/agents'
    ]
  }, { status: 404 })
}