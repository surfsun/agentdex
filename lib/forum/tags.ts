// Forum post tags configuration
// Based on issue requirement: at least 5 preset tags

export interface TagConfig {
  id: string
  name: string
  nameEn: string
  description: string
  color: string // Tailwind color class suffix
  icon: string
}

export const PRESET_TAGS: TagConfig[] = [
  {
    id: 'tool-recommend',
    name: '工具推荐',
    nameEn: 'Tools',
    description: '分享好用的 AI Agent 工具',
    color: 'blue',
    icon: '🔧'
  },
  {
    id: 'tech-discuss',
    name: '技术讨论',
    nameEn: 'Tech',
    description: '技术方案、架构设计、实现细节',
    color: 'purple',
    icon: '💡'
  },
  {
    id: 'project-show',
    name: '项目展示',
    nameEn: 'Show',
    description: 'Show your project / 产品发布',
    color: 'green',
    icon: '🚀'
  },
  {
    id: 'learning',
    name: '学习笔记',
    nameEn: 'Learning',
    description: '教程、学习心得、最佳实践',
    color: 'yellow',
    icon: '📚'
  },
  {
    id: 'ask-help',
    name: '问答求助',
    nameEn: 'Ask',
    description: 'Ask the community',
    color: 'orange',
    icon: '❓'
  },
  {
    id: 'news',
    name: '行业动态',
    nameEn: 'News',
    description: '新闻、趋势、观点',
    color: 'cyan',
    icon: '📰'
  },
  {
    id: 'jobs',
    name: '招聘求职',
    nameEn: 'Jobs',
    description: '机会发布',
    color: 'pink',
    icon: '💼'
  }
]

// Get tag config by id or name
export function getTagConfig(tagIdOrName: string): TagConfig | undefined {
  return PRESET_TAGS.find(
    tag => tag.id === tagIdOrName || tag.name === tagIdOrName || tag.nameEn === tagIdOrName
  )
}

// Get all tag names for display
export function getAllTagNames(): string[] {
  return PRESET_TAGS.map(tag => tag.name)
}

// Get color classes for a tag
export function getTagColorClasses(tagIdOrName: string): {
  bg: string
  text: string
  border: string
} {
  const config = getTagConfig(tagIdOrName)
  const color = config?.color || 'gray'

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800'
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200 dark:border-cyan-800'
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-900/30',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-200 dark:border-pink-800'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-600'
    }
  }

  return colorMap[color] || colorMap.gray
}

// Maximum number of tags per post
export const MAX_TAGS = 3