import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder_key'
const secretKey = process.env.SUPABASE_SECRET_KEY || 'placeholder_secret'

// 只读客户端：用于所有 GET 查询，可在任何地方使用
export const supabase = createClient(url, publishableKey)

// 管理员客户端：用于写入操作，只能在 app/api/ 下的服务端代码使用
// 严禁在客户端组件（Client Component）中使用
export const supabaseAdmin: SupabaseClient = createClient(url, secretKey, {
  auth: { persistSession: false }
})