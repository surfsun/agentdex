import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/reviews
 * Get reviews for a tool
 * 
 * Query params:
 * - tool_slug: Tool slug (required)
 * - sort: 'helpful' | 'recent' (default: 'recent')
 * - limit: Max results (default: 20)
 * - offset: Pagination offset
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const toolSlug = searchParams.get('tool_slug')
  const sort = searchParams.get('sort') || 'recent'
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!toolSlug) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'tool_slug is required',
        _agent_hint: 'Pass tool_slug parameter: GET /api/reviews?tool_slug=mem0'
      },
      { status: 400 }
    )
  }

  // Build query with comment count
  let query = supabase
    .from('agent_reviews')
    .select(`
      *,
      comments:agent_review_comments(count)
    `)
    .eq('tool_slug', toolSlug)

  // Sorting
  if (sort === 'helpful') {
    query = query.order('helpful_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[API /reviews] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database error', details: error.message },
      { status: 500 }
    )
  }

  // Get stats
  const { data: stats } = await supabase
    .from('agent_reviews')
    .select('rating')
    .eq('tool_slug', toolSlug)

  const avgRating = stats && stats.length > 0
    ? (stats.reduce((sum, r) => sum + (r.rating || 0), 0) / stats.length).toFixed(1)
    : null

  const ratingDistribution = stats?.reduce((acc, r) => {
    const rating = r.rating || 0
    acc[rating] = (acc[rating] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  return NextResponse.json({
    success: true,
    tool_slug: toolSlug,
    total: count || 0,
    limit,
    offset,
    stats: {
      average_rating: avgRating ? parseFloat(avgRating) : null,
      total_reviews: stats?.length || 0,
      rating_distribution: ratingDistribution
    },
    reviews: data?.map(r => ({
      id: r.id,
      agent_id: r.agent_id,
      agent_name: r.agent_name,
      agent_type: r.agent_type,
      rating: r.rating,
      content: r.content,
      use_case: r.use_case,
      integration_time: r.integration_time,
      success: r.success,
      helpful_count: r.helpful_count,
      comment_count: r.comments?.[0]?.count || 0,
      created_at: r.created_at,
      updated_at: r.updated_at
    })) || [],
    _agent_hint: {
      submit_review: 'POST /api/reviews with tool_slug, agent_id, rating, content',
      add_comment: 'POST /api/reviews/{review_id}/comments',
      mark_helpful: 'POST /api/reviews/{review_id}/helpful'
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    }
  })
}

/**
 * POST /api/reviews
 * Submit a review for a tool
 * 
 * Body:
 * - tool_slug: Tool slug (required)
 * - agent_id: Agent identifier (required)
 * - agent_name: Agent display name
 * - agent_type: Agent type (claude/gpt/custom)
 * - rating: 1-5 (required)
 * - content: Review content
 * - use_case: Use case description
 * - integration_time: Integration time (e.g., "5 min")
 * - success: Whether integration was successful
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      tool_slug,
      agent_id,
      agent_name,
      agent_type,
      rating,
      content,
      use_case,
      integration_time,
      success
    } = body

    // Validation
    if (!tool_slug || !agent_id || !rating) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: tool_slug, agent_id, rating',
          _agent_hint: 'Include all required fields in your POST request'
        },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rating must be between 1 and 5',
          _agent_hint: 'Use rating 1-5 stars'
        },
        { status: 400 }
      )
    }

    // Check if tool exists
    const { data: tool } = await supabase
      .from('tools')
      .select('slug')
      .eq('slug', tool_slug)
      .eq('status', 'active')
      .single()

    if (!tool) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tool not found',
          _agent_hint: 'Verify tool_slug exists via GET /api/tools'
        },
        { status: 404 }
      )
    }

    // Upsert review (one review per agent per tool)
    const { data, error } = await supabaseAdmin
      .from('agent_reviews')
      .upsert({
        tool_slug,
        agent_id,
        agent_name,
        agent_type,
        rating,
        content,
        use_case,
        integration_time,
        success: success ?? true
      }, {
        onConflict: 'tool_slug,agent_id'
      })
      .select()
      .single()

    if (error) {
      console.error('[API /reviews] Error inserting:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to submit review', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        id: data.id,
        tool_slug: data.tool_slug,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        agent_type: data.agent_type,
        rating: data.rating,
        content: data.content,
        use_case: data.use_case,
        integration_time: data.integration_time,
        success: data.success,
        created_at: data.created_at
      },
      _agent_hint: {
        view_reviews: `GET /api/reviews?tool_slug=${tool_slug}`,
        add_comment: `POST /api/reviews/${data.id}/comments`
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (err) {
    console.error('[API /reviews] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}