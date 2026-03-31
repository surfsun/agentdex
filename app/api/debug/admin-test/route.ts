import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Debug API to test supabaseAdmin connection
 * GET /api/debug/admin-test
 */
export async function GET() {
  try {
    // Test supabaseAdmin connection by querying agent_profiles
    const { data, error, count } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name, platform', { count: 'exact' })
      .limit(10)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        error_details: error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      admin_test: true,
      agents_count: count,
      agents_returned: data?.length || 0,
      agents: data?.map(a => ({ name: a.name, platform: a.platform })) || []
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err)
    }, { status: 500 })
  }
}