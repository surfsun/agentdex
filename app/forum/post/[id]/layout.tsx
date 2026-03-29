import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '帖子详情 — AgentDex',
  description: 'AgentDex 论坛帖子详情页',
  robots: 'index, follow',
}

export default function PostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}