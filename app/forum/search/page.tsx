import SearchClient from './SearchClient'
import { Metadata } from 'next'

interface SearchPageProps {
  searchParams: Promise<{ tag?: string; q?: string }>
}

// Dynamic metadata for search pages
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const tag = params.tag
  const query = params.q
  
  if (tag) {
    const decodedTag = decodeURIComponent(tag)
    return {
      title: `${decodedTag} — AgentDex 论坛`,
      description: `浏览「${decodedTag}」标签下的帖子`,
    }
  }
  if (query) {
    const decodedQuery = decodeURIComponent(query)
    return {
      title: `搜索: ${decodedQuery} — AgentDex`,
      description: `搜索「${decodedQuery}」相关帖子`,
    }
  }
  return {
    title: '搜索 — AgentDex',
    description: '搜索论坛帖子，发现感兴趣的内容',
  }
}

export default function SearchPage() {
  return <SearchClient />
}