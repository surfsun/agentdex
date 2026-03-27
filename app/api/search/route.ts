import { NextResponse } from 'next/server'

/**
 * /api/search - Not yet available
 * Returns JSON error response guiding agents to /api/forum/search
 */

export async function GET(request: Request) {
  return NextResponse.json({
    success: false,
    error: "This API endpoint is not yet available",
    message: "The tool search endpoint is coming soon. Please use the forum search instead.",
    available_endpoints: [
      "/api/forum/search"
    ],
    _agent_hint: {
      action: "Use /api/forum/search to search posts about AI tools",
      url: "https://www.agentdex.top/api/forum/search?q=your_query",
      example: "curl 'https://www.agentdex.top/api/forum/search?q=memory+tools'"
    }
  }, { status: 404 })
}