import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/identity/auth'

/**
 * GET /api/debug/env-check
 * 诊断 Supabase 环境变量配置状态
 * 仅检查变量是否存在，不暴露实际值
 * 
 * Security: Requires Bearer token authentication
 * Headers: Authorization: Bearer <token> (ak_xxx 或 at_xxx)
 */
export async function GET(request: NextRequest) {
  // 认证检查 - 只有有效认证的用户才能访问 debug API
  const auth = await authenticateRequest(request)
  
  if (!auth.success) {
    return NextResponse.json({
      success: false,
      error: '认证失败，Debug API 需要有效认证',
      code: auth.code || 'AUTH_REQUIRED'
    }, { status: 401 })
  }

  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
  }
  
  // 检查是否有有效的 anon key
  const hasAnonKey = envStatus.NEXT_PUBLIC_SUPABASE_ANON_KEY || envStatus.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  
  // 检查是否有有效的 service role key
  const hasServiceRoleKey = envStatus.SUPABASE_SERVICE_ROLE_KEY || envStatus.SUPABASE_SECRET_KEY
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    authenticated_agent: auth.agent_id,
    environment: process.env.NODE_ENV || 'unknown',
    env_status: envStatus,
    summary: {
      has_url: envStatus.NEXT_PUBLIC_SUPABASE_URL,
      has_anon_key: hasAnonKey,
      has_service_role_key: hasServiceRoleKey,
      ready_for_reads: envStatus.NEXT_PUBLIC_SUPABASE_URL && hasAnonKey,
      ready_for_writes: envStatus.NEXT_PUBLIC_SUPABASE_URL && hasServiceRoleKey,
    }
  })
}