import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GitHub API 配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'surfsun/agentdex'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 必填字段验证
    const required = ['name', 'website', 'category', 'tagline']
    const missing = required.filter(field => !body[field])
    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missing.join(', ')}`,
          required_fields: required,
          optional_fields: ['description', 'github', 'tags', 'pricing', 'agent_friendly', 'api_available', 'open_source'],
        },
        { status: 400 }
      )
    }

    // URL 格式验证
    try {
      new URL(body.website)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid website URL format' },
        { status: 400 }
      )
    }

    // 防重复：同一 website 24 小时内只能提交一次
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await supabaseAdmin
      .from('tool_submissions')
      .select('id')
      .eq('tool_data->>website', body.website)
      .gte('created_at', oneDayAgo)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'This tool was already submitted recently' },
        { status: 429 }
      )
    }

    // 写入 Supabase 审核队列
    const { data: submission, error: dbError } = await supabaseAdmin
      .from('tool_submissions')
      .insert({
        tool_data: body,
        submitted_by: body.submitted_by ?? 'anonymous',
        status: 'pending'
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[AgentDex] Supabase insert error:', dbError)
      // 继续处理，不阻断流程
    }

    // 如果有 GitHub Token，创建 Issue
    let issueUrl = null
    if (GITHUB_TOKEN) {
      try {
        const issueTitle = `[Tool Submission] ${body.name}`
        const issueBody = `## Tool Submission

**Name:** ${body.name}
**Website:** ${body.website}
**Category:** ${body.category}
**Tagline:** ${body.tagline}

${body.description ? `**Description:**\n${body.description}` : ''}

${body.github ? `**GitHub:** ${body.github}` : ''}

${body.tags ? `**Tags:** ${body.tags.join(', ')}` : ''}

**Pricing:** ${body.pricing || 'unknown'}
**Agent-friendly:** ${body.agent_friendly ? 'Yes' : 'No'}
**API available:** ${body.api_available ? 'Yes' : 'No'}
**Open source:** ${body.open_source ? 'Yes' : 'No'}

---
*Submitted via API at ${new Date().toISOString()}*
Submission ID: ${submission?.id || 'N/A'}`

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'AgentDex/1.0',
          },
          body: JSON.stringify({
            title: issueTitle,
            body: issueBody,
            labels: ['tool-submission'],
          }),
        })

        if (response.ok) {
          const issue = await response.json()
          issueUrl = issue.html_url
        } else {
          console.error('[AgentDex] GitHub API error:', await response.text())
        }
      } catch (err) {
        console.error('[AgentDex] Failed to create GitHub issue:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: issueUrl
        ? 'Tool submission received. A GitHub issue has been created for review.'
        : 'Tool submission received. It will be reviewed and added within 48 hours.',
      submission_id: submission?.id || `sub_${Date.now()}`,
      issue_url: issueUrl,
      _note: issueUrl
        ? 'Track your submission at the issue URL above.'
        : 'Submissions are manually reviewed before being added to the directory.',
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('[AgentDex] Submit error:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}