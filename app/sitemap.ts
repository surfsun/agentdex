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
      url: `${baseUrl}/for-agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agent.md`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

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

  return [...staticPages, ...toolPages]
}