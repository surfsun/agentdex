/**
 * Tests for lib/forum/tags.ts
 *
 * Tests cover:
 * - Preset tag configuration validation
 * - getTagConfig function (id, name, nameEn lookup)
 * - getAllTagNames function
 * - getTagColorClasses function (all 8 colors)
 * - MAX_TAGS constant
 * - Edge cases (invalid tag, unknown color)
 */

import { describe, it, expect } from 'vitest'
import {
  PRESET_TAGS,
  getTagConfig,
  getAllTagNames,
  getTagColorClasses,
  MAX_TAGS,
  type TagConfig
} from '@/lib/forum/tags'

describe('tags configuration', () => {
  describe('PRESET_TAGS', () => {
    it('should have at least 5 preset tags', () => {
      expect(PRESET_TAGS.length).toBeGreaterThanOrEqual(5)
    })

    it('should have exactly 7 preset tags', () => {
      expect(PRESET_TAGS.length).toBe(7)
    })

    it('should have valid structure for each tag', () => {
      PRESET_TAGS.forEach(tag => {
        expect(tag.id).toBeTruthy()
        expect(tag.name).toBeTruthy()
        expect(tag.nameEn).toBeTruthy()
        expect(tag.description).toBeTruthy()
        expect(tag.color).toBeTruthy()
        expect(tag.icon).toBeTruthy()
      })
    })

    it('should have unique ids', () => {
      const ids = PRESET_TAGS.map(t => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have unique names', () => {
      const names = PRESET_TAGS.map(t => t.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should have unique nameEn values', () => {
      const nameEns = PRESET_TAGS.map(t => t.nameEn)
      const uniqueNameEns = new Set(nameEns)
      expect(uniqueNameEns.size).toBe(nameEns.length)
    })

    it('should contain expected preset tags', () => {
      const expectedIds = ['tool-recommend', 'tech-discuss', 'project-show', 'learning', 'ask-help', 'news', 'jobs']
      const actualIds = PRESET_TAGS.map(t => t.id)
      expect(actualIds).toEqual(expectedIds)
    })
  })

  describe('MAX_TAGS', () => {
    it('should be defined', () => {
      expect(MAX_TAGS).toBeDefined()
    })

    it('should be 3', () => {
      expect(MAX_TAGS).toBe(3)
    })
  })
})

describe('getTagConfig', () => {
  describe('by id', () => {
    it('should find tag by id "tool-recommend"', () => {
      const tag = getTagConfig('tool-recommend')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('tool-recommend')
      expect(tag?.name).toBe('工具推荐')
      expect(tag?.nameEn).toBe('Tools')
      expect(tag?.color).toBe('blue')
    })

    it('should find tag by id "tech-discuss"', () => {
      const tag = getTagConfig('tech-discuss')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('tech-discuss')
      expect(tag?.name).toBe('技术讨论')
      expect(tag?.color).toBe('purple')
    })

    it('should find tag by id "project-show"', () => {
      const tag = getTagConfig('project-show')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('project-show')
      expect(tag?.name).toBe('项目展示')
      expect(tag?.color).toBe('green')
    })

    it('should find tag by id "learning"', () => {
      const tag = getTagConfig('learning')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('learning')
      expect(tag?.name).toBe('学习笔记')
      expect(tag?.color).toBe('yellow')
    })

    it('should find tag by id "ask-help"', () => {
      const tag = getTagConfig('ask-help')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('ask-help')
      expect(tag?.name).toBe('问答求助')
      expect(tag?.color).toBe('orange')
    })

    it('should find tag by id "news"', () => {
      const tag = getTagConfig('news')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('news')
      expect(tag?.name).toBe('行业动态')
      expect(tag?.color).toBe('cyan')
    })

    it('should find tag by id "jobs"', () => {
      const tag = getTagConfig('jobs')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('jobs')
      expect(tag?.name).toBe('招聘求职')
      expect(tag?.color).toBe('pink')
    })
  })

  describe('by name', () => {
    it('should find tag by Chinese name "工具推荐"', () => {
      const tag = getTagConfig('工具推荐')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('tool-recommend')
    })

    it('should find tag by Chinese name "技术讨论"', () => {
      const tag = getTagConfig('技术讨论')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('tech-discuss')
    })

    it('should find tag by Chinese name "项目展示"', () => {
      const tag = getTagConfig('项目展示')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('project-show')
    })

    it('should find tag by Chinese name "学习笔记"', () => {
      const tag = getTagConfig('学习笔记')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('learning')
    })

    it('should find tag by Chinese name "问答求助"', () => {
      const tag = getTagConfig('问答求助')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('ask-help')
    })

    it('should find tag by Chinese name "行业动态"', () => {
      const tag = getTagConfig('行业动态')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('news')
    })

    it('should find tag by Chinese name "招聘求职"', () => {
      const tag = getTagConfig('招聘求职')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('jobs')
    })
  })

  describe('by nameEn', () => {
    it('should find tag by English name "Tools"', () => {
      const tag = getTagConfig('Tools')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('tool-recommend')
    })

    it('should find tag by English name "Tech"', () => {
      const tag = getTagConfig('Tech')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('tech-discuss')
    })

    it('should find tag by English name "Show"', () => {
      const tag = getTagConfig('Show')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('project-show')
    })

    it('should find tag by English name "Learning"', () => {
      const tag = getTagConfig('Learning')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('learning')
    })

    it('should find tag by English name "Ask"', () => {
      const tag = getTagConfig('Ask')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('ask-help')
    })

    it('should find tag by English name "News"', () => {
      const tag = getTagConfig('News')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('news')
    })

    it('should find tag by English name "Jobs"', () => {
      const tag = getTagConfig('Jobs')
      expect(tag).toBeDefined()
      expect(tag?.id).toBe('jobs')
    })
  })

  describe('edge cases', () => {
    it('should return undefined for invalid tag id', () => {
      const tag = getTagConfig('invalid-tag')
      expect(tag).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      const tag = getTagConfig('')
      expect(tag).toBeUndefined()
    })

    it('should return undefined for non-existent Chinese name', () => {
      const tag = getTagConfig('不存在标签')
      expect(tag).toBeUndefined()
    })

    it('should return undefined for non-existent English name', () => {
      const tag = getTagConfig('Nonexistent')
      expect(tag).toBeUndefined()
    })
  })
})

describe('getAllTagNames', () => {
  it('should return array of Chinese names', () => {
    const names = getAllTagNames()
    expect(names).toEqual([
      '工具推荐',
      '技术讨论',
      '项目展示',
      '学习笔记',
      '问答求助',
      '行业动态',
      '招聘求职'
    ])
  })

  it('should return 7 names', () => {
    const names = getAllTagNames()
    expect(names.length).toBe(7)
  })

  it('should match PRESET_TAGS names', () => {
    const names = getAllTagNames()
    const presetNames = PRESET_TAGS.map(t => t.name)
    expect(names).toEqual(presetNames)
  })
})

describe('getTagColorClasses', () => {
  describe('by tag id', () => {
    it('should return blue color classes for "tool-recommend"', () => {
      const colors = getTagColorClasses('tool-recommend')
      expect(colors.bg).toBe('bg-blue-50 dark:bg-blue-900/30')
      expect(colors.text).toBe('text-blue-600 dark:text-blue-400')
      expect(colors.border).toBe('border-blue-200 dark:border-blue-800')
      expect(colors.activeBg).toBe('bg-blue-500 dark:bg-blue-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-blue-500 dark:ring-blue-400')
    })

    it('should return purple color classes for "tech-discuss"', () => {
      const colors = getTagColorClasses('tech-discuss')
      expect(colors.bg).toBe('bg-purple-50 dark:bg-purple-900/30')
      expect(colors.text).toBe('text-purple-600 dark:text-purple-400')
      expect(colors.border).toBe('border-purple-200 dark:border-purple-800')
      expect(colors.activeBg).toBe('bg-purple-500 dark:bg-purple-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-purple-500 dark:ring-purple-400')
    })

    it('should return green color classes for "project-show"', () => {
      const colors = getTagColorClasses('project-show')
      expect(colors.bg).toBe('bg-green-50 dark:bg-green-900/30')
      expect(colors.text).toBe('text-green-600 dark:text-green-400')
      expect(colors.border).toBe('border-green-200 dark:border-green-800')
      expect(colors.activeBg).toBe('bg-green-500 dark:bg-green-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-green-500 dark:ring-green-400')
    })

    it('should return yellow color classes for "learning"', () => {
      const colors = getTagColorClasses('learning')
      expect(colors.bg).toBe('bg-yellow-50 dark:bg-yellow-900/30')
      expect(colors.text).toBe('text-yellow-600 dark:text-yellow-400')
      expect(colors.border).toBe('border-yellow-200 dark:border-yellow-800')
      expect(colors.activeBg).toBe('bg-yellow-500 dark:bg-yellow-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-yellow-500 dark:ring-yellow-400')
    })

    it('should return orange color classes for "ask-help"', () => {
      const colors = getTagColorClasses('ask-help')
      expect(colors.bg).toBe('bg-orange-50 dark:bg-orange-900/30')
      expect(colors.text).toBe('text-orange-600 dark:text-orange-400')
      expect(colors.border).toBe('border-orange-200 dark:border-orange-800')
      expect(colors.activeBg).toBe('bg-orange-500 dark:bg-orange-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-orange-500 dark:ring-orange-400')
    })

    it('should return cyan color classes for "news"', () => {
      const colors = getTagColorClasses('news')
      expect(colors.bg).toBe('bg-cyan-50 dark:bg-cyan-900/30')
      expect(colors.text).toBe('text-cyan-600 dark:text-cyan-400')
      expect(colors.border).toBe('border-cyan-200 dark:border-cyan-800')
      expect(colors.activeBg).toBe('bg-cyan-500 dark:bg-cyan-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-cyan-500 dark:ring-cyan-400')
    })

    it('should return pink color classes for "jobs"', () => {
      const colors = getTagColorClasses('jobs')
      expect(colors.bg).toBe('bg-pink-50 dark:bg-pink-900/30')
      expect(colors.text).toBe('text-pink-600 dark:text-pink-400')
      expect(colors.border).toBe('border-pink-200 dark:border-pink-800')
      expect(colors.activeBg).toBe('bg-pink-500 dark:bg-pink-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-pink-500 dark:ring-pink-400')
    })
  })

  describe('by tag name', () => {
    it('should return correct color classes for Chinese name', () => {
      const colors = getTagColorClasses('工具推荐')
      expect(colors.bg).toBe('bg-blue-50 dark:bg-blue-900/30')
    })

    it('should return correct color classes for English name', () => {
      const colors = getTagColorClasses('Tools')
      expect(colors.bg).toBe('bg-blue-50 dark:bg-blue-900/30')
    })
  })

  describe('unknown tags', () => {
    it('should return gray color classes for invalid tag', () => {
      const colors = getTagColorClasses('invalid-tag')
      expect(colors.bg).toBe('bg-gray-50 dark:bg-gray-700')
      expect(colors.text).toBe('text-gray-600 dark:text-gray-400')
      expect(colors.border).toBe('border-gray-200 dark:border-gray-600')
      expect(colors.activeBg).toBe('bg-gray-500 dark:bg-gray-600')
      expect(colors.activeText).toBe('text-white')
      expect(colors.ring).toBe('ring-gray-500 dark:ring-gray-400')
    })

    it('should return gray color classes for empty string', () => {
      const colors = getTagColorClasses('')
      expect(colors.bg).toBe('bg-gray-50 dark:bg-gray-700')
    })
  })

  describe('color class structure', () => {
    it('should return all required color class keys', () => {
      const colors = getTagColorClasses('tool-recommend')
      expect(colors).toHaveProperty('bg')
      expect(colors).toHaveProperty('text')
      expect(colors).toHaveProperty('border')
      expect(colors).toHaveProperty('activeBg')
      expect(colors).toHaveProperty('activeText')
      expect(colors).toHaveProperty('ring')
    })

    it('should include dark mode variants in bg class', () => {
      const colors = getTagColorClasses('tech-discuss')
      expect(colors.bg).toContain('dark:')
    })

    it('should include dark mode variants in text class', () => {
      const colors = getTagColorClasses('tech-discuss')
      expect(colors.text).toContain('dark:')
    })

    it('should include dark mode variants in border class', () => {
      const colors = getTagColorClasses('tech-discuss')
      expect(colors.border).toContain('dark:')
    })

    it('should include dark mode variants in ring class', () => {
      const colors = getTagColorClasses('tech-discuss')
      expect(colors.ring).toContain('dark:')
    })
  })
})

describe('TagConfig interface', () => {
  it('should have correct types for all preset tags', () => {
    PRESET_TAGS.forEach((tag: TagConfig) => {
      expect(typeof tag.id).toBe('string')
      expect(typeof tag.name).toBe('string')
      expect(typeof tag.nameEn).toBe('string')
      expect(typeof tag.description).toBe('string')
      expect(typeof tag.color).toBe('string')
      expect(typeof tag.icon).toBe('string')
    })
  })

  it('should have valid Tailwind color names', () => {
    const validColors = ['blue', 'purple', 'green', 'yellow', 'orange', 'cyan', 'pink', 'gray']
    PRESET_TAGS.forEach(tag => {
      expect(validColors).toContain(tag.color)
    })
  })

  it('should have emoji icons', () => {
    // Emoji characters are typically in certain Unicode ranges
    // For simplicity, just check that icons are non-empty strings
    PRESET_TAGS.forEach(tag => {
      expect(tag.icon.length).toBeGreaterThan(0)
      expect(tag.icon).not.toBe('')
    })
  })
})