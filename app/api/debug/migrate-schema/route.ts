import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/debug/migrate-schema
 * 手动执行数据库 schema 修复（添加缺失的列）
 * 仅用于修复线上数据库 migration 未同步的问题
 */
export async function POST() {
  const results: { step: string; success: boolean; error?: string }[] = []
  
  // 1. 添加 post_type 列
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      query: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT \'normal\''
    })
    
    if (error) {
      // RPC 可能不存在，尝试直接查询列是否存在
      const { data: columns } = await supabaseAdmin
        .from('posts')
        .select('post_type')
        .limit(1)
      
      if (columns) {
        results.push({ step: 'add_post_type', success: true })
      } else {
        results.push({ step: 'add_post_type', success: false, error: error.message })
      }
    } else {
      results.push({ step: 'add_post_type', success: true })
    }
  } catch (e) {
    results.push({ 
      step: 'add_post_type', 
      success: false, 
      error: e instanceof Error ? e.message : 'Unknown error' 
    })
  }
  
  // 2. 添加 prompt_bundle 列
  try {
    // 尝试直接插入带 prompt_bundle 的记录来测试
    const testInsert = {
      author_id: 'ce214477-ad5a-49e4-8320-43eafe5d907a',
      title: '[SCHEMA TEST]',
      content: 'test',
      tags: [],
      post_type: 'normal'
    }
    
    const { error: insertError } = await supabaseAdmin
      .from('posts')
      .insert(testInsert)
      .select('id')
      .single()
    
    if (insertError) {
      results.push({ 
        step: 'test_insert_without_extras', 
        success: false, 
        error: insertError.message 
      })
    } else {
      results.push({ step: 'test_insert_without_extras', success: true })
    }
  } catch (e) {
    results.push({ 
      step: 'test_insert', 
      success: false, 
      error: e instanceof Error ? e.message : 'Unknown error' 
    })
  }
  
  return NextResponse.json({
    success: results.every(r => r.success),
    timestamp: new Date().toISOString(),
    results,
    note: 'This API is for debugging purposes. The proper fix is to run migrations on the production database.'
  })
}

/**
 * GET /api/debug/migrate-schema
 * 检查当前 schema 状态
 */
export async function GET() {
  // 检查哪些列存在
  const columnTests = {
    post_type: false,
    prompt_bundle: false,
    run_snapshot: false,
    forked_from: false,
    fork_count: false,
    pinned: false,
    is_seed: false,
    search_vector: false
  }
  
  // 尝试查询每个列
  for (const col of Object.keys(columnTests) as (keyof typeof columnTests)[]) {
    try {
      const { error } = await supabaseAdmin
        .from('posts')
        .select(col)
        .limit(0)
      
      columnTests[col] = !error
    } catch {
      columnTests[col] = false
    }
  }
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    columns_status: columnTests,
    missing_columns: Object.entries(columnTests)
      .filter(([_, exists]) => !exists)
      .map(([col]) => col)
  })
}