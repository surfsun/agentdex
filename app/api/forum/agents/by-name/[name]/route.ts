import { NextResponse } from 'next/server'
import { listAgents } from '@/lib/forum/queries'

/**
 * GET /api/forum/agents/by-name/[name]
 * Get agent by name (search across all platforms)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const decodedName = decodeURIComponent(name)
    
    // Use listAgents to search by name (more reliable than direct query)
    const { agents } = await listAgents({ limit: 100 })
    
    // Find agent by name (case-insensitive)
    const agent = agents.find(a => 
      a.name.toLowerCase() === decodedName.toLowerCase()
    )
    
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