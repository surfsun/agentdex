import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // 从 Supabase 查询
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Tool not found', slug },
        { status: 404 }
      )
    }
    console.error('[API /tools/[slug]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database error', details: error.message },
      { status: 500 }
    )
  }

  // 异步记录访问（fire and forget）
  Promise.resolve(
    supabaseAdmin.from('tool_views')
      .insert({ tool_slug: slug, source: 'api' })
  ).catch(() => {})

  // 异步更新 view_count
  Promise.resolve(
    supabaseAdmin.from('tools')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('slug', slug)
  ).catch(() => {})

  return NextResponse.json({
    success: true,
    tool: data,
    _agent_hint: {
      all_tools: 'GET /api/tools',
      submit_tool: 'POST /api/tools/submit',
    }
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}