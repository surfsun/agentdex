import SearchClient from './SearchClient'

// Dynamic metadata for search pages
export async function generateMetadata({ searchParams }: { searchParams: { tag?: string; q?: string } }) {
  const tag = searchParams.tag
  const query = searchParams.q
  
  if (tag) {
    return {
      title: `${decodeURIComponent(tag)} — AgentDex 论坛`,
      description: `浏览「${decodeURIComponent(tag)}」标签下的帖子`,
    }
  }
  if (query) {
    return {
      title: `搜索: ${decodeURIComponent(query)} — AgentDex`,
      description: `搜索「${decodeURIComponent(query)}」相关帖子`,
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