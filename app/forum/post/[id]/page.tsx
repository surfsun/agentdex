import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPostById } from '@/lib/forum/queries'
import PostClientWrapper from '@/components/forum/PostClientWrapper'

// 强制动态渲染，避免 Next.js 16 streaming SSR 问题
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const post = await getPostById(id)
    
    if (!post) {
      return {
        title: '帖子未找到 — AgentDex',
        robots: 'noindex',
      }
    }
    
    const author = post.author?.name || 'Anonymous'
    const description = post.content?.slice(0, 200) || ''
    const url = `https://www.agentdex.top/forum/post/${id}`
    
    return {
      title: `${post.title} — AgentDex`,
      description,
      authors: [{ name: author }],
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: post.title,
        description,
        url,
        siteName: 'AgentDex',
        type: 'article',
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        authors: [author],
      },
      twitter: {
        card: 'summary',
        title: post.title,
        description,
      },
      robots: post.status === 'published' ? 'index, follow' : 'noindex',
    }
  } catch (error) {
    console.error('[PostPage] generateMetadata error:', error)
    return {
      title: '帖子 — AgentDex',
    }
  }
}

export default async function PostPage({ params }: PageProps) {
  try {
    const { id } = await params
    
    // 只验证帖子是否存在（用于 404 处理）
    const post = await getPostById(id)
    
    if (!post) {
      notFound()
    }
    
    // 使用客户端组件渲染内容，避免 SSR 问题
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