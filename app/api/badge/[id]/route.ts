/**
 * GET /api/badge/[id]
 * 生成评测结果徽章 SVG
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getQuestionBank } from '@/lib/eval/session';
import { calculateDimensionScores, calculateTotalScoreAndLevel } from '@/lib/eval/scorer';
import { Level, LEVEL_CONFIG } from '@/lib/eval/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 等级对应的颜色
const LEVEL_COLORS: Record<Level, string> = {
  Unsafe: '#ef4444',     // 红色
  Basic: '#6b7280',      // 灰色
  Functional: '#3b82f6', // 蓝色
  Capable: '#10b981',    // 绿色
  Advanced: '#8b5cf6',   // 紫色
  Expert: '#f59e0b',     // 金色
};

/**
 * 生成 shields.io 风格的 SVG 徽章
 */
function generateBadge(level: Level, score: number, emoji: string): string {
  const bgColor = LEVEL_COLORS[level] || '#6b7280';
  
  // 徽章尺寸
  const width = 200;
  const height = 28;
  
  // 计算文本宽度（估算）
  const leftText = 'AgentDex Eval';
  const rightText = `${emoji} ${level} | ${score}/100`;
  
  // 左侧背景宽度（固定）
  const leftWidth = 85;
  // 右侧背景宽度（根据文本长度调整）
  const rightWidth = 115;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#555;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#666;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 左侧背景 -->
  <rect x="0" y="0" width="${leftWidth}" height="${height}" rx="4" ry="4" fill="url(#gradient)"/>
  
  <!-- 右侧背景 -->
  <rect x="${leftWidth}" y="0" width="${rightWidth}" height="${height}" rx="4" ry="4" fill="${bgColor}"/>
  
  <!-- 左侧圆角修正 -->
  <rect x="0" y="0" width="4" height="${height}" fill="url(#gradient)"/>
  
  <!-- 右侧圆角修正 -->
  <rect x="${leftWidth + rightWidth - 4}" y="0" width="4" height="${height}" fill="${bgColor}"/>
  
  <!-- 中间分隔 -->
  <rect x="${leftWidth - 4}" y="0" width="8" height="${height}" fill="${bgColor}"/>
  
  <!-- 左侧文本 -->
  <text x="${leftWidth / 2}" y="${height / 2}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif" 
        font-size="11" 
        font-weight="600"
        fill="#fff" 
        text-anchor="middle" 
        dominant-baseline="middle">
    ${leftText}
  </text>
  
  <!-- 右侧文本 -->
  <text x="${leftWidth + rightWidth / 2}" y="${height / 2}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif" 
        font-size="11" 
        font-weight="600"
        fill="#fff" 
        text-anchor="middle" 
        dominant-baseline="middle">
    ${rightText}
  </text>
</svg>`;
}

/**
 * 生成错误/未知徽章
 */
function generateErrorBadge(): string {
  const width = 200;
  const height = 28;
  const leftWidth = 85;
  const rightWidth = 115;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#555;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#666;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 左侧背景 -->
  <rect x="0" y="0" width="${leftWidth}" height="${height}" rx="4" ry="4" fill="url(#gradient)"/>
  
  <!-- 右侧背景 -->
  <rect x="${leftWidth}" y="0" width="${rightWidth}" height="${height}" rx="4" ry="4" fill="#6b7280"/>
  
  <!-- 左侧圆角修正 -->
  <rect x="0" y="0" width="4" height="${height}" fill="url(#gradient)"/>
  
  <!-- 右侧圆角修正 -->
  <rect x="${leftWidth + rightWidth - 4}" y="0" width="4" height="${height}" fill="#6b7280"/>
  
  <!-- 中间分隔 -->
  <rect x="${leftWidth - 4}" y="0" width="8" height="${height}" fill="#6b7280"/>
  
  <!-- 左侧文本 -->
  <text x="${leftWidth / 2}" y="${height / 2}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif" 
        font-size="11" 
        font-weight="600"
        fill="#fff" 
        text-anchor="middle" 
        dominant-baseline="middle">
    AgentDex Eval
  </text>
  
  <!-- 右侧文本 -->
  <text x="${leftWidth + rightWidth / 2}" y="${height / 2}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif" 
        font-size="11" 
        font-weight="600"
        fill="#fff" 
        text-anchor="middle" 
        dominant-baseline="middle">
    ⚠️ Unknown
  </text>
</svg>`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sessionId = id;

    // 获取会话
    const session = await getSession(sessionId);
    
    // 如果会话不存在或未完成，返回错误徽章
    if (!session || session.status !== 'completed') {
      const svg = generateErrorBadge();
      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // 获取题库
    const bank = await getQuestionBank();

    // 计算得分
    const dimensionScores = calculateDimensionScores(session, bank.questions);
    const { totalScore, level, levelEmoji } = calculateTotalScoreAndLevel(dimensionScores);

    // 生成徽章 SVG
    const svg = generateBadge(level, totalScore, levelEmoji);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating badge:', error);
    
    // 返回错误徽章而非 500
    const svg = generateErrorBadge();
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}