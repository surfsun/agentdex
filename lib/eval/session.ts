/**
 * AgentDex Eval - Session Management
 * 评测会话管理模块
 */

import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import {
  EvalSession,
  EvalMode,
  AgentInfo,
  SessionStatus,
  AnswerRecord,
  SessionEvent,
  Dimension,
  QuestionBank,
  Question,
  DynamicAnswers,
} from './types';

// 直接导入题库（解决 Vercel 部署路径问题）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const questionBankData = require('@/data/eval/questions.json');

// ==================== 常量配置 ====================

const SESSION_DIR = join(process.cwd(), 'data', 'eval', 'sessions');
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ==================== 内存存储 ====================

const sessions = new Map<string, EvalSession>();
const questionBank: QuestionBank = questionBankData as unknown as QuestionBank;

// ==================== 工具函数 ====================

/**
 * 确保会话目录存在
 */
async function ensureSessionDir(): Promise<void> {
  try {
    await access(SESSION_DIR);
  } catch {
    await mkdir(SESSION_DIR, { recursive: true });
  }
}

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

// ==================== 持久化函数 ====================

/**
 * 获取会话文件路径
 */
function getSessionFilePath(sessionId: string): string {
  return join(SESSION_DIR, `${sessionId}.json`);
}

/**
 * 保存会话到文件
 */
async function persistSession(session: EvalSession): Promise<void> {
  await ensureSessionDir();
  const filePath = getSessionFilePath(session.id);
  await writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * 从文件加载会话
 */
async function loadSessionFromFile(sessionId: string): Promise<EvalSession | null> {
  try {
    const filePath = getSessionFilePath(sessionId);
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as EvalSession;
  } catch {
    return null;
  }
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

  // 存储到内存和文件
  sessions.set(sessionId, session);
  await persistSession(session);

  return session;
}

/**
 * 获取会话
 */
export async function getSession(sessionId: string): Promise<EvalSession | null> {
  // 先从内存获取
  let session: EvalSession | null | undefined = sessions.get(sessionId) ?? null;

  if (!session) {
    // 从文件加载
    session = await loadSessionFromFile(sessionId);
    if (session) {
      sessions.set(sessionId, session);
    }
  }

  // 检查是否过期
  if (session && new Date(session.expires_at) < new Date()) {
    session.status = 'expired';
    session.events.push({
      timestamp: new Date().toISOString(),
      type: 'expired',
      data: { reason: 'session_expired' },
    });
    await persistSession(session);
  }

  return session ?? null;
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

  const updated = { ...session, ...updates };
  sessions.set(sessionId, updated);
  await persistSession(updated);

  return updated;
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

  const updated = {
    ...session,
    answers: updatedAnswers,
    events: [
      ...session.events,
      {
        timestamp: new Date().toISOString(),
        type: 'answer_received' as const,
        data: { question_id: answer.question_id, round: answer.round },
      },
    ],
  };

  sessions.set(sessionId, updated);
  await persistSession(updated);

  return updated;
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

  const updated = {
    ...session,
    events: [...session.events, event],
  };

  sessions.set(sessionId, updated);
  await persistSession(updated);

  return updated;
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
    const completed = {
      ...session,
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
      events: [
        ...session.events,
        {
          timestamp: new Date().toISOString(),
          type: 'completed' as const,
          data: { total_questions: session.questions.length },
        },
      ],
    };

    sessions.set(sessionId, completed);
    await persistSession(completed);

    return { session: completed, completed: true };
  }

  // 移动到下一题
  const updated = {
    ...session,
    current_question_index: nextIndex,
    current_round: 1,
    events: [
      ...session.events,
      {
        timestamp: new Date().toISOString(),
        type: 'question_sent' as const,
        data: { question_id: session.questions[nextIndex], index: nextIndex },
      },
    ],
  };

  sessions.set(sessionId, updated);
  await persistSession(updated);

  return { session: updated ?? null, completed: false };
}

/**
 * 更新当前轮次（多轮题）
 */
export async function updateRound(
  sessionId: string,
  round: number
): Promise<EvalSession | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const updated = {
    ...session,
    current_round: round,
  };

  sessions.set(sessionId, updated);
  await persistSession(updated);

  return updated;
}

/**
 * 清理过期会话
 */
export async function expireSessions(): Promise<number> {
  let expiredCount = 0;
  const now = new Date();

  for (const [sessionId, session] of sessions) {
    if (new Date(session.expires_at) < now && session.status !== 'expired') {
      session.status = 'expired';
      session.events.push({
        timestamp: now.toISOString(),
        type: 'expired',
        data: { reason: 'cleanup' },
      });
      await persistSession(session);
      expiredCount++;
    }
  }

  return expiredCount;
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

  const updated = {
    ...session,
    status: 'failed' as const,
    events: [
      ...session.events,
      {
        timestamp: new Date().toISOString(),
        type: 'error' as const,
        data: { reason },
      },
    ],
  };

  sessions.set(sessionId, updated);
  await persistSession(updated);

  return updated;
}