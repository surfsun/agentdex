/**
 * 修复 integration_level 数据脚本
 * Issue: #69 - Tool Directory Filter 计数修复
 * 
 * 问题：数据库中的工具缺少 integration_level 字段值
 * 解决：根据 integration_minutes 和 category 推断并设置正确的值
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error('❌ 缺少环境变量')
  console.error('  请确保 .env.local 文件中包含:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(url, secretKey, {
  auth: { persistSession: false }
})

// 工具集成级别映射（基于工具特性）
const toolLevels: Record<string, { level: 'quick_start' | 'standard' | 'advanced', minutes: number }> = {
  // Memory tools - 快速集成
  'mem0': { level: 'quick_start', minutes: 5 },
  'zep': { level: 'quick_start', minutes: 5 },
  'letta': { level: 'quick_start', minutes: 5 },
  
  // Web tools - 各种复杂度
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
}

async function fixIntegrationLevels() {
  console.log('🔧 开始修复 integration_level 数据...\n')

  // 1. 获取所有工具
  const { data: tools, error: fetchError } = await supabaseAdmin
    .from('tools')
    .select('id, slug, name, category, agent_friendly, integration_level, integration_minutes')
    .eq('status', 'active')

  if (fetchError) {
    console.error('获取工具失败:', fetchError)
    process.exit(1)
  }

  console.log(`📊 找到 ${tools?.length || 0} 个活跃工具\n`)

  // 2. 统计当前状态
  const beforeStats = {
    with_level: tools?.filter(t => t.integration_level).length || 0,
    without_level: tools?.filter(t => !t.integration_level).length || 0,
    quick_start: tools?.filter(t => t.integration_level === 'quick_start').length || 0,
    standard: tools?.filter(t => t.integration_level === 'standard').length || 0,
    advanced: tools?.filter(t => t.integration_level === 'advanced').length || 0,
  }

  console.log('修复前统计:')
  console.log(`  有 integration_level: ${beforeStats.with_level}`)
  console.log(`  无 integration_level: ${beforeStats.without_level}`)
  console.log(`  quick_start: ${beforeStats.quick_start}`)
  console.log(`  standard: ${beforeStats.standard}`)
  console.log(`  advanced: ${beforeStats.advanced}\n`)

  // 3. 更新每个工具
  let updated = 0
  let skipped = 0

  for (const tool of tools || []) {
    // 已有 integration_level 且不为空则跳过
    if (tool.integration_level) {
      skipped++
      continue
    }

    // 从映射表获取
    let level = toolLevels[tool.slug]
    
    // 如果映射表中没有，根据 integration_minutes 推断
    if (!level && tool.integration_minutes) {
      if (tool.integration_minutes <= 15) {
        level = { level: 'quick_start', minutes: tool.integration_minutes }
      } else if (tool.integration_minutes <= 60) {
        level = { level: 'standard', minutes: tool.integration_minutes }
      } else {
        level = { level: 'advanced', minutes: tool.integration_minutes }
      }
    }
    
    // 如果还是没有，根据 agent_friendly 推断
    if (!level) {
      if (tool.agent_friendly) {
        level = { level: 'quick_start', minutes: 10 }
      } else {
        level = { level: 'standard', minutes: 30 }
      }
    }

    // 更新数据库
    const { error: updateError } = await supabaseAdmin
      .from('tools')
      .update({
        integration_level: level.level,
        integration_minutes: level.minutes
      })
      .eq('id', tool.id)

    if (updateError) {
      console.error(`  ❌ 更新 ${tool.slug} 失败:`, updateError.message)
    } else {
      updated++
      console.log(`  ✅ ${tool.slug} -> ${level.level} (${level.minutes} min)`)
    }
  }

  // 4. 验证修复结果
  const { data: updatedTools } = await supabaseAdmin
    .from('tools')
    .select('integration_level')
    .eq('status', 'active')

  const afterStats = {
    total: updatedTools?.length || 0,
    quick_start: updatedTools?.filter(t => t.integration_level === 'quick_start').length || 0,
    standard: updatedTools?.filter(t => t.integration_level === 'standard').length || 0,
    advanced: updatedTools?.filter(t => t.integration_level === 'advanced').length || 0,
    none: updatedTools?.filter(t => !t.integration_level).length || 0,
  }

  console.log('\n修复后统计:')
  console.log(`  更新了: ${updated} 个工具`)
  console.log(`  跳过: ${skipped} 个工具（已有值）`)
  console.log(`  quick_start: ${afterStats.quick_start}`)
  console.log(`  standard: ${afterStats.standard}`)
  console.log(`  advanced: ${afterStats.advanced}`)
  console.log(`  无值: ${afterStats.none}`)

  // 5. 输出验收结果
  console.log('\n✅ 修复完成！')
  console.log(`\n验收标准检查:`)
  console.log(`  - Integration Level 总计: ${afterStats.quick_start + afterStats.standard + afterStats.advanced}`)
  console.log(`  - 预期显示: Quick Start (${afterStats.quick_start}), Standard (${afterStats.standard}), Advanced (${afterStats.advanced})`)
}

fixIntegrationLevels().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})