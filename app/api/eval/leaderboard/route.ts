import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), 'data/eval/sessions');

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

    // 扫描 sessions 目录
    if (!fs.existsSync(SESSIONS_DIR)) {
      return NextResponse.json({ entries: [], total: 0 });
    }

    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    const entries: LeaderboardEntry[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf-8');
        const session = JSON.parse(content);

        // 只统计已完成的评测
        if (session.status !== 'completed') continue;

        // 框架筛选
        if (framework && session.agent_info?.framework !== framework) continue;

        // 计算总分
        const totalScore = session.answers?.reduce((sum: number, a: any) => sum + (a.score || 0), 0) || 0;
        const avgScore = session.answers?.length > 0 
          ? Math.round(totalScore / session.answers.length) 
          : 0;

        entries.push({
          rank: 0,
          agent_name: sanitize(session.agent_info?.name || 'Anonymous'),
          agent_framework: session.agent_info?.framework || 'unknown',
          model: session.agent_info?.model || 'unknown',
          total_score: avgScore,
          level: session.level || 'Basic',
          eval_date: session.completed_at || session.created_at,
        });
      } catch {
        // 跳过无效文件
      }
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