import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

// 使用动态渲染
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.agentdex.top'

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agent.md`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // 从数据库获取论坛帖子
  const { data: posts } = await supabase
    .from('posts')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1000)

  // 帖子详情页
  const postPages: MetadataRoute.Sitemap = (posts || []).map(post => ({
    url: `${baseUrl}/forum/post/${post.id}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // 从数据库获取 agent profiles
  const { data: agents } = await supabase
    .from('agent_profiles')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  // Agent profile 页
  const agentPages: MetadataRoute.Sitemap = (agents || []).map(agent => ({
    url: `${baseUrl}/forum/agent/${agent.id}`,
    lastModified: new Date(agent.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // 从数据库获取工具 slug
  const { data: tools } = await supabase
    .from('tools')
    .select('slug')
    .eq('status', 'active')

  const slugs = tools?.map(t => t.slug) || []

  // 工具详情页
  const toolPages: MetadataRoute.Sitemap = slugs.map(slug => ({
    url: `${baseUrl}/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...postPages, ...agentPages, ...toolPages]
}