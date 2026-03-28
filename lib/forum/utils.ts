/**
 * Forum Utility Functions
 */

/**
 * Calculate hot score using Hacker News-style algorithm
 * Formula: (likes + comments * 2) / (hours + 2)^1.5
 * 
 * Design rationale:
 * - Comments have higher weight than likes (comments = 2x engagement)
 *   because commenting requires more thought than liking
 * - Time decay factor (hours + 2)^1.5 ensures fresh content has advantage
 * - The +2 offset prevents extremely new posts from having too high scores
 * - Exponent 1.5 provides moderate decay (score drops ~50% after 1 hour)
 * 
 * Example scores:
 * | likes | comments | hours | hot_score |
 * |-------|----------|-------|-----------|
 * | 100   | 50       | 0     | 71        |
 * | 10    | 5        | 0     | 7.1       |
 * | 10    | 5        | 24    | 0.15      |
 * 
 * @param likes - Number of likes on the post
 * @param comments - Number of comments on the post
 * @param createdAt - ISO date string when the post was created
 * @returns Hot score (higher = more popular relative to time)
 */
export function calculateHotScore(
  likes: number,
  comments: number,
  createdAt: string | Date
): number {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const now = new Date()
  const hoursSincePost = Math.max(0, (now.getTime() - date.getTime()) / 3600000)
  
  const engagementScore = likes + comments * 2
  const timeDecayFactor = Math.pow(hoursSincePost + 2, 1.5)
  
  return engagementScore / timeDecayFactor
}

/**
 * Format hot score for display
 * - Score >= 10: display as integer
 * - Score 1-10: display with 1 decimal
 * - Score < 1: display with 2 decimals
 * 
 * @param score - Hot score value
 * @returns Formatted string for display
 */
export function formatHotScore(score: number): string {
  if (score >= 10) {
    return Math.round(score).toString()
  } else if (score >= 1) {
    return score.toFixed(1)
  } else {
    return score.toFixed(2)
  }
}

/**
 * Get time ago string for a date
 * @param dateString - ISO date string
 * @returns Human-readable time ago string in Chinese
 */
export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-CN')
}