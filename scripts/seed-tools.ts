/**
 * 工具数据导入脚本
 * 将 data/tools.json 导入 Supabase tools 表
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import toolsData from '../data/tools.json'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error('❌ 缺少环境变量')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', url || '(未设置)')
  console.error('  SUPABASE_SECRET_KEY:', secretKey ? '(已设置)' : '(未设置)')
  process.exit(1)
}

const supabaseAdmin = createClient(url, secretKey, {
  auth: { persistSession: false }
})

async function seed() {
  console.log(`准备导入 ${toolsData.length} 条工具数据...`)

  // 添加 status 字段（默认 active）
  const tools = toolsData.map(tool => ({
    ...tool,
    status: 'active',
    view_count: 0,
    updated_at: new Date().toISOString()
  }))

  const { data, error } = await supabaseAdmin
    .from('tools')
    .upsert(tools, { onConflict: 'slug' })

  if (error) {
    console.error('导入失败:', error)
    process.exit(1)
  }

  console.log(`✅ 成功导入 ${tools.length} 条工具数据`)

  // 验证
  const { count } = await supabaseAdmin
    .from('tools')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 tools 表当前记录数: ${count}`)
}

seed().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})