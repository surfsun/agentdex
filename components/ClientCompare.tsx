'use client'

import { Tool } from '@/lib/tools'
import { Locale, getTranslations } from '@/lib/i18n'
import { useCompare } from '@/lib/useCompare'
import ClientToolCard from './ClientToolCard'
import CompareTray from './CompareTray'

interface ClientCompareProps {
  tools: Tool[]
  locale: Locale
}

export default function ClientCompare({ tools, locale }: ClientCompareProps) {
  const { selectedTools, toggleCompare, isSelected, canAddMore, removeFromCompare, clearCompare } = useCompare()
  const t = getTranslations(locale)

  // Get selected tool objects
  const selectedToolObjects = tools.filter(t => selectedTools.includes(t.id))

  return (
    <>
      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => (
          <ClientToolCard
            key={tool.id}
            tool={tool}
            locale={locale}
            compareSelected={isSelected(tool.id)}
            canAddToCompare={canAddMore || isSelected(tool.id)}
            onToggleCompare={toggleCompare}
          />
        ))}
      </div>

      {/* Compare Tray */}
      <CompareTray
        selectedTools={selectedToolObjects}
        onRemove={removeFromCompare}
        onClear={clearCompare}
        locale={locale}
      />

      {/* Bottom padding when tray is visible */}
      {selectedTools.length > 0 && <div className="h-20" />}
    </>
  )
}