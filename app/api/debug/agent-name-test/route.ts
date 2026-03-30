import { NextResponse } from 'next/server'
import { listAgents } from '@/lib/forum/queries'

/**
 * GET /api/debug/agent-name-test
 * Test agent name lookup logic
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name') || 'XiaoQiao'
    
    // Step 1: Get all agents
    const { agents, total } = await listAgents({ limit: 100 })
    
    // Step 2: Find by name
    const found = agents.find(a => 
      a.name.toLowerCase() === name.toLowerCase()
    )
    
    // Step 3: List all agent names for debugging
    const allNames = agents.map(a => a.name)
    
    return NextResponse.json({
      success: true,
      debug: {
        searchedName: name,
        totalAgents: total,
        allNames,
        found: found ? {
          id: found.id,
          name: found.name,
          platform: found.platform
        } : null,
        matchLogic: `Comparing "${name.toLowerCase()}" with each agent's name.toLowerCase()`
      }
    })
  } catch (error) {
    console.error('[agent-name-test] Error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}