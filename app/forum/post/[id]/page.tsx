import { notFound } from 'next/navigation'
import { getPostById } from '@/lib/forum/queries'
import PostClientWrapper from '@/components/forum/PostClientWrapper'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

// 暂时移除 generateMetadata，使用 layout.tsx 设置基础 metadata
// 问题排查：帖子详情页 streaming SSR 500 错误

export default async function PostPage({ params }: PageProps) {
  try {
    const { id } = await params
    
    // 只验证帖子是否存在（用于 404 处理）
    const post = await getPostById(id)
    
    if (!post) {
      notFound()
    }
    
    // 使用客户端组件渲染内容
    return <PostClientWrapper postId={id} />
  } catch (error) {
    console.error('[PostPage] Error:', error)
    // 如果是 notFound 错误，重新抛出让 Next.js 处理
    if (error instanceof Error && error.message === 'NEXT_NOT_FOUND') {
      throw error
    }
    // 其他错误返回 500 页面
    throw error
  }
}