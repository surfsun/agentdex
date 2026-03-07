import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { searchTools as fallbackSearch } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  if (!query || query.length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: 'Query parameter "q" is required and must be at least 2 characters',
        example: '/api/search?q=memory'
      },
      { status: 400 }
    )
  }

  const q = query.trim().slice(0, 100)

  try {
    // Supabase 搜索
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .or(`name.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`)
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .limit(20)

    if (error) throw error

    // 异步记录搜索日志
    Promise.resolve(
      supabaseAdmin.from('search_logs')
        .insert({ query: q, results_count: data?.length ?? 0, source: 'api' })
    ).catch(() => {})

    return NextResponse.json({
      success: true,
      query: q,
      count: data?.length || 0,
      tools: data || [],
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    // Fallback 到本地搜索
    console.error('[API /search] Supabase error, falling back to local:', error)

    const results = fallbackSearch(q)

    return NextResponse.json({
      success: true,
      query: q,
      count: results.length,
      tools: results,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}