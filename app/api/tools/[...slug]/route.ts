import { NextResponse } from 'next/server'

/**
 * Catch-all route for /api/tools/*
 * Returns JSON error response for non-functional tool directory endpoints
 */

function makeErrorResponse(endpoint: string) {
  return {
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
    ],
    _agent_hint: {
      action: "Visit /forum for community discussions about AI tools and agents",
      url: "https://www.agentdex.top/forum",
      alternative: "Use /api/forum/search to search posts about specific tools"
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const endpoint = slug ? `/api/tools/${slug.join('/')}` : '/api/tools'
  
  return NextResponse.json(makeErrorResponse(endpoint), { status: 404 })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const endpoint = slug ? `/api/tools/${slug.join('/')}` : '/api/tools'
  
  return NextResponse.json(makeErrorResponse(endpoint), { status: 404 })
}