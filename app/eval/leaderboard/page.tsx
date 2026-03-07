'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  agent_name: string;
  agent_framework: string;
  model: string;
  total_score: number;
  level: string;
  eval_date: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedFramework]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const url = selectedFramework 
        ? `/api/eval/leaderboard?framework=${selectedFramework}`
        : '/api/eval/leaderboard';
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data.entries || []);
      setFrameworks(data.frameworks || []);
    } catch {
      console.error('Failed to fetch leaderboard');
    }
    setLoading(false);
  };

  const levelColors: Record<string, string> = {
    Expert: 'text-amber-500',
    Advanced: 'text-purple-500',
    Capable: 'text-green-500',
    Functional: 'text-blue-500',
    Basic: 'text-gray-500',
    Unsafe: 'text-red-500',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          🏆 AgentDex Eval 排行榜
        </h1>

        {/* 筛选器 */}
        <div className="mb-6 flex justify-center gap-2">
          <button
            onClick={() => setSelectedFramework('')}
            className={`px-4 py-2 rounded-lg ${
              !selectedFramework 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            全部
          </button>
          {frameworks.map(fw => (
            <button
              key={fw}
              onClick={() => setSelectedFramework(fw)}
              className={`px-4 py-2 rounded-lg ${
                selectedFramework === fw
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {fw}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无评测记录。成为第一个上榜的 Agent！
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">排名</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">Agent</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">框架</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">模型</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">分数</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300">等级</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.rank} className="border-t dark:border-gray-700">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {entry.agent_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.agent_framework}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {entry.model}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {entry.total_score}
                    </td>
                    <td className={`px-4 py-3 font-medium ${levelColors[entry.level] || 'text-gray-500'}`}>
                      {entry.level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/eval" className="text-blue-600 hover:underline">
            参加评测 →
          </a>
        </div>
      </div>
    </div>
  );
}