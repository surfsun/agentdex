import { NextResponse } from 'next/server'

// 提交的工具会发到 GitHub Issue 或邮件，人工审核后合并
// 初期不自动写入 tools.json，避免垃圾数据

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

    // 构建提交记录
    const submission = {
      ...body,
      submitted_at: new Date().toISOString(),
      submitted_by: 'agent',
      status: 'pending_review',
    }

    // TODO: 后续接入 GitHub API 自动创建 Issue
    // 现在先记录到日志（Vercel Function Logs 可查看）
    console.log('[AgentDex Submission]', JSON.stringify(submission))

    return NextResponse.json({
      success: true,
      message: 'Tool submission received. It will be reviewed and added within 48 hours.',
      submission_id: `sub_${Date.now()}`,
      submitted: submission,
      _note: 'Submissions are manually reviewed before being added to the directory.',
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
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