/**
 * Tests for AgentDex i18n module
 */
import { describe, it, expect } from 'vitest'
import {
  locales,
  defaultLocale,
  localeNames,
  t,
  getTranslations,
  getLocaleFromCookie,
  type Locale,
} from '../../../lib/i18n/index'

describe('i18n module', () => {
  describe('constants', () => {
    describe('locales', () => {
      it('should contain exactly two locales', () => {
        expect(locales).toHaveLength(2)
      })

      it('should include English locale', () => {
        expect(locales).toContain('en')
      })

      it('should include Chinese locale', () => {
        expect(locales).toContain('zh-CN')
      })

      it('should be an array of Locale type', () => {
        expect(Array.isArray(locales)).toBe(true)
        locales.forEach((locale) => {
          expect(['en', 'zh-CN']).toContain(locale)
        })
      })
    })

    describe('defaultLocale', () => {
      it('should be zh-CN', () => {
        expect(defaultLocale).toBe('zh-CN')
      })

      it('should be one of the available locales', () => {
        expect(locales).toContain(defaultLocale)
      })
    })

    describe('localeNames', () => {
      it('should have names for all locales', () => {
        locales.forEach((locale) => {
          expect(localeNames[locale]).toBeDefined()
          expect(typeof localeNames[locale]).toBe('string')
        })
      })

      it('should have English name for en locale', () => {
        expect(localeNames['en']).toBe('English')
      })

      it('should have Chinese name for zh-CN locale', () => {
        expect(localeNames['zh-CN']).toBe('简体中文')
      })

      it('should be a Record with Locale keys', () => {
        const keys = Object.keys(localeNames)
        expect(keys).toHaveLength(2)
        keys.forEach((key) => {
          expect(locales).toContain(key as Locale)
        })
      })
    })
  })

  describe('t function', () => {
    describe('simple key lookup', () => {
      it('should return Chinese translation by default', () => {
        expect(t('site.title')).toBe('AgentDex — 为 AI Agent 打造的工具目录')
      })

      it('should return English translation when locale is en', () => {
        expect(t('site.title', 'en')).toBe(
          'AgentDex — The tool directory built for AI agents'
        )
      })

      it('should return Chinese translation when locale is zh-CN', () => {
        expect(t('site.title', 'zh-CN')).toBe(
          'AgentDex — 为 AI Agent 打造的工具目录'
        )
      })
    })

    describe('nested key lookup', () => {
      it('should handle deeply nested keys', () => {
        expect(t('hero.title')).toBe('为 AI Agent 打造的工具目录')
        expect(t('hero.title', 'en')).toBe(
          'The tool directory built for AI agents'
        )
      })

      it('should handle nav keys', () => {
        expect(t('nav.tools')).toBe('工具目录')
        expect(t('nav.tools', 'en')).toBe('Tools')
      })

      it('should handle changelog changeTypes keys', () => {
        expect(t('changelog.changeTypes.breaking')).toBe('破坏性变更')
        expect(t('changelog.changeTypes.breaking', 'en')).toBe('Breaking Change')
      })
    })

    describe('fallback behavior', () => {
      it('should return the key itself if not found in locale', () => {
        expect(t('nonexistent.key')).toBe('nonexistent.key')
        expect(t('nonexistent.key', 'en')).toBe('nonexistent.key')
      })

      it('should return the key if nested path partially exists', () => {
        expect(t('site.nonexistent')).toBe('site.nonexistent')
      })

      it('should return the key for empty string', () => {
        expect(t('')).toBe('')
      })

      it('should handle key that exists as object (not string)', () => {
        // nav exists as object, not string
        expect(t('nav')).toBe('nav')
      })
    })

    describe('edge cases', () => {
      it('should handle single-level key', () => {
        expect(t('pricing.free')).toBe('免费')
        expect(t('pricing.free', 'en')).toBe('Free')
      })

      it('should handle keys with hyphens', () => {
        // zh-CN locale key itself has hyphen
        expect(t('search.placeholder')).toBe('搜索工具...（输入即时筛选）')
      })

      it('should handle nested object access correctly', () => {
        expect(t('identity.pickFor.developer')).toBe('开发者推荐')
        expect(t('identity.pickFor.developer', 'en')).toBe('Developer Pick')
      })

      it('should handle priority keys in scenarios', () => {
        expect(t('scenarios.priority.essential')).toBe('⭐⭐⭐ 必备')
        expect(t('scenarios.priority.essential', 'en')).toBe(
          '⭐⭐⭐ Essential'
        )
      })
    })
  })

  describe('getTranslations function', () => {
    it('should return Chinese translations by default', () => {
      const translations = getTranslations()
      expect(translations.site.title).toBe(
        'AgentDex — 为 AI Agent 打造的工具目录'
      )
    })

    it('should return English translations when locale is en', () => {
      const translations = getTranslations('en')
      expect(translations.site.title).toBe(
        'AgentDex — The tool directory built for AI agents'
      )
    })

    it('should return Chinese translations when locale is zh-CN', () => {
      const translations = getTranslations('zh-CN')
      expect(translations.site.title).toBe(
        'AgentDex — 为 AI Agent 打造的工具目录'
      )
    })

    it('should return full translation object structure', () => {
      const translations = getTranslations()
      expect(translations.nav).toBeDefined()
      expect(translations.hero).toBeDefined()
      expect(translations.search).toBeDefined()
      expect(translations.filters).toBeDefined()
    })

    it('should return object with all expected keys', () => {
      const translations = getTranslations('en')
      const keys = Object.keys(translations)
      expect(keys).toContain('site')
      expect(keys).toContain('nav')
      expect(keys).toContain('hero')
      expect(keys).toContain('search')
      expect(keys).toContain('filters')
      expect(keys).toContain('stats')
      expect(keys).toContain('results')
      expect(keys).toContain('pricing')
      expect(keys).toContain('compare')
      expect(keys).toContain('changelog')
    })
  })

  describe('getLocaleFromCookie function', () => {
    it('should return valid locale from cookie', () => {
      expect(getLocaleFromCookie('en')).toBe('en')
      expect(getLocaleFromCookie('zh-CN')).toBe('zh-CN')
    })

    it('should return default locale for undefined cookie', () => {
      expect(getLocaleFromCookie(undefined)).toBe(defaultLocale)
    })

    it('should return default locale for invalid locale string', () => {
      expect(getLocaleFromCookie('fr')).toBe(defaultLocale)
      expect(getLocaleFromCookie('zh')).toBe(defaultLocale)
      expect(getLocaleFromCookie('EN')).toBe(defaultLocale) // case sensitive
      expect(getLocaleFromCookie('zh-cn')).toBe(defaultLocale) // case sensitive
    })

    it('should return default locale for empty string', () => {
      expect(getLocaleFromCookie('')).toBe(defaultLocale)
    })

    it('should return default locale for whitespace', () => {
      expect(getLocaleFromCookie('  ')).toBe(defaultLocale)
    })

    it('should return default locale for null-ish values', () => {
      expect(getLocaleFromCookie(null as unknown as string)).toBe(defaultLocale)
    })

    it('should only accept exact locale strings', () => {
      // Locale matching is exact - must be 'en' or 'zh-CN'
      expect(getLocaleFromCookie('en-US')).toBe(defaultLocale)
      expect(getLocaleFromCookie('zh_CN')).toBe(defaultLocale)
    })
  })

  describe('Locale type', () => {
    it('should allow valid locale values', () => {
      const validEn: Locale = 'en'
      const validZhCN: Locale = 'zh-CN'
      expect(validEn).toBe('en')
      expect(validZhCN).toBe('zh-CN')
    })
  })
})