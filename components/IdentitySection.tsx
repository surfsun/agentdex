'use client'

import { useIdentity } from '@/components/IdentityProvider'
import { identities } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'

export default function IdentitySection({ locale }: { locale: Locale }) {
  const { identity, setIdentity } = useIdentity()
  const t = getTranslations(locale)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
      <span className="text-sm text-gray-500 font-medium">{t.identity.label}</span>
      {identities.map(id => {
        const label = locale === 'zh-CN' ? id.label_zh : id.label
        const isActive = identity === id.id
        
        return (
          <button
            key={id.id}
            onClick={() => setIdentity(isActive ? null : id.id)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-blue-500'
            }`}
          >
            {label}
          </button>
        )
      })}
      {identity && (
        <button
          onClick={() => setIdentity(null)}
          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
        >
          ✕
        </button>
      )}
    </div>
  )
}