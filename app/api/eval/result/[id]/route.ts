/**
 * GET /api/eval/result/[id]
 * 获取评测结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getQuestionBank } from '@/lib/eval/session';
import { generateEvalResult } from '@/lib/eval/scorer';
import { DIMENSION_LABELS, Dimension } from '@/lib/eval/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sessionId = id;

    // 获取会话
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // 检查会话是否完成
    if (session.status !== 'completed') {
      return NextResponse.json(
        { status: 'in_progress' },
        { status: 202 }
      );
    }

    // 获取题库
    const bank = await getQuestionBank();

    // 生成评测结果
    const result = generateEvalResult(session, bank.questions);

    // 构建响应
    const response = {
      eval_id: result.eval_id,
      agent_info: {
        name: result.agent_info.name,
        framework: result.agent_info.framework,
        model: result.agent_info.model,
        eval_date: result.eval_date,
      },
      scores: {
        total: result.scores.total,
        level: result.scores.level,
        dimensions: Object.fromEntries(
          Object.entries(result.scores.dimensions).map(([key, value]) => [
            key,
            {
              score: value.score,
              label: value.label,
              questions_count: value.questions,
              answered: value.questions, // 简化，实际应该统计已答题目
            },
          ])
        ),
      },
      insights: {
        strengths: result.insights.strengths,
        weaknesses: result.insights.weaknesses,
        recommendations: generateRecommendations(result.scores.dimensions),
      },
      badge_url: result.badge_url,
      result_url: result.result_url,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting result:', error);
    return NextResponse.json(
      { error: 'Failed to get evaluation result' },
      { status: 500 }
    );
  }
}

/**
 * 根据维度得分生成工具推荐
 */
function generateRecommendations(dimensions: Record<Dimension, { score: number }>) {
  const recommendations: Array<{ tool: string; reason: string }> = [];

  // D4 < 60 → 推荐 Mem0
  if (dimensions.D4?.score < 60) {
    recommendations.push({
      tool: 'Mem0',
      reason: 'D4（上下文记忆）得分较低，Mem0 可以提供跨会话的持久记忆能力',
    });
  }

  // D3 < 60 → 推荐 Jina Reader
  if (dimensions.D3?.score < 60) {
    recommendations.push({
      tool: 'Jina Reader',
      reason: 'D3（信息获取）得分较低，Jina Reader 可以帮助更好地获取和理解网页内容',
    });
  }

  // D5 < 60 → 推荐 Langfuse
  if (dimensions.D5?.score < 60) {
    recommendations.push({
      tool: 'Langfuse',
      reason: 'D5（异常处理）需要提升，Langfuse 的轨迹追踪可以帮助调试错误场景',
    });
  }

  // D1 < 60 → 推荐 Composio
  if (dimensions.D1?.score < 60) {
    recommendations.push({
      tool: 'Composio',
      reason: 'D1（工具调用）得分较低，Composio 提供了丰富的工具集成能力',
    });
  }

  return recommendations;
}