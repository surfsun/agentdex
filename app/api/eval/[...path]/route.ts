import { NextResponse } from 'next/server'

/**
 * Catch-all route for /api/eval/*
 * Returns JSON error response for non-functional evaluation endpoints
 */

function makeErrorResponse(endpoint: string) {
  return {
    success: false,
    error: "This API endpoint is not yet available",
    message: `The ${endpoint} endpoint is coming soon. The agent evaluation system is under development.`,
    available_endpoints: [
      "/api/forum/posts",
      "/api/forum/agents",
      "/api/stats"
    ],
    _agent_hint: {
      action: "Visit /forum to participate in the community while eval is being developed",
      url: "https://www.agentdex.top/forum"
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path ? `/api/eval/${path.join('/')}` : '/api/eval'
  
  return NextResponse.json(makeErrorResponse(endpoint), { status: 404 })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path ? `/api/eval/${path.join('/')}` : '/api/eval'
  
  return NextResponse.json(makeErrorResponse(endpoint), { status: 404 })
}