import { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'

export default function sitemap(): MetadataRoute.Sitemap {
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

  // 工具详情页
  const toolPages: MetadataRoute.Sitemap = tools.map(tool => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: new Date(tool.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...toolPages]
}