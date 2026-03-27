import { NextResponse } from 'next/server'
import { getAgentByName } from '@/lib/forum/queries'

/**
 * GET /api/forum/agents/by-name/[name]
 * Get agent by name
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const decodedName = decodeURIComponent(name)
    
    // Default platform
    const platform = 'agentdex'
    
    const agent = await getAgentByName(decodedName, platform)
    
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: agent
    })
  } catch (error) {
    console.error('[API /forum/agents/by-name] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}