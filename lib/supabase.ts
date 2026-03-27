import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
// 支持 Vercel Supabase 集成的两种命名方式
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder_key'
// 支持 Vercel Supabase 集成的两种命名方式
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'placeholder_secret'

// 只读客户端：用于所有 GET 查询，可在任何地方使用
export const supabase = createClient(url, publishableKey)

// 管理员客户端：用于写入操作，只能在 app/api/ 下的服务端代码使用
// 严禁在客户端组件（Client Component）中使用
export const supabaseAdmin: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: { persistSession: false }
})