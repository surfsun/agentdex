import { NextResponse } from 'next/server'
import { tools as fallbackTools, Tool } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slugs = searchParams.get('tools') || searchParams.get('slugs')

  if (!slugs) {
    return NextResponse.json({
      success: false,
      error: 'Missing required parameter: tools (comma-separated slugs)',
      example: '/api/compare?tools=mem0,zep,letta',
      _agent_hint: {
        usage: 'GET /api/compare?tools=slug1,slug2,slug3',
        max_tools: 4,
        fields: ['github_stars', 'pricing', 'integration_complexity', 'agent_friendly', 'open_source', 'api_available', 'best_for']
      }
    }, { status: 400 })
  }

  const slugList = slugs.split(',').map(s => s.trim()).filter(s => s)
  
  if (slugList.length < 2) {
    return NextResponse.json({
      success: false,
      error: 'At least 2 tools required for comparison',
      provided: slugList.length
    }, { status: 400 })
  }

  if (slugList.length > 4) {
    return NextResponse.json({
      success: false,
      error: 'Maximum 4 tools can be compared at once',
      provided: slugList.length
    }, { status: 400 })
  }

  // Find tools by slug
  const foundTools = fallbackTools.filter(t => slugList.includes(t.slug))
  const foundSlugs = foundTools.map(t => t.slug)
  const missingSlugs = slugList.filter(s => !foundSlugs.includes(s))

  if (missingSlugs.length > 0) {
    return NextResponse.json({
      success: false,
      error: 'Some tools not found',
      missing: missingSlugs,
      available_tools: 'GET /api/tools for full list'
    }, { status: 404 })
  }

  // Build comparison matrix
  const comparisonFields = [
    { key: 'github_stars', label: 'GitHub Stars', type: 'number', higher_better: true },
    { key: 'pricing', label: 'Pricing', type: 'enum', values: ['free', 'freemium', 'paid'] },
    { key: 'integration_complexity', label: 'Integration Complexity', type: 'enum', values: ['low', 'medium', 'high'], lower_better: true },
    { key: 'agent_friendly', label: 'Agent Friendly', type: 'boolean', true_better: true },
    { key: 'open_source', label: 'Open Source', type: 'boolean', true_better: true },
    { key: 'api_available', label: 'API Available', type: 'boolean', true_better: true },
    { key: 'verified', label: 'Verified', type: 'boolean', true_better: true },
  ]

  // Extract comparison data for each tool
  const comparisonData = foundTools.map(tool => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    featured: tool.featured,
    values: {
      github_stars: tool.github_stars || null,
      pricing: tool.pricing,
      integration_complexity: tool.integration_complexity || null,
      agent_friendly: tool.agent_friendly,
      open_source: tool.open_source,
      api_available: tool.api_available,
      verified: tool.verified,
    },
    best_for: tool.best_for || [],
    best_for_zh: tool.best_for_zh || [],
    tags: tool.tags,
  }))

  // Calculate winners for each field
  const winners: Record<string, string[]> = {}
  
  // GitHub Stars - higher is better
  const maxStars = Math.max(...foundTools.map(t => t.github_stars || 0))
  winners.github_stars = foundTools.filter(t => t.github_stars === maxStars && maxStars > 0).map(t => t.slug)
  
  // Integration Complexity - lower is better (low=1, medium=2, high=3)
  const complexityOrder: Record<string, number> = { low: 1, medium: 2, high: 3 }
  const complexityValues = foundTools.map(t => complexityOrder[t.integration_complexity || 'high'])
  const minComplexity = Math.min(...complexityValues)
  winners.integration_complexity = foundTools.filter(t => complexityOrder[t.integration_complexity || 'high'] === minComplexity).map(t => t.slug)
  
  // Agent Friendly - all true ones are winners
  winners.agent_friendly = foundTools.filter(t => t.agent_friendly).map(t => t.slug)
  
  // Open Source - all true ones are winners
  winners.open_source = foundTools.filter(t => t.open_source).map(t => t.slug)
  
  // API Available - all true ones are winners
  winners.api_available = foundTools.filter(t => t.api_available).map(t => t.slug)

  // Build summary
  const summary = {
    most_stars: winners.github_stars[0] || null,
    easiest_setup: winners.integration_complexity[0] || null,
    agent_friendly: winners.agent_friendly,
    open_source: winners.open_source,
  }

  return NextResponse.json({
    success: true,
    tools: comparisonData,
    comparison_fields: comparisonFields,
    winners,
    summary,
    _agent_hint: {
      usage: 'Use this data to compare tools side-by-side',
      fields: 'Each tool has values for each comparison field',
      winners: 'slugs of tools that "win" each category (best value)',
      summary: 'Quick overview of top performers',
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    }
  })
}