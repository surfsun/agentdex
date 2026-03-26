'use client'

import { useState } from 'react'
import { PRESET_TAGS, getTagColorClasses, MAX_TAGS } from '@/lib/forum/tags'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

export default function TagSelector({ 
  selectedTags, 
  onChange, 
  maxTags = MAX_TAGS 
}: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleTagClick = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(t => t !== tagName))
    } else if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tagName])
    }
  }

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim()
    if (
      trimmed &&
      !selectedTags.includes(trimmed) &&
      selectedTags.length < maxTags
    ) {
      onChange([...selectedTags, trimmed])
      setCustomTag('')
      setShowCustomInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustomTag()
    }
  }

  return (
    <div className="space-y-3">
      {/* Preset Tags Grid */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map(tag => {
          const isSelected = selectedTags.includes(tag.name)
          const colors = getTagColorClasses(tag.id)
          
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagClick(tag.name)}
              disabled={!isSelected && selectedTags.length >= maxTags}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 border
                ${isSelected 
                  ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1`
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
                ${!isSelected && selectedTags.length >= maxTags ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span>{tag.icon}</span>
              <span>{tag.name}</span>
              {isSelected && (
                <span className="ml-0.5 text-xs">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom Tag Input */}
      <div className="flex items-center gap-2">
        {showCustomInput ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入自定义标签..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              disabled={!customTag.trim() || selectedTags.length >= maxTags}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false)
                setCustomTag('')
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              取消
            </button>
          </div>
        ) : (
          selectedTags.length < maxTags && (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + 自定义标签
            </button>
          )
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            已选择 ({selectedTags.length}/{maxTags}):
          </span>
          {selectedTags.map(tag => {
            const config = PRESET_TAGS.find(t => t.name === tag)
            const colors = getTagColorClasses(config?.id || tag)
            
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
              >
                {config?.icon && <span>{config.icon}</span>}
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => onChange(selectedTags.filter(t => t !== tag))}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        选择或添加标签帮助其他人发现你的帖子（最多 {maxTags} 个）
      </p>
    </div>
  )
}

// Tag Badge Component for display
interface TagBadgeProps {
  tag: string
  clickable?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

export function TagBadge({ tag, clickable = false, onClick, size = 'sm' }: TagBadgeProps) {
  const config = PRESET_TAGS.find(t => t.name === tag || t.id === tag)
  const colors = getTagColorClasses(config?.id || tag)
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm'

  const Component = clickable ? 'button' : 'span'
  
  return (
    <Component
      onClick={clickable ? onClick : undefined}
      className={`
        inline-flex items-center gap-1 rounded-full ${sizeClasses} ${colors.bg} ${colors.text}
        ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all' : ''}
      `}
    >
      {config?.icon && <span>{config.icon}</span>}
      <span>#{tag}</span>
    </Component>
  )
}