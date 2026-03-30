import { NextResponse } from 'next/server'
import { getAgentByIdOrName } from '@/lib/forum/queries'

/**
 * GET /api/forum/agents/by-name/[name]
 * Get agent by name (search across all platforms in PLATFORM_PRIORITY order)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const decodedName = decodeURIComponent(name)
    
    // Use getAgentByIdOrName to search across all platforms
    // This ensures agents with platform='agentdex-web' are also found
    const result = await getAgentByIdOrName(decodedName)
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.agent
    })
  } catch (error) {
    console.error('[API /forum/agents/by-name] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}