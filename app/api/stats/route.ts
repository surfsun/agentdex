import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 并行获取所有统计数据
    const [
      toolsResult,
      agentFriendlyResult,
      categoriesResult
    ] = await Promise.all([
      // 总工具数
      supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // Agent-Friendly 工具数
      supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('agent_friendly', true),
      
      // 分类数（从工具中统计不同的 category）
      supabase
        .from('tools')
        .select('category')
        .eq('status', 'active')
    ])

    // 计算独立分类数
    const uniqueCategories = new Set(
      categoriesResult.data?.map(t => t.category).filter(Boolean) || []
    )

    // Skills 数量（可以从 skills 表获取，目前使用估算）
    // TODO: 当 skills 表有数据时，改为从数据库查询
    const skillsCount = 10

    const stats = {
      tools: toolsResult.count || 0,
      agentFriendly: agentFriendlyResult.count || 0,
      categories: uniqueCategories.size || 0,
      skills: skillsCount,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      stats,
      _agent_hint: {
        description: 'Site-wide statistics for AgentDex',
        tools_endpoint: 'GET /api/tools for detailed tool list',
        cache: 'Cached for 5 minutes'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('[API /stats] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stats',
        stats: { tools: 0, agentFriendly: 0, categories: 0, skills: 0 }
      },
      { status: 500 }
    )
  }
}