import { NextResponse } from 'next/server'
import { tools } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')

  // 统计所有标签
  const tagMap = new Map<string, number>()
  tools.forEach(t => {
    t.tags.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
    })
  })

  // 按使用次数排序
  const allTags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // 如果指定了标签，返回该标签的工具
  if (tag) {
    const tagTools = tools.filter(t => t.tags.includes(tag))
    
    return NextResponse.json({
      success: true,
      tag,
      count: tagTools.length,
      tools: tagTools.map(t => ({
        name: t.name,
        slug: t.slug,
        category: t.category,
        tagline: t.tagline,
        pricing: t.pricing,
        agent_friendly: t.agent_friendly,
      })),
    })
  }

  // 返回所有标签统计
  return NextResponse.json({
    success: true,
    total_tags: allTags.length,
    tags: allTags,
    popular_tags: allTags.slice(0, 10),
    usage: 'GET /api/tags?tag=api-first to get tools by tag',
  })
}