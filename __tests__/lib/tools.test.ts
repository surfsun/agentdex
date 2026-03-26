/**
 * Tests for AgentDex Tool utilities
 */
import { describe, it, expect } from 'vitest'
import {
  isBrandNewTool,
  isNewTool,
  sortByRecentlyAdded,
  sortToolsByIdentity,
  getRecommendedReason,
  identities,
} from '@/lib/tools'
import type { Tool } from '@/lib/tools'

// Mock tool data
const createMockTool = (overrides: Partial<Tool> = {}): Tool => ({
  id: 'test-tool',
  name: 'Test Tool',
  slug: 'test-tool',
  tagline: null,
  description: 'A test tool',
  website: 'https://example.com',
  github: null,
  category: 'memory',
  tags: ['test'],
  pricing: 'free',
  price_detail: null,
  agent_friendly: true,
  api_available: true,
  open_source: true,
  featured: false,
  verified: false,
  submitted_by: null,
  created_at: new Date().toISOString(),
  ...overrides,
})

describe('Tool Utilities', () => {
  describe('isBrandNewTool', () => {
    it('should return true for tools created within 7 days', () => {
      const tool = createMockTool({
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      })
      expect(isBrandNewTool(tool)).toBe(true)
    })

    it('should return false for tools older than 7 days', () => {
      const tool = createMockTool({
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      })
      expect(isBrandNewTool(tool)).toBe(false)
    })

    it('should return true for tools created today', () => {
      const tool = createMockTool({
        created_at: new Date().toISOString(),
      })
      expect(isBrandNewTool(tool)).toBe(true)
    })
  })

  describe('isNewTool', () => {
    it('should return true for tools created within 30 days', () => {
      const tool = createMockTool({
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      })
      expect(isNewTool(tool)).toBe(true)
    })

    it('should return false for tools older than 30 days', () => {
      const tool = createMockTool({
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
      })
      expect(isNewTool(tool)).toBe(false)
    })
  })

  describe('sortByRecentlyAdded', () => {
    it('should sort tools by created_at in descending order', () => {
      const tools = [
        createMockTool({ id: 'old', created_at: '2024-01-01T00:00:00Z' }),
        createMockTool({ id: 'new', created_at: '2024-12-01T00:00:00Z' }),
        createMockTool({ id: 'mid', created_at: '2024-06-01T00:00:00Z' }),
      ]

      const sorted = sortByRecentlyAdded(tools)

      expect(sorted[0].id).toBe('new')
      expect(sorted[1].id).toBe('mid')
      expect(sorted[2].id).toBe('old')
    })

    it('should not modify original array', () => {
      const tools = [
        createMockTool({ id: 'first', created_at: '2024-01-01T00:00:00Z' }),
        createMockTool({ id: 'second', created_at: '2024-12-01T00:00:00Z' }),
      ]

      const sorted = sortByRecentlyAdded(tools)

      expect(tools[0].id).toBe('first')
      expect(sorted[0].id).toBe('second')
    })
  })

  describe('sortToolsByIdentity', () => {
    it('should sort by recommendation priority', () => {
      const tools = [
        createMockTool({
          id: 'low-priority',
          recommended_for: {
            developer: { priority: 3, reason: 'Low priority' },
          },
        }),
        createMockTool({
          id: 'high-priority',
          recommended_for: {
            developer: { priority: 1, reason: 'High priority' },
          },
        }),
        createMockTool({
          id: 'no-priority',
        }),
      ]

      const sorted = sortToolsByIdentity(tools, 'developer')

      expect(sorted[0].id).toBe('high-priority')
      expect(sorted[1].id).toBe('low-priority')
      expect(sorted[2].id).toBe('no-priority')
    })

    it('should return original order when no identity provided', () => {
      const tools = [
        createMockTool({ id: 'first' }),
        createMockTool({ id: 'second' }),
      ]

      const sorted = sortToolsByIdentity(tools, null)

      expect(sorted[0].id).toBe('first')
      expect(sorted[1].id).toBe('second')
    })
  })

  describe('getRecommendedReason', () => {
    it('should return English reason by default', () => {
      const tool = createMockTool({
        recommended_for: {
          developer: { priority: 1, reason: 'Great for building', reason_zh: '非常适合构建' },
        },
      })

      expect(getRecommendedReason(tool, 'developer')).toBe('Great for building')
    })

    it('should return Chinese reason when locale is zh-CN', () => {
      const tool = createMockTool({
        recommended_for: {
          developer: { priority: 1, reason: 'Great for building', reason_zh: '非常适合构建' },
        },
      })

      expect(getRecommendedReason(tool, 'developer', 'zh-CN')).toBe('非常适合构建')
    })

    it('should return null when no recommendation exists', () => {
      const tool = createMockTool()

      expect(getRecommendedReason(tool, 'developer')).toBe(null)
    })

    it('should fallback to English if Chinese not available', () => {
      const tool = createMockTool({
        recommended_for: {
          developer: { priority: 1, reason: 'Great for building' },
        },
      })

      expect(getRecommendedReason(tool, 'developer', 'zh-CN')).toBe('Great for building')
    })
  })

  describe('identities', () => {
    it('should have all required identities', () => {
      const identityIds = identities.map(i => i.id)
      expect(identityIds).toContain('developer')
      expect(identityIds).toContain('founder')
      expect(identityIds).toContain('researcher')
      expect(identityIds).toContain('pm')
    })

    it('should have labels in both languages', () => {
      for (const identity of identities) {
        expect(identity.label).toBeTruthy()
        expect(identity.label_zh).toBeTruthy()
        expect(identity.icon).toBeTruthy()
      }
    })
  })
})