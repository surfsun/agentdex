import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonResponse, errorResponse } from '@/lib/api-response'

/**
 * GET /api/forum/search
 * 全文搜索帖子 或 按标签筛选
 * 
 * Query params:
 *   - q: 搜索关键词 (可选, 与 tag 参数至少提供一个)
 *   - tag: 标签筛选 (可选, 与 q 参数至少提供一个)
 *   - sort: 排序方式 'relevance' | 'new' (默认 'relevance')
 *   - page: 页码 (默认 1)
 *   - limit: 每页数量 (默认 20, 最大 50)
 * 
 * 行为:
 *   - 仅 q: 全文搜索
 *   - 仅 tag: 按标签筛选
 *   - q + tag: 在标签范围内全文搜索
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const tag = searchParams.get('tag') || ''
    const sort = searchParams.get('sort') || 'relevance'
    const page = parseInt(searchParams.get('page') || '1', 10) || 1
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50)
    const offset = (page - 1) * limit

    // 验证：至少提供 q 或 tag 参数之一
    const hasQuery = query && query.trim().length >= 2
    const hasTag = tag && tag.trim().length > 0
    
    if (!hasQuery && !hasTag) {
      return jsonResponse({
        success: false,
        error: '请提供搜索关键词（至少2个字符）或选择一个标签',
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        has_more: false
      })
    }

    const searchTerm = hasQuery ? query.trim().slice(0, 100) : ''
    const tagFilter = hasTag ? decodeURIComponent(tag.trim()) : ''

    let data: any[] | null = null
    let error: any = null
    let count: number | null = null

    // 三种搜索模式：
    // 1. 仅标签筛选
    // 2. 仅全文搜索
    // 3. 标签 + 全文搜索
    try {
      if (!hasQuery && hasTag) {
        // 模式 1: 仅标签筛选
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
          .contains('tags', [tagFilter])
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        data = result.data
        error = result.error
        count = result.count
      } else if (hasQuery && !hasTag) {
        // 模式 2: 仅全文搜索
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
            .order('created_at', { ascending: false })
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
      } else {
        // 模式 3: 标签 + 全文搜索
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
            .contains('tags', [tagFilter])
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          
          data = result.data
          error = result.error
          count = result.count
        } catch (textSearchError) {
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
            .contains('tags', [tagFilter])
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          
          data = result.data
          error = result.error
          count = result.count
        }
      }
    } catch (dbError) {
      console.error('[API /forum/search] Database error:', dbError)
      return jsonResponse({
        success: true,
        query: searchTerm,
        tag: tagFilter,
        data: [],
        total: 0,
        page,
        limit,
        has_more: false
      })
    }

    if (error) {
      console.error('[API /forum/search] Database error:', error)
      return jsonResponse({
        success: true,
        query: searchTerm,
        tag: tagFilter,
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

    return jsonResponse({
      success: true,
      query: searchTerm,
      tag: tagFilter,
      data: posts,
      total: count || 0,
      page,
      limit,
      has_more: hasMore
    })
  } catch (error) {
    console.error('[API /forum/search] Error:', error)
    return errorResponse('服务器错误', { status: 500 })
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