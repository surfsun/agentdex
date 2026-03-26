import stacksData from '@/data/stacks.json'
import { tools, Tool } from './tools'

export type StackTool = {
  id: string
  role: string
  role_zh: string
  purpose: string
  purpose_zh: string
  required: boolean
  alternatives: string[]
}

export type StackUseCase = {
  en: string
  zh: string
}

export type Stack = {
  id: string
  slug: string
  name: string
  name_zh: string
  description: string
  description_zh: string
  icon: string
  tools: StackTool[]
  integration_time: string
  monthly_cost: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  verified: boolean
  use_cases: StackUseCase[]
  quick_start: string
  related_stacks: string[]
}

export const stacks: Stack[] = stacksData as Stack[]

export function getStackBySlug(slug: string): Stack | undefined {
  return stacks.find(s => s.slug === slug)
}

export function getToolsForStack(stack: Stack): (StackTool & { tool: Tool | undefined; alternativeTools: Tool[] })[] {
  return stack.tools.map(st => ({
    ...st,
    tool: tools.find(t => t.id === st.id),
    alternativeTools: st.alternatives.map(altId => tools.find(t => t.id === altId)).filter((t): t is Tool => t !== undefined)
  }))
}

export function getDifficultyLabel(difficulty: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    beginner: { en: '🟢 Beginner', 'zh-CN': '🟢 入门' },
    intermediate: { en: '🟡 Intermediate', 'zh-CN': '🟡 中级' },
    advanced: { en: '🔴 Advanced', 'zh-CN': '🔴 高级' }
  }
  return labels[difficulty]?.[locale] || difficulty
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    beginner: 'text-green-600 dark:text-green-400',
    intermediate: 'text-yellow-600 dark:text-yellow-400',
    advanced: 'text-red-600 dark:text-red-400'
  }
  return colors[difficulty] || 'text-gray-600'
}

// Get all stacks that contain a specific tool
export function getStacksForTool(toolId: string): (Stack & { role: string; role_zh: string; required: boolean })[] {
  return stacks
    .filter(stack => stack.tools.some(t => t.id === toolId))
    .map(stack => {
      const toolInStack = stack.tools.find(t => t.id === toolId)!
      return {
        ...stack,
        role: toolInStack.role,
        role_zh: toolInStack.role_zh,
        required: toolInStack.required
      }
    })
}