import { NextResponse } from 'next/server'
import { tools, categories } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const task = searchParams.get('task')?.toLowerCase() || ''
  const category = searchParams.get('category')

  // 基于任务关键词推荐工具
  const taskKeywords: Record<string, string[]> = {
    memory: ['remember', 'memory', 'store', 'persist', 'context', 'recall'],
    scraping: ['scrape', 'crawl', 'extract', 'web', 'html', 'parse'],
    email: ['email', 'mail', 'send', 'inbox'],
    code: ['code', 'execute', 'run', 'python', 'javascript', 'sandbox'],
    integration: ['integrate', 'connect', 'api', 'tool', 'automation'],
    framework: ['build', 'create', 'agent', 'framework', 'develop'],
    social: ['social', 'post', 'community', 'network'],
    observability: ['debug', 'trace', 'monitor', 'log', 'observe'],
    security: ['security', 'validate', 'guard', 'protect', 'safety'],
    payment: ['pay', 'payment', 'transaction', 'money', 'usdc'],
  }

  // 如果指定了任务，基于任务推荐
  if (task) {
    let matchedCategory = category
    
    // 尝试匹配任务到分类
    if (!matchedCategory) {
      for (const [cat, keywords] of Object.entries(taskKeywords)) {
        if (keywords.some(kw => task.includes(kw))) {
          matchedCategory = cat
          break
        }
      }
    }

    if (matchedCategory) {
      const categoryTools = tools
        .filter(t => t.category === matchedCategory && t.agent_friendly)
        .map(t => {
          let score = 0
          if (t.agent_friendly) score += 3
          if (t.api_available) score += 2
          if (t.open_source) score += 1
          if (t.featured) score += 1
          if (t.pricing === 'free') score += 1
          return { ...t, score }
        })
        .sort((a, b) => b.score - a.score)

      return NextResponse.json({
        success: true,
        task,
        detected_category: matchedCategory,
        recommendations: categoryTools.slice(0, 5),
        reasoning: categoryTools.length > 0 
          ? `Based on your task "${task}", I recommend tools from the "${matchedCategory}" category. These are sorted by agent-friendliness, API availability, and open-source status.`
          : `No agent-friendly tools found for category "${matchedCategory}"`,
      })
    }

    // 如果无法匹配分类，返回所有agent-friendly工具
    const allAgentFriendly = tools
      .filter(t => t.agent_friendly)
      .map(t => {
        // 检查任务是否匹配工具的标签、名称、描述
        const matchesTask = 
          t.tags.some(tag => task.includes(tag)) ||
          t.name.toLowerCase().includes(task) ||
          t.tagline.toLowerCase().includes(task)
        
        let score = matchesTask ? 5 : 0
        if (t.agent_friendly) score += 3
        if (t.api_available) score += 2
        if (t.featured) score += 1
        return { ...t, score }
      })
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({
      success: true,
      task,
      recommendations: allAgentFriendly.slice(0, 5),
      reasoning: `Showing top agent-friendly tools. Tools matching your task keywords are ranked higher.`,
    })
  }

  // 返回通用推荐（每个分类的最佳工具）
  const recommendations = categories
    .filter(c => c.id !== 'all')
    .map(cat => {
      const catTools = tools.filter(t => t.category === cat.id && t.agent_friendly)
      if (catTools.length === 0) return null

      const top = catTools.reduce((best, t) => {
        const score = (t.featured ? 1 : 0) + (t.open_source ? 1 : 0) + (t.api_available ? 1 : 0)
        const bestScore = (best.featured ? 1 : 0) + (best.open_source ? 1 : 0) + (best.api_available ? 1 : 0)
        return score > bestScore ? t : best
      })

      return {
        category: cat.id,
        category_name: cat.label,
        recommended: {
          name: top.name,
          slug: top.slug,
          tagline: top.tagline,
          pricing: top.pricing,
        },
        total_in_category: catTools.length,
      }
    })
    .filter(Boolean)

  return NextResponse.json({
    success: true,
    message: 'Get personalized tool recommendations based on your task',
    usage: 'GET /api/recommend?task=I need to scrape websites',
    quick_picks: recommendations,
  })
}