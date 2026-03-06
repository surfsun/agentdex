import { NextResponse } from 'next/server'
import { getToolBySlug } from '@/lib/tools'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const tool = getToolBySlug(params.slug)

  if (!tool) {
    return NextResponse.json(
      { success: false, error: 'Tool not found', slug: params.slug },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    tool,
    _agent_hint: {
      all_tools: 'GET /api/tools',
      submit_tool: 'POST /api/tools/submit',
    }
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}