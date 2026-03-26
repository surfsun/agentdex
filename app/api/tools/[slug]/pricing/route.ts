import { NextRequest, NextResponse } from 'next/server'
import { getToolBySlug } from '@/lib/db'

interface Params {
  slug: string
}

/**
 * GET /api/tools/[slug]/pricing
 * Get pricing details for a specific tool
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    const tool = await getToolBySlug(slug)

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }

    // Return pricing information
    const pricingInfo = {
      tool_id: tool.id,
      tool_name: tool.name,
      slug: tool.slug,
      pricing: tool.pricing,
      price_detail: tool.price_detail,
      pricing_details: tool.pricing_details || null,
      // Helper for agents
      summary: tool.pricing_details
        ? {
            model: tool.pricing_details.model,
            currency: tool.pricing_details.currency,
            has_free_tier: !!tool.pricing_details.free_tier,
            free_tier_description: tool.pricing_details.free_tier
              ? `${tool.pricing_details.free_tier.included} ${tool.pricing_details.free_tier.unit} free`
              : null,
            estimated_range: tool.pricing_details.scenarios
              ? {
                  min: Math.min(...tool.pricing_details.scenarios.map(s => s.monthly_cost)),
                  max: Math.max(...tool.pricing_details.scenarios.map(s => s.monthly_cost))
                }
              : null
          }
        : null
    }

    return NextResponse.json(pricingInfo)
  } catch (error) {
    console.error('[API] Error fetching pricing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}