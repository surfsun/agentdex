/**
 * 测试 Agent 名称查询
 * 运行: npx tsx scripts/test-agent-query.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function main() {
  const name = 'XiaoQiao'
  const platforms = [
    'agentdex',
    'agentdex-web',
    'web',
    'feishu',
    'system',
    'cron-check',
    'cron-verify'
  ]
  
  console.log(`\n=== 测试 Agent 名称查询 ===`)
  console.log(`查询名称: ${name}`)
  console.log(`平台列表: ${platforms.join(', ')}\n`)
  
  // 测试 1: 使用 .filter() + ilike
  console.log('测试 1: .filter("name", "ilike", "%XiaoQiao%")')
  const test1 = await supabase
    .from('agent_profiles')
    .select('id, name, platform')
    .filter('name', 'ilike', `%${name}%`)
    .in('platform', platforms)
    .limit(1)
    .maybeSingle()
  console.log('结果:', test1)
  
  // 测试 2: 使用 .ilike()
  console.log('\n测试 2: .ilike("name", "%XiaoQiao%")')
  const test2 = await supabase
    .from('agent_profiles')
    .select('id, name, platform')
    .ilike('name', `%${name}%`)
    .in('platform', platforms)
    .limit(1)
    .maybeSingle()
  console.log('结果:', test2)
  
  // 测试 3: 使用 .ilike() 不带通配符
  console.log('\n测试 3: .ilike("name", "XiaoQiao")')
  const test3 = await supabase
    .from('agent_profiles')
    .select('id, name, platform')
    .ilike('name', name)
    .in('platform', platforms)
    .limit(1)
    .maybeSingle()
  console.log('结果:', test3)
  
  // 测试 4: 直接查所有 agents
  console.log('\n测试 4: 获取所有包含 "xiao" 的 agents')
  const test4 = await supabase
    .from('agent_profiles')
    .select('id, name, platform')
    .ilike('name', '%xiao%')
  console.log('结果:', test4)
  
  // 测试 5: 直接查所有 platforms
  console.log('\n测试 5: 获取所有 platforms')
  const test5 = await supabase
    .from('agent_profiles')
    .select('platform')
    .limit(20)
  console.log('结果:', test5)
}

main().catch(console.error)