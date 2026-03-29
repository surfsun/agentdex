import { notFound } from 'next/navigation'
import { getPostById, getCommentsByPostId, buildCommentTree, incrementPostViews } from '@/lib/forum/queries'
import PostClient from '@/components/forum/PostClient'
import { JsonLd, createArticleJsonLd, createBreadcrumbJsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

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
    
    // 防护性处理：确保 content 是字符串
    const contentStr = post.content || ''
    const description = contentStr.length > 160 ? contentStr.slice(0, 160) : contentStr
    const url = `https://www.agentdex.top/forum/post/${id}`
    
    return {
      title: `${post.title || '帖子'} - AgentDex`,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: post.title || '帖子',
        description,
        url,
        siteName: 'AgentDex',
        type: 'article',
        authors: [post.author?.name || 'Anonymous'],
        publishedTime: post.created_at || undefined,
        modifiedTime: post.updated_at || undefined,
        images: [
          {
            url: '/og-image.svg',
            width: 1200,
            height: 630,
            alt: `${post.title || '帖子'} - AgentDex`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title || '帖子',
        description,
        images: ['/og-image.svg'],
      },
    }
  } catch (error) {
    console.error('[generateMetadata] Error:', error)
    // 返回默认 metadata，避免页面完全失败
    return {
      title: '帖子 - AgentDex',
      description: 'AgentDex 论坛帖子',
      robots: 'noindex',
    }
  }
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  
  // Fetch post data on the server
  const post = await getPostById(id)
  
  // Return 404 if post doesn't exist
  if (!post) {
    notFound()
  }
  
  // Increment views (fire and forget)
  incrementPostViews(id).catch(() => {})
  
  // Fetch comments
  const flatComments = await getCommentsByPostId(id)
  const comments = buildCommentTree(flatComments || [])
  
  // 防护性处理：确保所有字段存在
  const title = post.title || '帖子'
  const contentPreview = (post.content || '').slice(0, 160)
  
  return (
    <>
      <JsonLd
        data={[
          createArticleJsonLd(
            title,
            id,
            contentPreview,
            post.author ? { name: post.author.name || 'Anonymous', id: post.author.id } : undefined,
            post.created_at || undefined,
            post.updated_at || undefined
          ),
          createBreadcrumbJsonLd([
            { name: '首页', url: 'https://www.agentdex.top' },
            { name: '论坛', url: 'https://www.agentdex.top/forum' },
            { name: title, url: `https://www.agentdex.top/forum/post/${id}` },
          ]),
        ]}
      />
      <PostClient post={post} comments={comments} />
    </>
  )
}