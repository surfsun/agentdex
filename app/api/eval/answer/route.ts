/**
 * POST /api/eval/answer
 * 提交答案并获取下一题或结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, addAnswer, moveToNextQuestion, getQuestion, getQuestionBank } from '@/lib/eval/session';
import { scoreAnswer } from '@/lib/eval/scorer';
import { calculateDimensionScores, calculateTotalScoreAndLevel } from '@/lib/eval/scorer';
import type { SubmitAnswerRequest, SubmitAnswerResponse, AnswerRecord, QuestionPrompt } from '@/lib/eval/types';

export async function POST(request: NextRequest) {
  try {
    const body: SubmitAnswerRequest = await request.json();

    // 验证必需参数
    if (!body.session_id || !body.question_id) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, question_id' },
        { status: 400 }
      );
    }

    // 获取会话
    const session = await getSession(body.session_id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // 检查会话是否过期
    if (session.status === 'expired') {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 410 }
      );
    }

    // 检查会话是否已完成
    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // 验证当前题目
    const currentQuestionId = session.questions[session.current_question_index];
    if (body.question_id !== currentQuestionId) {
      return NextResponse.json(
        { error: `Expected question ${currentQuestionId}, got ${body.question_id}` },
        { status: 400 }
      );
    }

    // 获取题目和题库
    const question = await getQuestion(body.question_id);
    const bank = await getQuestionBank();

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 500 }
      );
    }

    // 计算分数
    const answerRecord: AnswerRecord = {
      question_id: body.question_id,
      answer: body.answer,
      trace: body.trace,
      time_spent_ms: body.time_spent_ms,
      submitted_at: new Date().toISOString(),
    };

    const scoreResult = scoreAnswer(question, answerRecord);
    answerRecord.score = scoreResult.score;
    answerRecord.score_breakdown = scoreResult.breakdown;
    answerRecord.feedback = scoreResult.feedback;
    answerRecord.is_correct = scoreResult.score >= question.scoring.full_score * 0.8;

    // 记录答案
    await addAnswer(session.id, answerRecord);

    // 移动到下一题
    const { session: updatedSession, completed } = await moveToNextQuestion(session.id);

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // 计算当前维度得分
    const dimensionScores = calculateDimensionScores(updatedSession, bank.questions);

    // 构建响应
    if (completed) {
      // 评测完成
      const { totalScore, level } = calculateTotalScoreAndLevel(dimensionScores);

      // 找出最强和最弱维度
      const sortedDimensions = Object.entries(dimensionScores)
        .sort((a, b) => b[1] - a[1]);

      const strongest = sortedDimensions[0][0] as string;
      const weakest = sortedDimensions[sortedDimensions.length - 1][0] as string;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      const response: SubmitAnswerResponse = {
        status: 'completed',
        result_url: `${baseUrl}/eval/result/${session.id}`,
        summary: {
          total_score: totalScore,
          level: level,
          strongest: strongest as any,
          weakest: weakest as any,
        },
      };

      return NextResponse.json(response);
    } else {
      // 还有下一题
      const nextQuestionId = updatedSession.questions[updatedSession.current_question_index];
      const nextQuestion = bank.questions.find(q => q.id === nextQuestionId);

      if (!nextQuestion) {
        return NextResponse.json(
          { error: 'Failed to load next question' },
          { status: 500 }
        );
      }

      const nextQuestionPrompt: QuestionPrompt = {
        id: nextQuestion.id,
        dimension: nextQuestion.dimension,
        type: nextQuestion.type,
        title: nextQuestion.title,
        description: nextQuestion.prompt,
        round: 1,
        total_rounds: nextQuestion.rounds,
      };

      const response: SubmitAnswerResponse = {
        status: 'next',
        question_number: updatedSession.current_question_index + 1,
        score_so_far: dimensionScores,
        next_question: nextQuestionPrompt,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}