/**
 * Tests for AgentDex core utilities and data integrity
 */
import { describe, it, expect } from 'vitest'
import toolsData from '@/data/tools.json'

describe('Data Integrity', () => {
  it('should have valid tools in data file', () => {
    expect(toolsData).toBeInstanceOf(Array)
    expect(toolsData.length).toBeGreaterThan(0)
  })

  it('should have required fields for each tool', () => {
    const requiredFields = ['id', 'name', 'slug', 'category', 'website', 'tags', 'pricing']
    
    for (const tool of toolsData) {
      for (const field of requiredFields) {
        expect(tool, `Tool ${tool.id || 'unknown'} missing field: ${field}`).toHaveProperty(field)
      }
    }
  })

  it('should have valid slugs (lowercase, no spaces)', () => {
    for (const tool of toolsData) {
      expect(tool.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('should have valid pricing values', () => {
    const validPricing = ['free', 'freemium', 'paid']
    
    for (const tool of toolsData) {
      expect(validPricing, `Tool ${tool.id} has invalid pricing: ${tool.pricing}`).toContain(tool.pricing)
    }
  })

  it('should have unique slugs', () => {
    const slugs = toolsData.map(t => t.slug)
    const uniqueSlugs = new Set(slugs)
    expect(slugs.length).toBe(uniqueSlugs.size)
  })

  it('should have unique ids', () => {
    const ids = toolsData.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
  })

  it('should have valid website URLs', () => {
    for (const tool of toolsData) {
      if (tool.website) {
        expect(tool.website).toMatch(/^https?:\/\//)
      }
    }
  })

  it('should have tags as array', () => {
    for (const tool of toolsData) {
      expect(Array.isArray(tool.tags)).toBe(true)
      expect(tool.tags.length).toBeGreaterThan(0)
    }
  })
})

describe('Tool Statistics', () => {
  it('should have at least 40 tools', () => {
    expect(toolsData.length).toBeGreaterThanOrEqual(40)
  })

  it('should have tools in multiple categories', () => {
    const categories = new Set(toolsData.map(t => t.category))
    expect(categories.size).toBeGreaterThanOrEqual(5)
  })

  it('should have agent-friendly tools', () => {
    const agentFriendly = toolsData.filter(t => t.agent_friendly)
    expect(agentFriendly.length).toBeGreaterThan(0)
  })

  it('should have open source tools', () => {
    const openSource = toolsData.filter(t => t.open_source)
    expect(openSource.length).toBeGreaterThan(0)
  })

  it('should have featured tools', () => {
    const featured = toolsData.filter(t => t.featured)
    expect(featured.length).toBeGreaterThan(0)
  })

  it('should have tools with API available', () => {
    const withApi = toolsData.filter(t => t.api_available)
    expect(withApi.length).toBeGreaterThan(0)
  })
})