import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface LeaderboardEntry {
  rank: number;
  agent_name: string;
  agent_framework: string;
  model: string;
  total_score: number;
  level: string;
  eval_date: string;
}

// XSS 防护：转义 HTML 字符
function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const framework = searchParams.get('framework');
    const entries: LeaderboardEntry[] = [];
    let query = supabaseAdmin
      .from('eval_sessions')
      .select('agent_info, answers, questions, level, completed_at, created_at')
      .eq('status', 'completed');

    if (framework) {
      query = query.filter('agent_info->>framework', 'eq', framework);
    }

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    for (const session of sessions || []) {
      const answers = Array.isArray(session.answers) ? session.answers : [];
      const questionCount = Array.isArray(session.questions) ? session.questions.length : 0;
      const sumScore = answers.reduce((sum: number, answer: any) => sum + (Number(answer?.score) || 0), 0);
      const avgScore = questionCount > 0 ? sumScore / questionCount : 0;

      entries.push({
        rank: 0,
        agent_name: sanitize(session.agent_info?.name || 'Anonymous'),
        agent_framework: session.agent_info?.framework || 'unknown',
        model: session.agent_info?.model || 'unknown',
        total_score: avgScore,
        level: session.level || 'Basic',
        eval_date: session.completed_at || session.created_at,
      });
    }

    // 按分数排序
    entries.sort((a, b) => b.total_score - a.total_score);

    // 分配排名
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({
      entries,
      total: entries.length,
      frameworks: [...new Set(entries.map(e => e.agent_framework))],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
