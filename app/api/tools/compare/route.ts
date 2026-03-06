import { NextResponse } from 'next/server'
import { tools, categories } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const slugs = searchParams.get('slugs')?.split(',').filter(Boolean)

  // 如果指定了具体工具，对比这些工具
  if (slugs && slugs.length >= 2) {
    const selectedTools = tools.filter(t => slugs.includes(t.slug))
    
    if (selectedTools.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tools found with the given slugs' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      count: selectedTools.length,
      comparison: selectedTools.map(t => ({
        name: t.name,
        slug: t.slug,
        category: t.category,
        pricing: t.pricing,
        agent_friendly: t.agent_friendly,
        api_available: t.api_available,
        open_source: t.open_source,
        tags: t.tags,
        tagline: t.tagline,
        website: t.website,
        github: t.github,
      })),
      matrix: buildComparisonMatrix(selectedTools),
    })
  }

  // 如果指定了分类，对比该分类下的所有工具
  if (category) {
    const categoryTools = tools.filter(t => t.category === category)
    
    if (categoryTools.length === 0) {
      return NextResponse.json(
        { success: false, error: `No tools found in category: ${category}` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      category,
      category_name: categories.find(c => c.id === category)?.label || category,
      count: categoryTools.length,
      comparison: categoryTools.map(t => ({
        name: t.name,
        slug: t.slug,
        pricing: t.pricing,
        agent_friendly: t.agent_friendly,
        api_available: t.api_available,
        open_source: t.open_source,
        tags: t.tags,
        tagline: t.tagline,
      })),
      matrix: buildComparisonMatrix(categoryTools),
      recommendation: getRecommendation(categoryTools),
    })
  }

  // 返回所有分类的工具数量
  const categoryStats = categories
    .filter(c => c.id !== 'all')
    .map(c => ({
      id: c.id,
      label: c.label,
      tool_count: tools.filter(t => t.category === c.id).length,
      agent_friendly_count: tools.filter(t => t.category === c.id && t.agent_friendly).length,
    }))
    .filter(c => c.tool_count > 0)

  return NextResponse.json({
    success: true,
    message: 'Compare tools by category or by specific slugs',
    usage: {
      by_category: 'GET /api/tools/compare?category=memory',
      by_slugs: 'GET /api/tools/compare?slugs=mem0,zep,letta',
    },
    categories: categoryStats,
  })
}

function buildComparisonMatrix(toolsList: typeof tools) {
  const features = [
    { key: 'agent_friendly', label: 'Agent-friendly', type: 'boolean' },
    { key: 'api_available', label: 'API Available', type: 'boolean' },
    { key: 'open_source', label: 'Open Source', type: 'boolean' },
    { key: 'pricing', label: 'Pricing', type: 'string' },
  ]

  return {
    features,
    tools: toolsList.map(t => ({
      name: t.name,
      slug: t.slug,
      values: features.map(f => ({
        feature: f.label,
        value: t[f.key as keyof typeof t],
      })),
    })),
  }
}

function getRecommendation(toolsList: typeof tools) {
  // 如果只有一个工具，直接推荐
  if (toolsList.length === 1) {
    return {
      top_pick: toolsList[0].name,
      reason: 'Only tool in this category',
    }
  }

  // 按评分排序
  const scored = toolsList.map(t => {
    let score = 0
    if (t.agent_friendly) score += 3
    if (t.api_available) score += 2
    if (t.open_source) score += 2
    if (t.featured) score += 1
    if (t.pricing === 'free') score += 2
    if (t.pricing === 'freemium') score += 1
    return { tool: t, score }
  }).sort((a, b) => b.score - a.score)

  const top = scored[0]
  
  const reasons = []
  if (top.tool.agent_friendly) reasons.push('agent-friendly')
  if (top.tool.api_available) reasons.push('has API')
  if (top.tool.open_source) reasons.push('open source')
  if (top.tool.pricing === 'free') reasons.push('free')
  if (top.tool.featured) reasons.push('featured')

  return {
    top_pick: top.tool.name,
    slug: top.tool.slug,
    score: top.score,
    reason: reasons.length > 0 ? `Best overall (${reasons.join(', ')})` : 'Recommended',
    alternatives: scored.slice(1, 3).map(s => ({
      name: s.tool.name,
      slug: s.tool.slug,
      score: s.score,
    })),
  }
}