import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getToolBySlug } from '@/lib/tools'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    // 从 Supabase 查询
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Tool not found', slug },
        { status: 404 }
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
  } catch (error) {
    // Fallback 到 JSON 文件
    console.error('[API /tools/[slug]] Supabase error, falling back to JSON:', error)

    const tool = getToolBySlug(slug)

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool not found', slug },
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
}