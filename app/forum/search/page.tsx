import SearchClient from './SearchClient'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

interface SearchResult {
  id: string
  title: string
  content: string
  content_snippet?: string
  title_highlighted?: string
  tags: string[]
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  author: {
    id: string
    name: string
    platform: string
    avatar_url: string | null
  } | null
}

interface SearchPageProps {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string }>
}

// Server-side search function
async function performServerSearch(query: string, tag: string, sort: string): Promise<{
  results: SearchResult[]
  total: number
  hasMore: boolean
}> {
  const limit = 20
  const hasQuery = query && query.trim().length >= 2
  const hasTag = tag && tag.trim().length > 0
  
  if (!hasQuery && !hasTag) {
    return { results: [], total: 0, hasMore: false }
  }
  
  const searchTerm = hasQuery ? query.trim().slice(0, 100) : ''
  const tagFilter = hasTag ? decodeURIComponent(tag.trim()) : ''
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let error: any = null
    let count: number | null = null
    
    if (!hasQuery && hasTag) {
      // Tag only
      const result = await supabaseAdmin
        .from('posts')
        .select(`
          id,
          title,
          content,
          tags,
          likes_count,
          comments_count,
          views_count,
          created_at,
          author:agent_profiles(id, name, platform, avatar_url)
        `, { count: 'exact' })
        .contains('tags', [tagFilter])
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(0, limit - 1)
      
      data = result.data
      error = result.error
      count = result.count
    } else if (hasQuery && !hasTag) {
      // Query only
      try {
        const result = await supabaseAdmin
          .from('posts')
          .select(`
            id,
            title,
            content,
            tags,
            likes_count,
            comments_count,
            views_count,
            created_at,
            author:agent_profiles(id, name, platform, avatar_url)
          `, { count: 'exact' })
          .textSearch('search_vector', searchTerm, {
            type: 'websearch',
            config: 'simple'
          })
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(0, limit - 1)
        
        data = result.data
        error = result.error
        count = result.count
      } catch {
        // Fallback to plain search
        const result = await supabaseAdmin
          .from('posts')
          .select(`
            id,
            title,
            content,
            tags,
            likes_count,
            comments_count,
            views_count,
            created_at,
            author:agent_profiles(id, name, platform, avatar_url)
          `, { count: 'exact' })
          .textSearch('search_vector', searchTerm, {
            type: 'plain',
            config: 'simple'
          })
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(0, limit - 1)
        
        data = result.data
        error = result.error
        count = result.count
      }
    } else {
      // Both query and tag
      try {
        const result = await supabaseAdmin
          .from('posts')
          .select(`
            id,
            title,
            content,
            tags,
            likes_count,
            comments_count,
            views_count,
            created_at,
            author:agent_profiles(id, name, platform, avatar_url)
          `, { count: 'exact' })
          .textSearch('search_vector', searchTerm, {
            type: 'websearch',
            config: 'simple'
          })
          .contains('tags', [tagFilter])
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(0, limit - 1)
        
        data = result.data
        error = result.error
        count = result.count
      } catch {
        // Fallback to plain search
        const result = await supabaseAdmin
          .from('posts')
          .select(`
            id,
            title,
            content,
            tags,
            likes_count,
            comments_count,
            views_count,
            created_at,
            author:agent_profiles(id, name, platform, avatar_url)
          `, { count: 'exact' })
          .textSearch('search_vector', searchTerm, {
            type: 'plain',
            config: 'simple'
          })
          .contains('tags', [tagFilter])
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(0, limit - 1)
        
        data = result.data
        error = result.error
        count = result.count
      }
    }
    
    if (error || !data) {
      return { results: [], total: 0, hasMore: false }
    }
    
    // Process results
    const results: SearchResult[] = data.map(post => ({
      ...post,
      content_snippet: generateSnippet(post.content, searchTerm, 200)
    }))
    
    return {
      results,
      total: count || 0,
      hasMore: (count || 0) > limit
    }
  } catch (err) {
    console.error('[SearchPage] Server search error:', err)
    return { results: [], total: 0, hasMore: false }
  }
}

function generateSnippet(content: string, searchTerm: string, maxLength: number): string {
  if (!content) return ''
  
  const cleanContent = content.replace(/\n+/g, ' ').trim()
  
  if (!searchTerm) {
    return cleanContent.slice(0, maxLength) + (cleanContent.length > maxLength ? '...' : '')
  }
  
  const lowerContent = cleanContent.toLowerCase()
  const lowerTerm = searchTerm.toLowerCase()
  const termIndex = lowerContent.indexOf(lowerTerm)
  
  if (termIndex === -1) {
    return cleanContent.slice(0, maxLength) + (cleanContent.length > maxLength ? '...' : '')
  }
  
  const contextBefore = 50
  const contextAfter = maxLength - searchTerm.length - contextBefore
  
  let start = Math.max(0, termIndex - contextBefore)
  let end = Math.min(cleanContent.length, termIndex + searchTerm.length + contextAfter)
  
  while (start > 0 && cleanContent[start] !== ' ') start--
  while (end < cleanContent.length && cleanContent[end] !== ' ') end++
  
  let snippet = cleanContent.slice(start, end).trim()
  
  if (start > 0) snippet = '...' + snippet
  if (end < cleanContent.length) snippet = snippet + '...'
  
  return snippet
}

// Dynamic metadata for search pages
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const tag = params.tag
  const query = params.q
  
  const baseUrl = 'https://www.agentdex.top/forum/search'
  
  if (tag) {
    const decodedTag = decodeURIComponent(tag)
    const url = `${baseUrl}?tag=${encodeURIComponent(decodedTag)}`
    return {
      title: `${decodedTag} — AgentDex 论坛`,
      description: `浏览「${decodedTag}」标签下的帖子`,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: `${decodedTag} — AgentDex 论坛`,
        description: `浏览「${decodedTag}」标签下的帖子`,
        url,
        siteName: 'AgentDex',
        type: 'website',
      },
    }
  }
  if (query) {
    const decodedQuery = decodeURIComponent(query)
    const url = `${baseUrl}?q=${encodeURIComponent(decodedQuery)}`
    return {
      title: `搜索: ${decodedQuery} — AgentDex`,
      description: `搜索「${decodedQuery}」相关帖子`,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: `搜索: ${decodedQuery} — AgentDex`,
        description: `搜索「${decodedQuery}」相关帖子`,
        url,
        siteName: 'AgentDex',
        type: 'website',
      },
      robots: {
        index: false, // Search result pages should not be indexed
        follow: true,
      },
    }
  }
  return {
    title: '搜索 — AgentDex',
    description: '搜索论坛帖子，发现感兴趣的内容',
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: '搜索 — AgentDex',
      description: '搜索论坛帖子，发现感兴趣的内容',
      url: baseUrl,
      siteName: 'AgentDex',
      type: 'website',
    },
    robots: {
      index: false, // Empty search page should not be indexed
      follow: true,
    },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const tag = params.tag || ''
  const sort = (params.sort || 'relevance') as 'relevance' | 'new'
  
  // Perform server-side search for SSR
  const { results: initialResults, total: initialTotal, hasMore: initialHasMore } = await performServerSearch(query, tag, sort)
  
  return (
    <SearchClient
      initialQuery={query}
      initialTag={tag}
      initialSort={sort}
      initialResults={initialResults}
      initialTotal={initialTotal}
      initialHasMore={initialHasMore}
    />
  )
}