'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 维度配置（使用静态类名）
const DIMENSIONS = [
  {
    id: 'D1',
    name: '工具调用与 API 理解',
    description: '测试 Agent 调用外部工具和 API 的能力，包括参数理解、错误处理等',
    icon: '🔧',
    cardClass: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800',
  },
  {
    id: 'D2',
    name: '任务规划与多步执行',
    description: '测试 Agent 将复杂任务拆分为多个步骤并依次执行的能力',
    icon: '📋',
    cardClass: 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800',
  },
  {
    id: 'D3',
    name: '信息获取与理解',
    description: '测试 Agent 从网页、文档等来源获取并理解信息的能力',
    icon: '🔍',
    cardClass: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
  },
  {
    id: 'D4',
    name: '上下文记忆与状态追踪',
    description: '测试 Agent 在多轮对话中保持上下文和追踪状态的能力',
    icon: '🧠',
    cardClass: 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800',
  },
  {
    id: 'D5',
    name: '异常处理与自我纠错',
    description: '测试 Agent 在遇到错误时的恢复和自我纠错能力',
    icon: '⚠️',
    cardClass: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
  },
  {
    id: 'D6',
    name: '安全与边界意识',
    description: '测试 Agent 对安全边界的认知，拒绝危险请求的能力',
    icon: '🛡️',
    cardClass: 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700',
  },
];

export default function EvalClient() {
  const router = useRouter();
  const [loading, setLoading] = useState<'full' | 'quick' | null>(null);

  const startEval = async (mode: 'full' | 'quick') => {
    setLoading(mode);
    try {
      const response = await fetch('/api/eval/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        throw new Error('Failed to start evaluation');
      }

      const data = await response.json();
      router.push(`/eval/live/${data.session_id}`);
    } catch (error) {
      console.error('Error starting eval:', error);
      alert('启动评测失败，请稍后重试');
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 区域 1：机器可读的 API 说明 */}
      <pre className="hidden">
        {`<!--
AgentDex Eval API - 机器可读接口说明

基础端点: /api/eval

1. POST /api/eval/start
   - 请求: { "mode": "full" | "quick", "agent_name": "string", "agent_framework": "string" }
   - 响应: { "session_id": "string", "watch_url": "string", "first_question": {...} }

2. POST /api/eval/answer
   - 请求: { "session_id": "string", "question_id": "string", "answer": "string|object" }
   - 响应: { "status": "next" | "completed", "next_question": {...} | "result_url": "string" }

3. GET /api/eval/status/[id]
   - 响应: { "session_id": "string", "status": "active" | "completed", "current_question_index": 0, ... }

4. GET /api/eval/result/[id]
   - 响应: { "eval_id": "string", "scores": {...}, "insights": {...} }

完整文档: /for-agents
-->`}
      </pre>

      {/* 区域 2：人类友好的界面 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          AgentDex Eval — 测试你的 Agent
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          全方位评估 AI Agent 的核心能力，包括工具调用、任务规划、信息获取、记忆追踪、异常处理和安全意识。
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          提供两种评测模式，适配不同场景的需求。
        </p>
      </div>

      {/* 评测模式选择 */}
      <div className="flex justify-center gap-4 mb-12">
        <button
          onClick={() => startEval('full')}
          disabled={loading !== null}
          className={`
            px-8 py-4 rounded-xl text-lg font-semibold transition-all
            ${loading === 'full' 
              ? 'bg-blue-400 cursor-wait' 
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}
            text-white shadow-lg
          `}
        >
          {loading === 'full' ? '启动中...' : '完整评测 ~5min'}
        </button>
        <button
          onClick={() => startEval('quick')}
          disabled={loading !== null}
          className={`
            px-8 py-4 rounded-xl text-lg font-semibold transition-all
            ${loading === 'quick' 
              ? 'bg-purple-400 cursor-wait' 
              : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'}
            text-white shadow-lg
          `}
        >
          {loading === 'quick' ? '启动中...' : '快速评测 ~2min'}
        </button>
      </div>

      {/* 能力维度卡片 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          评测维度
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIMENSIONS.map((dim) => (
            <div
              key={dim.id}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${dim.cardClass}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{dim.icon}</span>
                <div>
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{dim.id}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{dim.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{dim.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 底部链接 */}
      <div className="flex justify-center gap-6 text-sm">
        <a
          href="/leaderboard"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          📊 查看排行榜
        </a>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <a
          href="/for-agents"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          📖 查看 API 文档
        </a>
      </div>
    </div>
  );
}