/**
 * Forum Utility Functions
 */

/**
 * Calculate hot score using Hacker News-style algorithm with freshness boost
 * Formula: (likes + comments * 2 + freshBoost) / (hours + 2)^1.5
 * 
 * Freshness boost: max(0, 3 - hours) gives new posts (under 3 hours) an initial score
 * This ensures new content appears in hot lists without requiring initial engagement,
 * but the boost decays over time so quality content must earn real engagement to stay ranked.
 * 
 * Design rationale:
 * - Comments have higher weight than likes (comments = 2x engagement)
 *   because commenting requires more thought than liking
 * - Freshness boost (3 - hours, max 0) gives new posts visibility for ~3 hours
 * - Time decay factor (hours + 2)^1.5 ensures fresh content has advantage
 * - The +2 offset prevents extremely new posts from having too high scores
 * - Exponent 1.5 provides moderate decay (score drops ~50% after 1 hour)
 * 
 * Example scores (with freshness boost):
 * | likes | comments | hours | fresh_boost | hot_score |
 * |-------|----------|-------|-------------|-----------|
 * | 0     | 0        | 0     | 3           | 1.06      | <- New post appears in hot list
 * | 0     | 0        | 1     | 2           | 0.38      | <- Still visible after 1 hour
 * | 0     | 0        | 2     | 1           | 0.13      | <- Declining visibility
 * | 0     | 0        | 3+    | 0           | 0.00      | <- Needs engagement to stay ranked
 * | 10    | 5        | 0     | 3           | 4.5       | <- Popular + fresh = high score
 * | 100   | 50       | 0     | 3           | 36.5      | <- Very popular new post
 * | 10    | 5        | 24    | 0           | 0.15      | <- Older post with engagement
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
  
  // Freshness boost: new posts (<3 hours) get initial visibility
  // Decays linearly: 3 at 0h, 2 at 1h, 1 at 2h, 0 at 3h+
  const freshBoost = Math.max(0, 3 - hoursSincePost)
  
  const engagementScore = likes + comments * 2 + freshBoost
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