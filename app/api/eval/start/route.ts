/**
 * POST /api/eval/start
 * 开始新的评测会话
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, getQuestion } from '@/lib/eval/session';
import { getQuestionBank } from '@/lib/eval/session';
import type { StartEvalRequest, StartEvalResponse, QuestionPrompt } from '@/lib/eval/types';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体（可选）
    let body: StartEvalRequest = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // 请求体为空或解析失败，使用默认值
    }

    // 验证 mode 参数
    const mode = body.mode || 'full';
    if (!['full', 'quick', 'custom'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "full", "quick", or "custom"' },
        { status: 400 }
      );
    }

    // 创建会话
    const session = await createSession(mode, {
      name: body.agent_name,
      framework: body.agent_framework,
      model: body.model,
    });

    // 获取第一道题
    const bank = await getQuestionBank();
    const firstQuestionId = session.questions[0];
    const firstQuestion = bank.questions.find(q => q.id === firstQuestionId);

    if (!firstQuestion) {
      return NextResponse.json(
        { error: 'Failed to load first question' },
        { status: 500 }
      );
    }

    // 构建响应（不暴露 answer_key 和 scoring 字段）
    const questionPrompt: QuestionPrompt = {
      id: firstQuestion.id,
      dimension: firstQuestion.dimension,
      type: firstQuestion.type,
      title: firstQuestion.title,
      description: firstQuestion.prompt,
      round: 1,
      total_rounds: firstQuestion.rounds,
    };

    // 计算预估时间
    const estimatedMinutes = mode === 'quick' ? 2 : 5;

    const response: StartEvalResponse = {
      session_id: session.id,
      watch_url: session.watch_url || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/eval/live/${session.id}`,
      total_questions: session.questions.length,
      estimated_minutes: estimatedMinutes,
      first_question: questionPrompt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting eval:', error);
    return NextResponse.json(
      { error: 'Failed to start evaluation' },
      { status: 500 }
    );
  }
}