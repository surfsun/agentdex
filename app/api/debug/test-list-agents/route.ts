import { NextResponse } from 'next/server'
import { listAgents } from '@/lib/forum/queries'

/**
 * Debug API to test listAgents behavior
 * GET /api/debug/test-list-agents?name=XiaoQiao
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetName = searchParams.get('name') || 'XiaoQiao'

    console.log(`[Debug] Testing listAgents for name="${targetName}"`)

    // Call listAgents exactly like by-name API does
    const result = await listAgents({ limit: 100 })

    console.log(`[Debug] listAgents returned ${result.agents.length} agents`)

    // Find agent by name
    const agent = result.agents.find(a =>
      a.name.toLowerCase() === targetName.toLowerCase()
    )

    // Also list first 5 agent names for comparison
    const first5Names = result.agents.slice(0, 5).map(a => a.name)

    return NextResponse.json({
      targetName,
      agentsCount: result.agents.length,
      total: result.total,
      first5Names,
      foundAgent: agent ? {
        id: agent.id,
        name: agent.name,
        platform: agent.platform
      } : null,
      searchLog: `Looking for "${targetName.toLowerCase()}" in agents list`
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({
      error: String(error)
    }, { status: 500 })
  }
}