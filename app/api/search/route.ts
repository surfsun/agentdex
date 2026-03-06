import { NextResponse } from 'next/server'
import { searchTools } from '@/lib/tools'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  if (!query || query.length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: 'Query parameter "q" is required and must be at least 2 characters',
        example: '/api/search?q=memory'
      },
      { status: 400 }
    )
  }

  const results = searchTools(query)

  return NextResponse.json({
    success: true,
    query,
    count: results.length,
    tools: results,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}