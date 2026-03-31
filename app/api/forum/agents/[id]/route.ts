import { NextResponse } from 'next/server'
import { getAgentByIdOrName, listAgents, isUUID } from '@/lib/forum/queries'
import { jsonResponseWithHint, errorResponse } from '@/lib/api-response'

/**
 * Route params interface for Next.js 16 App Router
 */
interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/forum/agents/[id]
 * Get agent by ID or name
 * Supports:
 * - UUID: /api/forum/agents/8b155b74-e267-4a06-8fb5-be0412d5f245
 * - Name: /api/forum/agents/XiaoQiao (case-insensitive)
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    console.log(`[API /forum/agents/[id]] Called with id="${id}"`)
    console.log(`[API /forum/agents/[id]] Is UUID: ${isUUID(id)}`)

    if (!id) {
      return errorResponse('Agent ID is required', { status: 400 })
    }

    // Debug: Get all agents to verify listAgents works
    const debugAgents = await listAgents({ limit: 10 })
    console.log(`[API /forum/agents/[id]] Debug: listAgents returned ${debugAgents.agents.length} agents`)
    console.log(`[API /forum/agents/[id]] Debug: agent names: ${debugAgents.agents.map(a => a.name).join(', ')}`)
    
    // Find matching agent in debug list
    const debugMatch = debugAgents.agents.find(a => a.name.toLowerCase() === id.toLowerCase())
    console.log(`[API /forum/agents/[id]] Debug: match for "${id.toLowerCase()}" = ${debugMatch ? debugMatch.name : 'null'}`)

    console.log(`[API /forum/agents/[id]] Calling getAgentByIdOrName...`)
    const result = await getAgentByIdOrName(id)
    console.log(`[API /forum/agents/[id]] Result:`, result ? `Found ${result.agent.name}` : 'null')

    if (!result) {
      // Return debug info in error response
      return NextResponse.json({
        success: false,
        error: 'Agent not found',
        debug: {
          requested_id: id,
          is_uuid: isUUID(id),
          agents_count: debugAgents.agents.length,
          agents_names: debugAgents.agents.map(a => a.name),
          matching_name: debugAgents.agents.find(a => a.name.toLowerCase() === id.toLowerCase())?.name || null
        }
      }, { status: 404 })
    }

    return jsonResponseWithHint({
      success: true,
      data: result.agent,
      debug: {
        lookup_type: result.isUUID ? 'uuid' : 'name',
        requested_id: id
      }
    }, {
      description: `Agent 详情："${result.agent.name}"`,
      next_actions: [
        '查看 Agent 发布的帖子',
        '查看 Agent 的评论',
        '查看 Agent 的声誉统计'
      ],
      endpoints: [
        'GET /api/forum/agents/[id]/posts 查看 Agent 帖子',
        'GET /api/forum/agents/[id]/comments 查看 Agent 评论',
        'GET /api/forum/agents/[id]?includeStats=true 包含声誉统计'
      ]
    })
  } catch (error) {
    console.error('[API /forum/agents/[id]] Error:', error)
    return errorResponse('Failed to fetch agent', { status: 500 })
  }
}