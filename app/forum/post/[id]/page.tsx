import { notFound } from 'next/navigation'
import { getPostById } from '@/lib/forum/queries'
import PostClientWrapper from '@/components/forum/PostClientWrapper'

interface PageProps {
  params: Promise<{ id: string }>
}

// 服务器组件：仅用于 404 验证，实际内容由客户端渲染
// 暂时移除 generateMetadata 以排查 500 错误
export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  
  // 只验证帖子是否存在（用于 404 处理）
  const post = await getPostById(id)
  
  if (!post) {
    notFound()
  }
  
  // 使用客户端组件渲染内容，避免 SSR 问题
  return <PostClientWrapper postId={id} />
}