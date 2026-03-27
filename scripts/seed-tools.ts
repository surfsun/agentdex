/**
 * 工具数据导入脚本
 * 将 data/tools.json 导入 Supabase tools 表
 * 
 * Issue: #69 - 确保正确导入 integration_level 字段
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

// 默认 integration_level 映射（用于没有设置的工具）
const defaultIntegrationLevel: Record<string, { level: 'quick_start' | 'standard' | 'advanced', minutes: number }> = {
  // Memory tools
  'mem0': { level: 'quick_start', minutes: 5 },
  'zep': { level: 'quick_start', minutes: 5 },
  'letta': { level: 'quick_start', minutes: 5 },
  // Web tools
  'jina-reader': { level: 'quick_start', minutes: 2 },
  'x402': { level: 'quick_start', minutes: 5 },
  'browserbase': { level: 'standard', minutes: 15 },
  'firecrawl': { level: 'standard', minutes: 15 },
  'apify': { level: 'standard', minutes: 20 },
  'stagehand': { level: 'standard', minutes: 20 },
  // Execution tools
  'e2b': { level: 'quick_start', minutes: 5 },
  'daytona': { level: 'standard', minutes: 30 },
  'modal': { level: 'standard', minutes: 30 },
  // Communication tools
  'agentmail': { level: 'quick_start', minutes: 5 },
  'composio': { level: 'standard', minutes: 15 },
  'sendgrid': { level: 'standard', minutes: 15 },
  // Framework tools
  'langchain': { level: 'standard', minutes: 15 },
  'crewai': { level: 'standard', minutes: 20 },
  'autogen': { level: 'standard', minutes: 20 },
  // Observability tools
  'langfuse': { level: 'quick_start', minutes: 5 },
  'arize-phoenix': { level: 'quick_start', minutes: 5 },
  // Payment tools
  'stripe': { level: 'standard', minutes: 30 },
  'braintree': { level: 'standard', minutes: 30 },
  // Security tools
  'polygon': { level: 'standard', minutes: 15 },
  'pangea': { level: 'standard', minutes: 15 },
  // Social tools
  'moltbook': { level: 'quick_start', minutes: 1 },
}

async function seed() {
  console.log(`准备导入 ${toolsData.length} 条工具数据...`)

  // 处理每个工具，确保 integration_level 有值
  const tools = toolsData.map(tool => {
    // 如果已经有 integration_level，保持不变
    if (tool.integration_level) {
      return {
        ...tool,
        status: 'active',
        view_count: 0,
        updated_at: new Date().toISOString()
      }
    }

    // 否则从映射表获取或根据 agent_friendly 推断
    const mapped = defaultIntegrationLevel[tool.slug]
    const integrationLevel = mapped?.level || (tool.agent_friendly ? 'quick_start' : 'standard')
    const integrationMinutes = mapped?.minutes || (tool.agent_friendly ? 10 : 30)

    return {
      ...tool,
      integration_level: integrationLevel,
      integration_minutes: integrationMinutes,
      status: 'active',
      view_count: 0,
      updated_at: new Date().toISOString()
    }
  })

  // 统计
  const stats = {
    total: tools.length,
    quick_start: tools.filter(t => t.integration_level === 'quick_start').length,
    standard: tools.filter(t => t.integration_level === 'standard').length,
    advanced: tools.filter(t => t.integration_level === 'advanced').length,
    none: tools.filter(t => !t.integration_level).length,
  }

  console.log('\n导入统计:')
  console.log(`  总计: ${stats.total}`)
  console.log(`  quick_start: ${stats.quick_start}`)
  console.log(`  standard: ${stats.standard}`)
  console.log(`  advanced: ${stats.advanced}`)
  console.log(`  无 integration_level: ${stats.none}`)

  const { error } = await supabaseAdmin
    .from('tools')
    .upsert(tools, { onConflict: 'slug' })

  if (error) {
    console.error('导入失败:', error)
    process.exit(1)
  }

  console.log(`\n✅ 成功导入 ${tools.length} 条工具数据`)

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