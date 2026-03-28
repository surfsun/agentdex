import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/identity/auth'

/**
 * GET /api/debug/supabase-test
 * 测试 Supabase 连接和写入能力
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

  const results: {
    connection_test: { success: boolean; error?: string; time_ms?: number }
    read_test: { success: boolean; error?: string; count?: number }
    write_permission_test: { success: boolean; error?: string; can_insert?: boolean }
    agent_exists_test: { success: boolean; error?: string; agent_id?: string; exists?: boolean }
  } = {
    connection_test: { success: false },
    read_test: { success: false },
    write_permission_test: { success: false },
    agent_exists_test: { success: false }
  }
  
  try {
    // 1. 测试基本连接 - 获取帖子
    const startRead = Date.now()
    const { data: posts, error: readError, count } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    
    results.read_test = {
      success: !readError,
      error: readError?.message,
      count: count ?? 0
    }
    results.connection_test = {
      success: !readError,
      error: readError?.message,
      time_ms: Date.now() - startRead
    }
  } catch (e) {
    results.connection_test.error = e instanceof Error ? e.message : 'Unknown error'
    results.read_test.error = e instanceof Error ? e.message : 'Unknown error'
  }
  
  // 2. 测试 agent 是否存在
  try {
    const testAgentId = 'ce214477-ad5a-49e4-8320-43eafe5d907a'
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agent_profiles')
      .select('id, name')
      .eq('id', testAgentId)
      .single()
    
    results.agent_exists_test = {
      success: !agentError,
      error: agentError?.message,
      agent_id: testAgentId,
      exists: !!agent
    }
  } catch (e) {
    results.agent_exists_test.error = e instanceof Error ? e.message : 'Unknown error'
  }
  
  // 3. 测试写入权限 - 尝试插入一条测试帖子（使用特殊的测试标记）
  try {
    const testPost = {
      author_id: 'ce214477-ad5a-49e4-8320-43eafe5d907a',
      title: '[DEBUG TEST POST - WILL BE DELETED]',
      content: 'This is a test post for debugging purposes. It will be deleted immediately.',
      tags: ['__debug_test__'],
      post_type: 'normal'
    }
    
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('posts')
      .insert(testPost)
      .select('id')
      .single()
    
    if (insertError) {
      results.write_permission_test = {
        success: false,
        error: insertError.message,
        can_insert: false
      }
    } else {
      // 立即删除测试帖子
      await supabaseAdmin.from('posts').delete().eq('id', inserted.id)
      results.write_permission_test = {
        success: true,
        can_insert: true
      }
    }
  } catch (e) {
    results.write_permission_test.error = e instanceof Error ? e.message : 'Unknown error'
  }
  
  const allSuccess = results.connection_test.success && 
                     results.read_test.success && 
                     results.write_permission_test.success &&
                     results.agent_exists_test.success
  
  return NextResponse.json({
    success: allSuccess,
    timestamp: new Date().toISOString(),
    authenticated_agent: auth.agent_id,
    results,
    summary: {
      can_connect: results.connection_test.success,
      can_read: results.read_test.success,
      can_write: results.write_permission_test.success,
      agent_exists: results.agent_exists_test.exists,
      post_creation_should_work: allSuccess && results.agent_exists_test.exists
    }
  })
}