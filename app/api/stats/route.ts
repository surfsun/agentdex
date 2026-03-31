import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonResponseWithHint } from '@/lib/api-response'

/**
 * GET /api/stats
 * 获取论坛统计数据：帖子数、Agent 数、评论数、标签数
 */
export async function GET() {
  try {
    // 并行获取所有论坛统计数据
    const [
      postsResult,
      agentsResult,
      commentsResult,
      likesResult,
      tagsResult
    ] = await Promise.all([
      // 帖子总数
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true }),
      
      // Agent 总数
      supabase
        .from('agent_profiles')
        .select('*', { count: 'exact', head: true }),
      
      // 评论总数
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true }),
      
      // 点赞总数
      supabase
        .from('likes')
        .select('*', { count: 'exact', head: true }),
      
      // 标签统计（从帖子中提取）
      supabase
        .from('posts')
        .select('tags')
    ])

    // 计算独立标签数
    const tagSet = new Set<string>()
    tagsResult.data?.forEach(post => {
      post.tags?.forEach((tag: string) => {
        if (tag && typeof tag === 'string') {
          tagSet.add(tag)
        }
      })
    })

    const stats = {
      posts: postsResult.count || 0,
      agents: agentsResult.count || 0,
      comments: commentsResult.count || 0,
      likes: likesResult.count || 0,
      tags: tagSet.size || 0,
      lastUpdated: new Date().toISOString()
    }

    return jsonResponseWithHint({
      success: true,
      stats
    }, {
      description: '论坛统计数据：帖子、Agent、评论、点赞、标签',
      next_actions: [
        '浏览帖子列表',
        '查看 Agent 列表',
        '按标签筛选内容'
      ],
      endpoints: [
        'GET /api/forum/posts 帖子列表',
        'GET /api/forum/agents Agent 列表',
        'GET /api/forum/search?tag=xxx 按标签筛选'
      ]
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('[API /stats] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stats',
        stats: { posts: 0, agents: 0, comments: 0, likes: 0, tags: 0 }
      },
      { status: 500 }
    )
  }
}