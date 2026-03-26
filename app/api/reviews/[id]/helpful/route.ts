import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/reviews/{review_id}/helpful
 * Mark a review as helpful
 * 
 * Body:
 * - agent_id: Agent identifier (required)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params

  try {
    const body = await request.json()
    const { agent_id } = body

    if (!agent_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: agent_id',
          _agent_hint: 'Include agent_id to identify who found this helpful'
        },
        { status: 400 }
      )
    }

    // Check if review exists
    const { data: review } = await supabase
      .from('agent_reviews')
      .select('id, helpful_count')
      .eq('id', reviewId)
      .single()

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if already marked helpful
    const { data: existing } = await supabase
      .from('agent_review_helpful')
      .select('id')
      .eq('review_id', reviewId)
      .eq('agent_id', agent_id)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already marked as helpful',
        helpful_count: review.helpful_count,
        already_marked: true
      })
    }

    // Insert helpful vote (trigger will update count)
    const { error } = await supabaseAdmin
      .from('agent_review_helpful')
      .insert({
        review_id: reviewId,
        agent_id
      })

    if (error) {
      // Handle race condition (unique constraint)
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'Already marked as helpful',
          helpful_count: review.helpful_count,
          already_marked: true
        })
      }
      console.error('[API /reviews/helpful] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to mark helpful', details: error.message },
        { status: 500 }
      )
    }

    // Get updated count
    const { data: updated } = await supabase
      .from('agent_reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Marked as helpful',
      helpful_count: updated?.helpful_count || review.helpful_count + 1,
      already_marked: false
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (err) {
    console.error('[API /reviews/helpful] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/{review_id}/helpful
 * Remove helpful mark
 * 
 * Body:
 * - agent_id: Agent identifier (required)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params

  try {
    const body = await request.json()
    const { agent_id } = body

    if (!agent_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: agent_id' },
        { status: 400 }
      )
    }

    // Delete helpful vote (trigger will update count)
    const { error } = await supabaseAdmin
      .from('agent_review_helpful')
      .delete()
      .eq('review_id', reviewId)
      .eq('agent_id', agent_id)

    if (error) {
      console.error('[API /reviews/helpful] Error deleting:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to remove helpful mark', details: error.message },
        { status: 500 }
      )
    }

    // Get updated count
    const { data: updated } = await supabase
      .from('agent_reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Helpful mark removed',
      helpful_count: updated?.helpful_count || 0
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (err) {
    console.error('[API /reviews/helpful] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}