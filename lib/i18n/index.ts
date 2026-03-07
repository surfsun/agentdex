import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export type Locale = 'en' | 'zh-CN'

export const locales: Locale[] = ['en', 'zh-CN']

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
}

const translations: Record<Locale, typeof en> = {
  'en': en,
  'zh-CN': zhCN,
}

export type TranslationKey = string

/**
 * Get a nested translation value by dot-notation key
 * e.g., t('hero.title', locale) returns translations[locale].hero.title
 */
export function t(key: TranslationKey, locale: Locale = defaultLocale): string {
  const keys = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[locale]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // Fallback to English if key not found in requested locale
      value = translations[defaultLocale]
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey]
        } else {
          return key // Return the key itself if not found
        }
      }
      break
    }
  }
  
  return typeof value === 'string' ? value : key
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: Locale = defaultLocale): typeof en {
  return translations[locale]
}

/**
 * Get locale from cookie value
 */
export function getLocaleFromCookie(cookieValue: string | undefined): Locale {
  if (cookieValue && locales.includes(cookieValue as Locale)) {
    return cookieValue as Locale
  }
  return defaultLocale
}