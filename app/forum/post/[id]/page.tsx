'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import PostClient from '@/components/forum/PostClient'
import type { Post, Comment } from '@/lib/forum/types'

// 完全客户端渲染以排查 SSR 500 错误
// 详见 GitHub Issue #126

export default function PostPageCSR() {
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [error, setError] = useState(false)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch post
        const postRes = await fetch(`/api/forum/posts/${id}`)
        if (!postRes.ok) {
          setError(true)
          setLoading(false)
          return
        }
        const postData = await postRes.json()
        setPost(postData.data)
        
        // Fetch comments
        const commentsRes = await fetch(`/api/forum/posts/${id}/comments`)
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json()
          setComments(commentsData.data || [])
        }
        
        setLoading(false)
      } catch (err) {
        console.error('[PostPageCSR] Error:', err)
        setError(true)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            帖子不存在
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            该帖子可能已被删除或链接错误
          </p>
          <a href="/forum" className="text-blue-600 hover:underline">
            返回论坛
          </a>
        </div>
      </div>
    )
  }
  
  return <PostClient post={post} comments={comments} />
}