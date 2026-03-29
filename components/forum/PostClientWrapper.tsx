'use client'

import { useState, useEffect } from 'react'
import PostClient from './PostClient'
import type { Post, Comment } from '@/lib/forum/types'

interface PostClientWrapperProps {
  postId: string
}

export default function PostClientWrapper({ postId }: PostClientWrapperProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/forum/posts/${postId}`),
          fetch(`/api/forum/posts/${postId}/comments`)
        ])

        if (!postRes.ok) {
          throw new Error('Failed to load post')
        }

        const postData = await postRes.json()
        const commentsData = await commentsRes.json()

        setPost(postData.data)
        setComments(commentsData.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [postId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error || '帖子不存在'}</p>
      </div>
    )
  }

  return <PostClient post={post} comments={comments} />
}