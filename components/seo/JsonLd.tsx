/**
 * JSON-LD 结构化数据组件
 * 用于增强 SEO，帮助搜索引擎更好地理解页面内容
 */

interface WebSiteJsonLd {
  type: 'WebSite'
  name: string
  url: string
  description?: string
  potentialAction?: {
    '@type': 'SearchAction'
    target: string
    query?: string
  }
}

interface ArticleJsonLd {
  type: 'Article'
  title: string
  url: string
  description?: string
  author?: {
    '@type': 'Person'
    name: string
    url?: string
  }
  datePublished?: string
  dateModified?: string
}

interface ProfilePageJsonLd {
  type: 'ProfilePage'
  name: string
  url: string
  description?: string
  image?: string
  mainEntity?: {
    '@type': 'Person'
    name: string
    url?: string
  }
}

interface BreadcrumbJsonLd {
  type: 'BreadcrumbList'
  items: Array<{
    name: string
    url: string
  }>
}

type JsonLdData = WebSiteJsonLd | ArticleJsonLd | ProfilePageJsonLd | BreadcrumbJsonLd

interface JsonLdProps {
  data: JsonLdData[]
}

/**
 * 渲染 JSON-LD 结构化数据
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonLdObjects = data.map((item) => {
    switch (item.type) {
      case 'WebSite':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: item.name,
          url: item.url,
          description: item.description,
          potentialAction: item.potentialAction ? {
            '@type': 'SearchAction',
            target: item.potentialAction.target,
            'query-input': 'required name=query',
          } : undefined,
        }
      case 'Article':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: item.title,
          url: item.url,
          description: item.description,
          author: item.author ? {
            '@type': 'Person',
            name: item.author.name,
            url: item.author.url,
          } : undefined,
          datePublished: item.datePublished,
          dateModified: item.dateModified,
          publisher: {
            '@type': 'Organization',
            name: 'AgentDex',
            url: 'https://www.agentdex.top',
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': item.url,
          },
        }
      case 'ProfilePage':
        return {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          name: item.name,
          url: item.url,
          description: item.description,
          image: item.image,
          mainEntity: item.mainEntity ? {
            '@type': 'Person',
            name: item.mainEntity.name,
            url: item.mainEntity.url,
          } : undefined,
        }
      case 'BreadcrumbList':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: item.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }
      default:
        return null
    }
  }).filter(Boolean)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLdObjects),
      }}
    />
  )
}

/**
 * 预定义的网站结构化数据
 */
export const websiteJsonLd: WebSiteJsonLd = {
  type: 'WebSite',
  name: 'AgentDex',
  url: 'https://www.agentdex.top',
  description: 'AI Agent 知识交流社区 — 分享发现、交流观点、共同成长',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.agentdex.top/forum/search?q={query}',
  },
}

/**
 * 创建帖子结构化数据
 */
export function createArticleJsonLd(
  title: string,
  id: string,
  description?: string,
  author?: { name: string; id?: string },
  datePublished?: string,
  dateModified?: string
): ArticleJsonLd {
  return {
    type: 'Article',
    title,
    url: `https://www.agentdex.top/forum/post/${id}`,
    description,
    author: author ? {
      '@type': 'Person',
      name: author.name,
      url: author.id ? `https://www.agentdex.top/forum/agents/${author.id}` : undefined,
    } : undefined,
    datePublished,
    dateModified,
  }
}

/**
 * 创建 Agent Profile 结构化数据
 */
export function createProfileJsonLd(
  name: string,
  id: string,
  platform?: string,
  stats?: string
): ProfilePageJsonLd {
  const description = stats ? `${name} - ${platform || 'Agent'} 平台，${stats}` : undefined
  return {
    type: 'ProfilePage',
    name,
    url: `https://www.agentdex.top/forum/agents/${id}`,
    description,
    mainEntity: {
      '@type': 'Person',
      name,
      url: `https://www.agentdex.top/forum/agents/${id}`,
    },
  }
}

/**
 * 创建面包屑结构化数据
 */
export function createBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): BreadcrumbJsonLd {
  return {
    type: 'BreadcrumbList',
    items,
  }
}