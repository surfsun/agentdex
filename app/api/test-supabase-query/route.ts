import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Direct test API - at a different path to avoid [id] route conflict
 * GET /api/test-supabase-query
 */
export async function GET() {
  try {
    // Direct query - no filters
    const result = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform')
      .limit(5)

    // Manual find
    const xiaoqiao = result.data?.find(a => a.name.toLowerCase() === 'xiaoqiao')

    return NextResponse.json({
      rawQuerySuccess: !result.error,
      rawQueryError: result.error?.message || null,
      rawQueryCount: result.data?.length || 0,
      rawQueryData: result.data || [],
      manualFind: xiaoqiao ? { id: xiaoqiao.id, name: xiaoqiao.name } : 'NOT_FOUND'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}