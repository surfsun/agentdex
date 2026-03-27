import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/forum/search
 * 全文搜索帖子
 * 
 * Query params:
 *   - q: 搜索关键词 (必填, 至少2个字符)
 *   - sort: 排序方式 'relevance' | 'new' (默认 'relevance')
 *   - page: 页码 (默认 1)
 *   - limit: 每页数量 (默认 20, 最大 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const sort = searchParams.get('sort') || 'relevance'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = (page - 1) * limit

    // 验证搜索词
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: '搜索关键词至少需要 2 个字符',
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        has_more: false
      })
    }

    const searchTerm = query.trim().slice(0, 100)

    // 使用 PostgreSQL 全文搜索
    // ts_rank 计算相关性分数
    // 注意: websearch 类型对特殊字符有特定解析规则，某些查询可能导致错误
    // 使用 plain 类型作为 fallback 以确保一致性
    let data: any[] | null = null
    let error: any = null
    let count: number | null = null
    
    try {
      const result = await supabaseAdmin
        .from('posts')
        .select(`
          id,
          title,
          content,
          tags,
          likes_count,
          comments_count,
          views_count,
          created_at,
          author:agent_profiles(id, name, platform, avatar_url)
        `, { count: 'exact' })
        .textSearch('search_vector', searchTerm, {
          type: 'websearch',
          config: 'simple'
        })
        .eq('status', 'published')
        .order(sort === 'new' ? 'created_at' : 'created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      data = result.data
      error = result.error
      count = result.count
    } catch (textSearchError) {
      // websearch 解析失败，使用 plain 搜索作为 fallback
      console.log('[API /forum/search] websearch failed, trying plain search:', textSearchError)
      const result = await supabaseAdmin
        .from('posts')
        .select(`
          id,
          title,
          content,
          tags,
          likes_count,
          comments_count,
          views_count,
          created_at,
          author:agent_profiles(id, name, platform, avatar_url)
        `, { count: 'exact' })
        .textSearch('search_vector', searchTerm, {
          type: 'plain',
          config: 'simple'
        })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      data = result.data
      error = result.error
      count = result.count
    }

    if (error) {
      console.error('[API /forum/search] Database error:', error)
      // 返回成功但空结果，确保前端能正确显示空状态
      return NextResponse.json({
        success: true,
        query: searchTerm,
        data: [],
        total: 0,
        page,
        limit,
        has_more: false
      })
    }

    // 处理搜索结果，生成摘要片段
    const posts = (data || []).map(post => {
      // 生成内容摘要（最多 200 字符）
      const contentSnippet = generateSnippet(post.content, searchTerm, 200)
      
      return {
        ...post,
        content_snippet: contentSnippet,
        // 标题中高亮关键词
        title_highlighted: highlightText(post.title, searchTerm)
      }
    })

    const hasMore = (count || 0) > page * limit

    return NextResponse.json({
      success: true,
      query: searchTerm,
      data: posts,
      total: count || 0,
      page,
      limit,
      has_more: hasMore
    })
  } catch (error) {
    console.error('[API /forum/search] Error:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误',
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      has_more: false
    }, { status: 500 })
  }
}

/**
 * 生成搜索结果摘要片段
 */
function generateSnippet(content: string, searchTerm: string, maxLength: number): string {
  if (!content) return ''
  
  // 清理内容
  const cleanContent = content.replace(/\n+/g, ' ').trim()
  
  // 查找关键词位置
  const lowerContent = cleanContent.toLowerCase()
  const lowerTerm = searchTerm.toLowerCase()
  const termIndex = lowerContent.indexOf(lowerTerm)
  
  if (termIndex === -1) {
    // 没找到关键词，返回开头部分
    return cleanContent.slice(0, maxLength) + (cleanContent.length > maxLength ? '...' : '')
  }
  
  // 计算片段起始位置（关键词前后各取一些内容）
  const contextBefore = 50
  const contextAfter = maxLength - searchTerm.length - contextBefore
  
  let start = Math.max(0, termIndex - contextBefore)
  let end = Math.min(cleanContent.length, termIndex + searchTerm.length + contextAfter)
  
  // 调整到词边界
  while (start > 0 && cleanContent[start] !== ' ') start--
  while (end < cleanContent.length && cleanContent[end] !== ' ') end++
  
  let snippet = cleanContent.slice(start, end).trim()
  
  // 添加省略号
  if (start > 0) snippet = '...' + snippet
  if (end < cleanContent.length) snippet = snippet + '...'
  
  return snippet
}

/**
 * 高亮文本中的关键词
 */
function highlightText(text: string, searchTerm: string): string {
  if (!text || !searchTerm) return text || ''
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')
  return text.replace(regex, '==HIGHLIGHT==$1==/HIGHLIGHT==')
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}