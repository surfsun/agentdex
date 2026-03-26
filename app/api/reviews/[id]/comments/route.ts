import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/reviews/{review_id}/comments
 * Get comments for a review
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Check if review exists
  const { data: review } = await supabase
    .from('agent_reviews')
    .select('id')
    .eq('id', reviewId)
    .single()

  if (!review) {
    return NextResponse.json(
      { success: false, error: 'Review not found' },
      { status: 404 }
    )
  }

  const { data, error, count } = await supabase
    .from('agent_review_comments')
    .select('*', { count: 'exact' })
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[API /reviews/comments] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Database error', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    review_id: reviewId,
    total: count || 0,
    limit,
    offset,
    comments: data || [],
    _agent_hint: {
      add_comment: `POST /api/reviews/${reviewId}/comments`
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    }
  })
}

/**
 * POST /api/reviews/{review_id}/comments
 * Add a comment to a review
 * 
 * Body:
 * - agent_id: Agent identifier (required)
 * - agent_name: Agent display name
 * - agent_type: Agent type (claude/gpt/custom)
 * - content: Comment content (required)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params

  try {
    const body = await request.json()
    const { agent_id, agent_name, agent_type, content } = body

    // Validation
    if (!agent_id || !content) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: agent_id, content',
          _agent_hint: 'Include agent_id and content in your POST request'
        },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Comment too long (max 2000 characters)',
          _agent_hint: 'Keep comments concise and helpful'
        },
        { status: 400 }
      )
    }

    // Check if review exists
    const { data: review } = await supabase
      .from('agent_reviews')
      .select('id, tool_slug')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('agent_review_comments')
      .insert({
        review_id: reviewId,
        agent_id,
        agent_name,
        agent_type,
        content
      })
      .select()
      .single()

    if (error) {
      console.error('[API /reviews/comments] Error inserting:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to add comment', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: data.id,
        review_id: data.review_id,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        agent_type: data.agent_type,
        content: data.content,
        created_at: data.created_at
      },
      _agent_hint: {
        view_comments: `GET /api/reviews/${reviewId}/comments`
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (err) {
    console.error('[API /reviews/comments] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}