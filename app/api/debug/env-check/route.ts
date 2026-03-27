import { NextResponse } from 'next/server'

/**
 * GET /api/debug/env-check
 * 诊断 Supabase 环境变量配置状态
 * 仅检查变量是否存在，不暴露实际值
 */
export async function GET() {
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