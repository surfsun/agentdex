'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface SessionStatus {
  session_id: string;
  status: 'active' | 'completed';
  current_question_index: number;
  total_questions: number;
  current_question: {
    id: string;
    dimension: string;
    title: string;
    type: string;
    round: number;
    total_rounds: number;
  } | null;
  scores_so_far: Record<string, number>;
  dimension_labels: Record<string, string>;
  agent_info: {
    name: string;
    framework?: string;
    model?: string;
  };
  mode: string;
  started_at: string;
  result_url: string | null;
}

// 维度标签样式（静态类名）
const DIMENSION_TAG_STYLES: Record<string, string> = {
  D1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  D2: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  D3: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  D4: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  D5: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  D6: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

// 维度进度条颜色（静态类名）
const DIMENSION_BAR_COLORS: Record<string, string> = {
  D1: 'bg-blue-500',
  D2: 'bg-purple-500',
  D3: 'bg-green-500',
  D4: 'bg-orange-500',
  D5: 'bg-red-500',
  D6: 'bg-gray-500',
};

// 维度图标
const DIMENSION_ICONS: Record<string, string> = {
  D1: '🔧',
  D2: '📋',
  D3: '🔍',
  D4: '🧠',
  D5: '⚠️',
  D6: '🛡️',
};

export default function EvalLivePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/eval/status/${sessionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('评测会话不存在');
        } else {
          setError('获取状态失败');
        }
        return;
      }
      const data = await response.json();
      setStatus(data);

      // 如果已完成，跳转到结果页
      if (data.status === 'completed' && data.result_url) {
        setTimeout(() => {
          router.push(`/eval/result/${sessionId}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    fetchStatus();

    // 每 2 秒轮询一次
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">🔄</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">加载评测状态...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">❌</span>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error || '未知错误'}</p>
        <a href="/eval" className="text-blue-600 hover:underline">
          返回评测入口
        </a>
      </div>
    );
  }

  const progress = status.total_questions > 0
    ? Math.round((status.current_question_index / status.total_questions) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Session 基本信息 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {status.agent_info.name || 'Unknown Agent'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {status.mode === 'quick' ? '快速评测' : '完整评测'} · 
              开始于 {new Date(status.started_at).toLocaleString('zh-CN')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {status.current_question_index}/{status.total_questions}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">题目</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>评测进度</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 当前题目展示 */}
      {status.current_question && status.status === 'active' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${DIMENSION_TAG_STYLES[status.current_question.dimension] || 'bg-gray-100 text-gray-700'}`}>
              {DIMENSION_ICONS[status.current_question.dimension]} {status.current_question.dimension}
            </span>
            {status.current_question.total_rounds > 1 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                轮次 {status.current_question.round}/{status.current_question.total_rounds}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {status.current_question.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            题目类型: {status.current_question.type}
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ⏳ 等待 Agent 提交答案...
            </p>
          </div>
        </div>
      )}

      {/* 完成状态 */}
      {status.status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
            评测已完成
          </h2>
          <p className="text-green-600 dark:text-green-500">
            正在跳转到结果页面...
          </p>
        </div>
      )}

      {/* 实时维度得分 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          实时维度得分
        </h3>
        <div className="space-y-4">
          {Object.entries(status.scores_so_far).map(([dim, score]) => (
            <div key={dim}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {DIMENSION_ICONS[dim]} {dim} - {status.dimension_labels[dim]}
                </span>
                <span className="text-gray-500 dark:text-gray-400">{score}/100</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${score > 0 ? DIMENSION_BAR_COLORS[dim] : 'bg-gray-300 dark:bg-gray-600'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        💡 此页面为只读观测页面，Agent 需通过 API 提交答案
      </div>
    </div>
  );
}