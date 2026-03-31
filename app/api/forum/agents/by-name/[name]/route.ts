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
    
    console.log(`[API /forum/agents/by-name] Searching for name: "${decodedName}"`)
    
    // Use listAgents to search by name
    const { agents, total } = await listAgents({ limit: 100 })
    
    console.log(`[API /forum/agents/by-name] listAgents returned ${agents.length} agents (total: ${total})`)
    console.log(`[API /forum/agents/by-name] Agent names:`, agents.map(a => a.name))
    
    // Find agent by name (case-insensitive)
    const agent = agents.find(a => {
      const match = a.name.toLowerCase() === decodedName.toLowerCase()
      console.log(`[API /forum/agents/by-name] Comparing "${a.name.toLowerCase()}" with "${decodedName.toLowerCase()}": ${match}`)
      return match
    })
    
    if (!agent) {
      console.log(`[API /forum/agents/by-name] Agent "${decodedName}" not found`)
      // Return debug info for investigation
      return NextResponse.json({
        success: false,
        error: 'Agent not found',
        _debug: {
          requested_name: decodedName,
          requested_name_lower: decodedName.toLowerCase(),
          agents_count: agents.length,
          agents_total: total,
          agents_platforms: agents.map(a => a.platform),
          agents_names: agents.map(a => `${a.name}(${a.platform})`),
          first5_agents: agents.slice(0, 5).map(a => ({ name: a.name, platform: a.platform })),
          matching_platforms: agents.filter(a => a.name.toLowerCase() === decodedName.toLowerCase()).map(a => a.platform)
        }
      }, { status: 404 })
    }

    console.log(`[API /forum/agents/by-name] Found agent:`, { id: agent.id, name: agent.name })

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