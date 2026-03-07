/**
 * GET /api/eval/status/[id]
 * 轮询接口 - 获取评测会话当前状态（SSE 降级方案）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getQuestionBank } from '@/lib/eval/session';
import { calculateDimensionScores } from '@/lib/eval/scorer';
import { Dimension, DIMENSION_LABELS } from '@/lib/eval/types';

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

    // 获取题库
    const bank = await getQuestionBank();

    // 获取当前题目信息
    const currentQuestionId = session.questions[session.current_question_index];
    const currentQuestion = bank.questions.find(q => q.id === currentQuestionId);

    // 计算当前维度得分
    const dimensionScores = calculateDimensionScores(session, bank.questions);

    // 过滤掉敏感信息后的事件
    const safeEvents = session.events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      // 不暴露具体答案和分数细节
    }));

    // 构建响应
    const response = {
      session_id: session.id,
      status: session.status === 'completed' ? 'completed' : 'active',
      current_question_index: session.current_question_index,
      total_questions: session.questions.length,
      current_question: currentQuestion ? {
        id: currentQuestion.id,
        dimension: currentQuestion.dimension,
        title: currentQuestion.title,
        type: currentQuestion.type,
        round: session.current_round,
        total_rounds: currentQuestion.rounds,
      } : null,
      scores_so_far: dimensionScores,
      dimension_labels: DIMENSION_LABELS,
      agent_info: {
        name: session.agent_info.name || 'Unknown Agent',
        framework: session.agent_info.framework,
        model: session.agent_info.model,
      },
      mode: session.mode,
      started_at: session.created_at,
      events: safeEvents,
      // 如果已完成，包含结果 URL
      result_url: session.status === 'completed' 
        ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/eval/result/${session.id}`
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting session status:', error);
    return NextResponse.json(
      { error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}