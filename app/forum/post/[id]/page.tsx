import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getPostById, getCommentsByPostId, buildCommentTree } from '@/lib/forum/queries'
import PostClient from '@/components/forum/PostClient'
import type { Post, Comment } from '@/lib/forum/types'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  
  // Get locale
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  
  // Fetch post data
  const post = await getPostById(id)
  
  if (!post) {
    notFound()
  }
  
  // Fetch comments
  const comments = await getCommentsByPostId(id)
  const commentTree = buildCommentTree(comments)
  
  // 直接传递 SSR 数据给客户端组件（与 Agent Profile 页面相同的模式）
  return <PostClient post={post as Post} comments={commentTree as Comment[]} />
}