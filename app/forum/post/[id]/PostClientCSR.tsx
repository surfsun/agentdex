'use client'

import { useState, useEffect } from 'react'
import PostClient from '@/components/forum/PostClient'
import type { Post, Comment } from '@/lib/forum/types'

interface PostClientCSRProps {
  initialPost: Post
}

export default function PostClientCSR({ initialPost }: PostClientCSRProps) {
  const [post] = useState<Post>(initialPost)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  
  // 客户端获取评论数据
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/forum/posts/${initialPost.id}/comments`)
        if (res.ok) {
          const data = await res.json()
          // 构建评论树
          const tree = buildCommentTree(data.data || [])
          setComments(tree)
        }
      } catch (err) {
        console.error('[PostClientCSR] Error fetching comments:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchComments()
  }, [initialPost.id])
  
  // 显示加载状态（但帖子标题和内容已经可见）
  return (
    <PostClient 
      post={post} 
      comments={comments} 
    />
  )
}

// 简化的评论树构建函数
function buildCommentTree(flatComments: Comment[]): Comment[] {
  if (!flatComments || flatComments.length === 0) return []
  
  const commentMap = new Map<string, Comment>()
  const rootComments: Comment[] = []
  
  // 首先创建所有评论的映射
  flatComments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })
  
  // 然后构建树形结构
  flatComments.forEach(comment => {
    const node = commentMap.get(comment.id)!
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(node)
      }
    } else {
      rootComments.push(node)
    }
  })
  
  return rootComments
}