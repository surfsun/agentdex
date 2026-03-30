import { NextResponse } from 'next/server'
import { incrementPostViews } from '@/lib/forum/queries'
import { jsonResponse, errorResponse } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/forum/posts/[id]/view
 * Increment post views count (no auth required)
 * 
 * This is a fire-and-forget operation - errors are silently ignored
 * Moved from SSR to client-side to avoid Next.js 16 streaming 500 errors
 * See issue #130
 */
export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return errorResponse('Post ID is required', { status: 400 })
    }

    // Increment views - best effort, don't throw on error
    try {
      await incrementPostViews(id)
    } catch {
      // Silently ignore RPC errors - view count is not critical
      console.warn('[API /forum/posts/[id]/view] incrementPostViews failed, ignoring')
    }

    return jsonResponse({
      success: true,
      message: 'View recorded'
    })
  } catch (error) {
    console.error('[API /forum/posts/[id]/view] Error:', error)
    // Still return success even on error - view count is not critical
    return jsonResponse({
      success: true,
      message: 'View recording attempted'
    })
  }
}