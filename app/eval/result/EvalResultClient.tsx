'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EvalResult {
  eval_id: string;
  agent_info: {
    name: string;
    framework?: string;
    model?: string;
    eval_date: string;
  };
  scores: {
    total: number;
    level: string;
    dimensions: Record<string, {
      score: number;
      label: string;
      questions_count: number;
      answered: number;
    }>;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: Array<{ tool: string; reason: string }>;
  };
  badge_url: string;
  result_url: string;
}

// 等级 emoji 映射
const LEVEL_EMOJIS: Record<string, string> = {
  Unsafe: '⚠️',
  Basic: '🌱',
  Functional: '⚙️',
  Capable: '⭐',
  Advanced: '🚀',
  Expert: '🧠',
};

// 维度颜色
const DIMENSION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  D1: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' },
  D2: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700' },
  D3: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700' },
  D4: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700' },
  D5: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
  D6: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-700' },
};

// 维度简短名称
const DIMENSION_SHORT_NAMES: Record<string, string> = {
  D1: '工具调用',
  D2: '规划执行',
  D3: '信息获取',
  D4: '上下文记忆',
  D5: '异常处理',
  D6: '安全边界',
};

interface EvalResultClientProps {
  sessionId: string;
}

// 雷达图组件
function RadarChart({ dimensions }: { dimensions: Record<string, { score: number }> }) {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const levels = 5;

  // 计算每个维度的角度（6个维度，均匀分布）
  const dimensionKeys = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];
  const angleStep = (2 * Math.PI) / 6;
  const startAngle = -Math.PI / 2; // 从顶部开始

  // 计算维度点坐标
  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 生成多边形路径
  const polygonPoints = dimensionKeys
    .map((key, i) => {
      const point = getPoint(i, dimensions[key]?.score || 0);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  // 生成背景网格
  const gridPolygons = [];
  for (let level = 1; level <= levels; level++) {
    const levelRadius = (level / levels) * radius;
    const points = dimensionKeys
      .map((_, i) => {
        const angle = startAngle + i * angleStep;
        return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
      })
      .join(' ');
    gridPolygons.push(points);
  }

  // 轴线
  const axisLines = dimensionKeys.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return {
      x2: center + radius * Math.cos(angle),
      y2: center + radius * Math.sin(angle),
    };
  });

  // 标签位置
  const labels = dimensionKeys.map((key, i) => {
    const angle = startAngle + i * angleStep;
    const labelRadius = radius + 25;
    return {
      key,
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
      name: DIMENSION_SHORT_NAMES[key],
      score: dimensions[key]?.score || 0,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 背景网格 */}
      {gridPolygons.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-gray-200 dark:text-gray-700"
        />
      ))}
      
      {/* 轴线 */}
      {axisLines.map((line, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={line.x2}
          y2={line.y2}
          stroke="currentColor"
          strokeWidth="1"
          className="text-gray-200 dark:text-gray-700"
        />
      ))}

      {/* 数据多边形 */}
      <polygon
        points={polygonPoints}
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500 dark:text-blue-400"
      />

      {/* 数据点 */}
      {dimensionKeys.map((key, i) => {
        const point = getPoint(i, dimensions[key]?.score || 0);
        return (
          <circle
            key={key}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-blue-600 dark:text-blue-400"
          />
        );
      })}

      {/* 标签 */}
      {labels.map((label) => (
        <g key={label.key}>
          <text
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600 dark:fill-gray-400"
          >
            {label.name}
          </text>
          <text
            x={label.x}
            y={label.y + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-blue-600 dark:fill-blue-400"
          >
            {label.score}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function EvalResultClient({ sessionId }: EvalResultClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/eval/result/${sessionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('评测结果不存在');
          } else if (response.status === 202) {
            // 评测仍在进行中，跳转到 live 页面
            router.push(`/eval/live/${sessionId}`);
            return;
          } else {
            setError('获取结果失败');
          }
          return;
        }
        const data = await response.json();
        setResult(data);
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId, router]);

  const copyBadgeCode = () => {
    const badgeCode = `<a href="${result?.result_url}"><img src="${result?.badge_url}" alt="AgentDex Score" /></a>`;
    navigator.clipboard.writeText(badgeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">加载评测结果...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 顶部：Agent 信息 + 综合评分 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {result.agent_info.name || 'Unknown Agent'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          评测时间: {new Date(result.agent_info.eval_date).toLocaleString('zh-CN')}
        </p>
        
        {/* 综合评分 */}
        <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl px-10 py-6 shadow-lg">
          <div className="text-5xl font-bold mb-1">
            {result.scores.total}<span className="text-2xl opacity-70">/100</span>
          </div>
          <div className="text-lg font-medium opacity-90">
            {LEVEL_EMOJIS[result.scores.level] || '⭐'} {result.scores.level}
          </div>
        </div>
      </div>

      {/* 主体：雷达图 + 维度得分 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* 左侧：雷达图 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex items-center justify-center">
          <RadarChart dimensions={result.scores.dimensions} />
        </div>

        {/* 右侧：维度得分卡片 */}
        <div className="space-y-3">
          {Object.entries(result.scores.dimensions).map(([key, dim]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border-2 ${DIMENSION_COLORS[key]?.bg} ${DIMENSION_COLORS[key]?.border}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`font-medium ${DIMENSION_COLORS[key]?.text}`}>
                  {key} - {dim.label}
                </span>
                <span className={`font-bold ${DIMENSION_COLORS[key]?.text}`}>
                  {dim.score}/100
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 dark:bg-blue-400 transition-all"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                题目: {dim.answered}/{dim.questions_count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 能力洞察 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          💡 能力洞察
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 优势 */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">
              ✅ 优势
            </h3>
            <ul className="space-y-1">
              {result.insights.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-green-600 dark:text-green-500">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
          
          {/* 弱项 */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
              ⚠️ 待提升
            </h3>
            <ul className="space-y-1">
              {result.insights.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-orange-600 dark:text-orange-500">
                  • {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 推荐工具 */}
      {result.insights.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🛠️ 推荐工具
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.insights.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  {rec.tool}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 徽章区块 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🏆 分享徽章
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* 徽章预览 */}
          <div className="flex-1 flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold">
              AgentDex Score: {result.scores.total} {LEVEL_EMOJIS[result.scores.level]}
            </div>
          </div>
          
          {/* 复制按钮 */}
          <div className="flex-shrink-0">
            <button
              onClick={copyBadgeCode}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? '✓ 已复制' : '📋 复制嵌入代码'}
            </button>
          </div>
        </div>
        
        {/* 嵌入代码 */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
            {`<a href="${result.result_url}"><img src="${result.badge_url}" alt="AgentDex Score" /></a>`}
          </code>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="mt-8 text-center">
        <a
          href="/eval"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          开始新的评测
        </a>
      </div>
    </div>
  );
}