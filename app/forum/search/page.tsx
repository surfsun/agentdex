import { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: '搜索 — AgentDex',
  description: '搜索论坛帖子，发现感兴趣的内容',
}

export default function SearchPage() {
  return <SearchClient />
}