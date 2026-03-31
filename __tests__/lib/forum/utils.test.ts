/**
 * Tests for lib/forum/utils.ts
 * 
 * Tests utility functions:
 * - calculateHotScore: Hacker News-style hot score algorithm
 * - formatHotScore: Display formatting for hot scores
 * - getTimeAgo: Time ago string generation
 */

import { describe, it, expect } from 'vitest'
import { calculateHotScore, formatHotScore, getTimeAgo } from '@/lib/forum/utils'

describe('calculateHotScore', () => {
  it('should calculate correct score for fresh high engagement post', () => {
    // 100 likes, 50 comments, 0 hours
    // With freshness boost: (100 + 50 * 2 + 3) / (0 + 2)^1.5 = 203 / 2.83 = ~71.7
    const score = calculateHotScore(100, 50, new Date())
    expect(score).toBeGreaterThan(71)
    expect(score).toBeLessThan(72)
  })

  it('should calculate correct score for medium engagement post', () => {
    // 10 likes, 5 comments, 0 hours
    // With freshness boost: (10 + 5 * 2 + 3) / (0 + 2)^1.5 = 23 / 2.83 = ~8.1
    const score = calculateHotScore(10, 5, new Date())
    expect(score).toBeGreaterThan(8)
    expect(score).toBeLessThan(8.5)
  })

  it('should apply time decay', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600000)
    
    const freshScore = calculateHotScore(10, 5, now)
    const oldScore = calculateHotScore(10, 5, oneHourAgo)
    
    // Score should decay over time
    expect(oldScore).toBeLessThan(freshScore)
  })

  it('should weight comments twice as much as likes', () => {
    const now = new Date()
    
    // 10 likes, 0 comments (freshness boost = 3)
    const likesOnly = calculateHotScore(10, 0, now)
    
    // 0 likes, 5 comments (5 * 2 = 10 engagement score, freshness boost = 3)
    const commentsOnly = calculateHotScore(0, 5, now)
    
    // Should be approximately equal since 5 comments = 10 engagement, both get boost
    expect(Math.abs(likesOnly - commentsOnly)).toBeLessThan(0.01)
  })

  it('should give new posts (no engagement) initial visibility via freshness boost', () => {
    // Fresh post (0 hours) with no engagement gets boost score
    // Score = (0 + 0 + 3) / (0 + 2)^1.5 = 3 / 2.83 = ~1.06
    const score = calculateHotScore(0, 0, new Date())
    expect(score).toBeGreaterThan(1)
    expect(score).toBeLessThan(1.1)
  })

  it('should decay freshness boost over time', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000)
    
    // All have no engagement, but different freshness boost
    const freshScore = calculateHotScore(0, 0, now)       // boost = 3
    const oneHourScore = calculateHotScore(0, 0, oneHourAgo)  // boost = 2
    const twoHourScore = calculateHotScore(0, 0, twoHoursAgo) // boost = 1
    
    // Score should decrease as boost decays
    expect(freshScore).toBeGreaterThan(oneHourScore)
    expect(oneHourScore).toBeGreaterThan(twoHourScore)
  })

  it('should return 0 for old posts with no engagement (no freshness boost)', () => {
    // Post older than 3 hours with no engagement gets no boost
    const fourHoursAgo = new Date(Date.now() - 4 * 3600000)
    const score = calculateHotScore(0, 0, fourHoursAgo)
    expect(score).toBe(0)
  })

  it('should handle 24 hours decay', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000)
    
    // 10 likes, 5 comments, 24 hours (no freshness boost)
    // Score = (10 + 5 * 2) / (24 + 2)^1.5 = 20 / 132.8 = ~0.15
    const score = calculateHotScore(10, 5, oneDayAgo)
    expect(score).toBeLessThan(0.2)
    expect(score).toBeGreaterThan(0.1)
  })

  it('should handle ISO date string input', () => {
    const isoString = new Date().toISOString()
    const score = calculateHotScore(10, 5, isoString)
    expect(typeof score).toBe('number')
    expect(score).toBeGreaterThan(0)
  })
})

describe('formatHotScore', () => {
  it('should format score >= 10 as integer', () => {
    expect(formatHotScore(71.5)).toBe('72')
    expect(formatHotScore(10)).toBe('10')
    expect(formatHotScore(100.9)).toBe('101')
  })

  it('should format score 1-10 with 1 decimal', () => {
    expect(formatHotScore(7.12)).toBe('7.1')
    expect(formatHotScore(1.55)).toBe('1.6') // rounded
    expect(formatHotScore(9.99)).toBe('10.0')
  })

  it('should format score < 1 with 2 decimals', () => {
    expect(formatHotScore(0.15)).toBe('0.15')
    expect(formatHotScore(0.01)).toBe('0.01')
    expect(formatHotScore(0.5)).toBe('0.50')
  })

  it('should handle zero score', () => {
    expect(formatHotScore(0)).toBe('0.00')
  })
})

describe('getTimeAgo', () => {
  it('should return "刚刚" for less than 1 minute', () => {
    const now = new Date().toISOString()
    expect(getTimeAgo(now)).toBe('刚刚')
  })

  it('should return minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString()
    expect(getTimeAgo(fiveMinutesAgo)).toBe('5 分钟前')
  })

  it('should return hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString()
    expect(getTimeAgo(twoHoursAgo)).toBe('2 小时前')
  })

  it('should return days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    expect(getTimeAgo(threeDaysAgo)).toBe('3 天前')
  })

  it('should return date string for older dates', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString()
    const result = getTimeAgo(twoWeeksAgo)
    // Should return a date string, not "X 天前"
    expect(result).not.toContain('天前')
    expect(result).not.toContain('小时前')
    expect(result).not.toContain('分钟前')
    expect(result).not.toBe('刚刚')
  })
})