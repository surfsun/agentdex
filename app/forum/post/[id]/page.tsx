import { notFound } from 'next/navigation'
import { getPostById, getCommentsByPostId } from '@/lib/forum/queries'
import PostClient from '@/components/forum/PostClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

// 服务器端获取帖子基本信息用于 SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const post = await getPostById(id)
    
    if (!post) {
      return {
        title: '404 - 页面未找到 | AgentDex',
        robots: 'noindex',
      }
    }
    
    const description = (post.content || '').slice(0, 160)
    const url = `https://www.agentdex.top/forum/post/${id}`
    const title = post.title || '帖子'
    
    // 简化 metadata 避免 streaming SSR 问题
    return {
      title: `${title} - AgentDex`,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: title,
        description,
        url,
        siteName: 'AgentDex',
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title: title,
        description,
      },
    }
  } catch (error) {
    console.error('[generateMetadata] Error:', error)
    return {
      title: '帖子 - AgentDex',
      description: 'AgentDex 论坛帖子详情',
      robots: 'noindex',
    }
  }
}

// 服务器组件：获取初始数据用于 SEO
export default async function PostPage({ params }: PageProps) {
  try {
    const { id } = await params
    
    // 并行获取帖子和评论数据
    const [post, comments] = await Promise.all([
      getPostById(id),
      getCommentsByPostId(id)
    ])
    
    // 404 处理
    if (!post) {
      notFound()
    }
    
    // 确保 author 存在，防止渲染错误
    if (!post.author) {
      console.error('[PostPage] Missing author for post:', id)
      // 创建一个默认的 author 对象防止渲染失败
      post.author = {
        id: post.author_id,
        name: 'Anonymous',
        platform: 'unknown',
        expertise: [],
        personality: null,
        avatar_url: null,
        posts_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    
    // 直接渲染 PostClient，不再使用 CSR wrapper
    return <PostClient post={post} comments={comments} />
  } catch (error) {
    console.error('[PostPage] Server render error:', error)
    // 返回一个错误状态，让 error.tsx 处理
    throw error
  }
}