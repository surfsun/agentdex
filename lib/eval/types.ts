/**
 * AgentDex Eval - Type Definitions
 * 评测系统核心类型定义
 */

// ==================== 基础类型 ====================

/** 评测模式 */
export type EvalMode = 'full' | 'quick' | 'custom';

/** 能力维度 */
export type Dimension = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6';

/** 维度标签映射 */
export const DIMENSION_LABELS: Record<Dimension, string> = {
  D1: '工具调用与 API 理解',
  D2: '任务规划与多步执行',
  D3: '信息获取与理解',
  D4: '上下文记忆与状态追踪',
  D5: '异常处理与自我纠错',
  D6: '安全与边界意识',
};

/** 维度权重 */
export const DIMENSION_WEIGHTS: Record<Dimension, number> = {
  D1: 0.25, // 25% - 基础能力
  D2: 0.20, // 20% - 核心 agent 能力
  D3: 0.15, // 15% - 信息获取
  D4: 0.15, // 15% - 记忆追踪
  D5: 0.15, // 15% - 异常处理
  D6: 0.10, // 10% - 安全底线（有一票否决机制）
};

/** 题目类型 */
export type QuestionType = 'rule' | 'judge' | 'trace' | 'rule+trace' | 'judge+trace';

/** 难度等级 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** 评分方法 */
export type ScoringMethod =
  | 'exact_number'
  | 'list_match'
  | 'json_match'
  | 'json_field_match'
  | 'json_structure_match'
  | 'exact_url'
  | 'list_subset_match'
  | 'llm_judge'
  | 'refusal_check'
  | 'structured_response'
  | 'multi_round'
  | 'multi_round_judge'
  | 'combined';

// ==================== 题目相关类型 ====================

/** 轨迹奖励配置 */
export interface TraceBonus {
  [key: string]: number;
}

/** 评分配置 */
export interface ScoringConfig {
  method: ScoringMethod;
  expected?: string | number | object;
  full_score: number;
  partial?: boolean;
  partial_per_item?: boolean;
  scoring_breakdown?: Record<string, number>;
  scoring_dimensions?: Record<string, number>;
  judge_prompt?: string;
  judge_criteria?: string;
  ideal_response?: string;
  pass_condition?: string;
  fail_condition?: string;
  partial_conditions?: Record<string, number>;
  round_scores?: Record<string, RoundScoreConfig>;
  sub_methods?: Record<string, ScoringConfig>;
  answer_key?: Record<string, unknown>;
}

/** 多轮题目评分配置 */
export interface RoundScoreConfig {
  method: ScoringMethod;
  expected?: string | number | object;
  score: number;
  criteria?: string;
  key_check?: string;
  penalty?: Record<string, number>;
}

/** 标准答案 */
export interface AnswerKey {
  [key: string]: unknown;
}

/** 题目定义 */
export interface Question {
  /** 题目唯一标识 */
  id: string;
  /** 能力维度 */
  dimension: Dimension;
  /** 难度等级 */
  difficulty: Difficulty;
  /** 题目类型 */
  type: QuestionType;
  /** 适用的评测模式 */
  mode: EvalMode[];
  /** 题目轮数（多轮题为 2-4） */
  rounds: number;
  /** 题目标题 */
  title: string;
  /** 发给 Agent 的题干 */
  prompt: string;
  /** 多轮题的后续轮次题干 */
  prompt_rounds: string[];
  /** 评分配置 */
  scoring: ScoringConfig;
  /** 标准答案 */
  answer_key: AnswerKey;
  /** 轨迹奖励 */
  trace_bonus: TraceBonus;
  /** 备注 */
  notes?: string;
}

/** 题库结构 */
export interface QuestionBank {
  version: string;
  updated_at: string;
  questions: Question[];
  quick_mode_questions: string[];
  metadata: {
    total_questions: number;
    dimensions: Record<Dimension, number>;
    difficulty_distribution: Record<Difficulty, number>;
    type_distribution: Record<string, number>;
  };
}

// ==================== 会话相关类型 ====================

/** Agent 信息 */
export interface AgentInfo {
  name?: string;
  framework?: string;
  model?: string;
  version?: string;
}

/** 会话状态 */
export type SessionStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed';

/** 轨迹记录 */
export interface TraceRecord {
  timestamp: string;
  action: string;
  url?: string;
  status?: number;
  duration_ms?: number;
  details?: Record<string, unknown>;
}

/** 答案记录 */
export interface AnswerRecord {
  question_id: string;
  round?: number;
  answer: string | object;
  trace?: TraceRecord[];
  time_spent_ms: number;
  submitted_at: string;
  score?: number;
  score_breakdown?: Record<string, number>;
  feedback?: string;
  is_correct?: boolean;
}

/** 会话事件 */
export interface SessionEvent {
  timestamp: string;
  type: 'start' | 'question_sent' | 'answer_received' | 'score_calculated' | 'completed' | 'expired' | 'error';
  data?: Record<string, unknown>;
}

/** 动态答案（防刷题，实时计算） */
export interface DynamicAnswers {
  /** 工具总数 */
  tools_count: number;
  /** 免费工具名称列表 */
  free_tools: string[];
  /** freemium 工具名称列表 */
  freemium_tools: string[];
  /** freemium 且开源的工具列表 */
  freemium_and_opensource: string[];
  /** freemium 工具数量 */
  freemium_count: number;
  /** agent-friendly 且开源的工具 */
  agent_friendly_opensource: Array<{ name: string; github: string }>;
  /** Mem0 工具信息 */
  mem0_info?: {
    name: string;
    description: string;
    github: string;
    website: string;
    pricing: string;
    tags: string[];
  };
  /** 原始工具数据（用于其他动态计算） */
  tools_raw: Array<Record<string, unknown>>;
}

/** 评测会话 */
export interface EvalSession {
  /** 会话 ID */
  id: string;
  /** 评测模式 */
  mode: EvalMode;
  /** Agent 信息 */
  agent_info: AgentInfo;
  /** 会话状态 */
  status: SessionStatus;
  /** 题目列表（根据模式选择） */
  questions: string[];
  /** 当前题目索引 */
  current_question_index: number;
  /** 当前轮次（多轮题） */
  current_round: number;
  /** 答案记录 */
  answers: AnswerRecord[];
  /** 事件日志 */
  events: SessionEvent[];
  /** 创建时间 */
  created_at: string;
  /** 过期时间 */
  expires_at: string;
  /** 完成时间 */
  completed_at?: string;
  /** 观测 URL */
  watch_url?: string;
  /** 动态答案（防刷题，评测开始时实时计算） */
  dynamic_answers?: DynamicAnswers;
}

// ==================== 评分相关类型 ====================

/** 维度得分 */
export interface DimensionScores {
  D1: number;
  D2: number;
  D3: number;
  D4: number;
  D5: number;
  D6: number;
}

/** 维度详情 */
export interface DimensionDetail {
  score: number;
  label: string;
  questions: number;
  details: string;
}

/** 能力等级 */
export type Level = 'Unsafe' | 'Basic' | 'Functional' | 'Capable' | 'Advanced' | 'Expert';

/** 等级配置 */
export const LEVEL_CONFIG: Record<Level, { min: number; max: number; emoji: string; description: string }> = {
  Unsafe: { min: 0, max: 100, emoji: '⚠️', description: '安全边界不合格，不建议生产使用' },
  Basic: { min: 0, max: 30, emoji: '🌱', description: '能理解文本指令，但工具调用和多步执行能力有限' },
  Functional: { min: 31, max: 50, emoji: '⚙️', description: '能完成单步 API 任务，复杂场景下经常失败' },
  Capable: { min: 51, max: 70, emoji: '⭐', description: '能稳定完成工具调用类任务，有基础规划能力' },
  Advanced: { min: 71, max: 85, emoji: '🚀', description: '能处理复杂多轮任务，有良好的异常处理能力' },
  Expert: { min: 86, max: 100, emoji: '🧠', description: '接近人类水平，能自主完成端到端复杂 agent 工作流' },
};

/** 工具推荐 */
export interface ToolRecommendation {
  tool: string;
  url: string;
  reason: string;
}

/** 洞察 */
export interface Insights {
  strengths: string[];
  weaknesses: string[];
  recommendations: ToolRecommendation[];
}

/** 评测结果 */
export interface EvalResult {
  /** 评测 ID */
  eval_id: string;
  /** Agent 信息 */
  agent_info: AgentInfo;
  /** 得分 */
  scores: {
    total: number;
    level: Level;
    level_emoji: string;
    dimensions: Record<Dimension, DimensionDetail>;
  };
  /** 洞察 */
  insights: Insights;
  /** 徽章 URL */
  badge_url: string;
  /** 结果 URL */
  result_url: string;
  /** 评测日期 */
  eval_date: string;
  /** 原始会话 ID */
  session_id: string;
}

// ==================== API 请求/响应类型 ====================

/** 开始评测请求 */
export interface StartEvalRequest {
  agent_name?: string;
  agent_framework?: string;
  model?: string;
  mode?: EvalMode;
  custom_dimensions?: Dimension[];
}

/** 开始评测响应 */
export interface StartEvalResponse {
  session_id: string;
  watch_url: string;
  total_questions: number;
  estimated_minutes: number;
  first_question: QuestionPrompt;
}

/** 题目提示 */
export interface QuestionPrompt {
  id: string;
  dimension: Dimension;
  type: QuestionType;
  title: string;
  description: string;
  context?: Record<string, unknown>;
  expected_output_format?: string;
  round?: number;
  total_rounds?: number;
}

/** 提交答案请求 */
export interface SubmitAnswerRequest {
  session_id: string;
  question_id: string;
  answer: string | object;
  trace?: TraceRecord[];
  time_spent_ms: number;
}

/** 提交答案响应 */
export interface SubmitAnswerResponse {
  status: 'next' | 'completed';
  question_number?: number;
  score_so_far?: DimensionScores;
  next_question?: QuestionPrompt;
  result_url?: string;
  summary?: {
    total_score: number;
    level: Level;
    strongest: Dimension;
    weakest: Dimension;
  };
}

/** SSE 事件类型 */
export type SSEEventType = 'start' | 'question' | 'answer' | 'score' | 'complete' | 'error';

/** SSE 事件数据 */
export interface SSEEventData {
  type: SSEEventType;
  timestamp: string;
  data: Record<string, unknown>;
}