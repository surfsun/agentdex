/**
 * AgentDex Eval - Session Management
 * 评测会话管理模块 - Supabase 版本
 */

import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import {
  EvalSession,
  EvalMode,
  AgentInfo,
  AnswerRecord,
  SessionEvent,
  Dimension,
  QuestionBank,
  Question,
} from './types';

// 直接导入内联题库数据（解决 Vercel 部署路径问题）
import { questionBankData } from './questions';

// ==================== 常量配置 ====================

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const questionBank: QuestionBank = questionBankData as unknown as QuestionBank;

// ==================== 工具函数 ====================

/**
 * 加载题库
 */
async function loadQuestionBank(): Promise<QuestionBank> {
  return questionBank;
}

/**
 * 根据评测模式选择题目
 */
function selectQuestions(
  bank: QuestionBank,
  mode: EvalMode,
  customDimensions?: Dimension[]
): string[] {
  if (mode === 'quick') {
    return bank.quick_mode_questions;
  }

  if (mode === 'custom' && customDimensions?.length) {
    return bank.questions
      .filter(q => customDimensions.includes(q.dimension))
      .map(q => q.id);
  }

  // full mode - 所有题目
  return bank.questions.map(q => q.id);
}

/**
 * 生成会话 ID
 */
function generateSessionId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = randomUUID().slice(0, 5);
  return `eval_${dateStr}_${randomPart}`;
}

/**
 * 生成观测 URL
 */
function generateWatchUrl(sessionId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.agentdex.top';
  return `${baseUrl}/eval/live/${sessionId}`;
}

// ==================== 主要 API 函数 ====================

/**
 * 创建新的评测会话
 */
export async function createSession(
  mode: EvalMode = 'full',
  agentInfo: AgentInfo = {}
): Promise<EvalSession> {
  const bank = await loadQuestionBank();
  const sessionId = generateSessionId();
  const now = new Date();

  const session: EvalSession = {
    id: sessionId,
    mode,
    agent_info: agentInfo,
    status: 'pending',
    questions: selectQuestions(bank, mode),
    current_question_index: 0,
    current_round: 1,
    answers: [],
    events: [
      {
        timestamp: now.toISOString(),
        type: 'start',
        data: { mode, agent_info: agentInfo },
      },
    ],
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    watch_url: generateWatchUrl(sessionId),
  };

  // 更新状态为进行中
  session.status = 'in_progress';
  session.events.push({
    timestamp: new Date().toISOString(),
    type: 'question_sent',
    data: { question_id: session.questions[0], index: 0 },
  });

  // 写入 Supabase
  const { error } = await supabaseAdmin
    .from('eval_sessions')
    .insert({
      id: session.id,
      mode: session.mode,
      agent_info: session.agent_info,
      status: session.status,
      questions: session.questions,
      current_question_index: session.current_question_index,
      current_round: session.current_round,
      answers: session.answers,
      events: session.events,
      dynamic_answers: session.dynamic_answers || {},
      created_at: session.created_at,
      expires_at: session.expires_at,
      watch_url: session.watch_url,
    });

  if (error) {
    console.error('[Eval] Failed to create session in Supabase:', error);
    throw error;
  }

  return session;
}

/**
 * 获取会话
 */
export async function getSession(sessionId: string): Promise<EvalSession | null> {
  const { data, error } = await supabaseAdmin
    .from('eval_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  // 检查是否过期
  if (new Date(data.expires_at) < new Date()) {
    await supabaseAdmin
      .from('eval_sessions')
      .update({ status: 'expired' })
      .eq('id', sessionId);

    return {
      ...data,
      status: 'expired',
    } as EvalSession;
  }

  return data as EvalSession;
}

/**
 * 更新会话
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<EvalSession>
): Promise<EvalSession | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const { error } = await supabaseAdmin
    .from('eval_sessions')
    .update({
      ...updates,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[Eval] Failed to update session:', error);
    return null;
  }

  return getSession(sessionId);
}

/**
 * 添加答案记录
 */
export async function addAnswer(
  sessionId: string,
  answer: AnswerRecord
): Promise<EvalSession | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const updatedAnswers = [...session.answers, answer];

  const { error } = await supabaseAdmin
    .from('eval_sessions')
    .update({
      answers: updatedAnswers,
      events: [
        ...session.events,
        {
          timestamp: new Date().toISOString(),
          type: 'answer_received',
          data: { question_id: answer.question_id, round: answer.round },
        },
      ],
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[Eval] Failed to add answer:', error);
    return null;
  }

  return getSession(sessionId);
}

/**
 * 添加事件
 */
export async function addEvent(
  sessionId: string,
  type: SessionEvent['type'],
  data?: Record<string, unknown>
): Promise<EvalSession | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const event: SessionEvent = {
    timestamp: new Date().toISOString(),
    type,
    data,
  };

  const { error } = await supabaseAdmin
    .from('eval_sessions')
    .update({
      events: [...session.events, event],
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[Eval] Failed to add event:', error);
    return null;
  }

  return getSession(sessionId);
}

/**
 * 移动到下一题
 */
export async function moveToNextQuestion(
  sessionId: string
): Promise<{ session: EvalSession | null; completed: boolean }> {
  const session = await getSession(sessionId);
  if (!session) {
    return { session: null, completed: false };
  }

  const nextIndex = session.current_question_index + 1;

  if (nextIndex >= session.questions.length) {
    // 评测完成
    const { error } = await supabaseAdmin
      .from('eval_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        events: [
          ...session.events,
          {
            timestamp: new Date().toISOString(),
            type: 'completed',
            data: { total_questions: session.questions.length },
          },
        ],
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[Eval] Failed to complete session:', error);
    }

    const completed = await getSession(sessionId);
    return { session: completed, completed: true };
  }

  // 移动到下一题
  const { error } = await supabaseAdmin
    .from('eval_sessions')
    .update({
      current_question_index: nextIndex,
      current_round: 1,
      events: [
        ...session.events,
        {
          timestamp: new Date().toISOString(),
          type: 'question_sent',
          data: { question_id: session.questions[nextIndex], index: nextIndex },
        },
      ],
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[Eval] Failed to move to next question:', error);
    return { session: null, completed: false };
  }

  const updated = await getSession(sessionId);
  return { session: updated, completed: false };
}

/**
 * 更新当前轮次（多轮题）
 */
export async function updateRound(
  sessionId: string,
  round: number
): Promise<EvalSession | null> {
  const { error } = await supabaseAdmin
    .from('eval_sessions')
    .update({ current_round: round })
    .eq('id', sessionId);

  if (error) {
    console.error('[Eval] Failed to update round:', error);
    return null;
  }

  return getSession(sessionId);
}

/**
 * 清理过期会话
 */
export async function expireSessions(): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('eval_sessions')
    .update({ status: 'expired' })
    .lt('expires_at', now)
    .neq('status', 'expired')
    .neq('status', 'completed')
    .select('id');

  if (error) {
    console.error('[Eval] Failed to expire sessions:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * 获取题目信息
 */
export async function getQuestion(questionId: string): Promise<Question | null> {
  const bank = await loadQuestionBank();
  return bank.questions.find(q => q.id === questionId) || null;
}

/**
 * 获取题库
 */
export async function getQuestionBank(): Promise<QuestionBank> {
  return loadQuestionBank();
}

/**
 * 标记会话失败
 */
export async function failSession(
  sessionId: string,
  reason: string
): Promise<EvalSession | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const { error } = await supabaseAdmin
    .from('eval_sessions')
    .update({
      status: 'failed',
      events: [
        ...session.events,
        {
          timestamp: new Date().toISOString(),
          type: 'error',
          data: { reason },
        },
      ],
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[Eval] Failed to mark session as failed:', error);
    return null;
  }

  return getSession(sessionId);
}