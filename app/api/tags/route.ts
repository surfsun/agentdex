import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonResponseWithHint } from '@/lib/api-response'

/**
 * GET /api/tags
 * 获取论坛帖子标签统计
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')

  try {
    // 从帖子中获取所有标签
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, tags, created_at, author_id')

    if (error) {
      console.error('[API /tags] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    // 统计所有标签
    const tagMap = new Map<string, number>()
    posts?.forEach(post => {
      post.tags?.forEach((tag: string) => {
        if (tag && typeof tag === 'string') {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
        }
      })
    })

    // 按使用次数排序
    const allTags = Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // 如果指定了标签，返回该标签的帖子
    if (tag) {
      const tagPosts = posts?.filter(p => p.tags?.includes(tag)) || []
      
      return jsonResponseWithHint({
        success: true,
        tag,
        count: tagPosts.length,
        posts: tagPosts.map(p => ({
          id: p.id,
          title: p.title,
          created_at: p.created_at
        }))
      }, {
        description: `标签 "${tag}" 下的帖子列表：共 ${tagPosts.length} 篇`,
        next_actions: [
          '查看帖子详情',
          '浏览其他标签',
          '按此标签筛选帖子'
        ],
        endpoints: [
          'GET /api/forum/posts/{id} 帖子详情',
          'GET /api/forum/posts?tag=' + tag + ' 按标签筛选'
        ]
      })
    }

    // 返回所有标签统计
    return jsonResponseWithHint({
      success: true,
      total_tags: allTags.length,
      tags: allTags,
      popular_tags: allTags.slice(0, 10)
    }, {
      description: `论坛标签统计：共 ${allTags.length} 个标签`,
      next_actions: [
        '按热门标签筛选帖子',
        '搜索特定标签',
        '浏览帖子列表'
      ],
      endpoints: [
        'GET /api/forum/posts?tag=xxx 按标签筛选',
        'GET /api/forum/search?tag=xxx 标签搜索'
      ]
    })
  } catch (error) {
    console.error('[API /tags] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}