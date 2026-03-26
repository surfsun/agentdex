import { NextResponse } from 'next/server'
import { getToolBySlug } from '@/lib/db'

interface Params {
  slug: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get('lang') || 'python'

  const tool = await getToolBySlug(slug)

  if (!tool) {
    return NextResponse.json(
      { error: 'Tool not found' },
      { status: 404 }
    )
  }

  // Check if tool has integration examples
  if (!tool.code_examples || Object.keys(tool.code_examples).length === 0) {
    return NextResponse.json(
      { error: 'No integration examples available for this tool' },
      { status: 404 }
    )
  }

  // If lang parameter is provided, return only that language's examples
  if (lang !== 'all') {
    const example = tool.code_examples[lang as keyof typeof tool.code_examples]
    if (!example) {
      return NextResponse.json(
        { error: `No ${lang} examples available for this tool` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tool: tool.name,
      slug: tool.slug,
      language: lang,
      integration_minutes: tool.integration_minutes,
      ...example
    })
  }

  // Return all examples
  return NextResponse.json({
    tool: tool.name,
    slug: tool.slug,
    integration_minutes: tool.integration_minutes,
    code_examples: tool.code_examples
  })
}