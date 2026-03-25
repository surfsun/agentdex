import scenariosData from '@/data/scenarios.json'
import { tools, Tool } from './tools'

export type ScenarioTool = {
  id: string
  priority: 'essential' | 'common' | 'advanced' | 'optional'
  use_case: string
  use_case_zh: string
}

export type ScenarioCombination = {
  name: string
  name_zh: string
  tools: string[]
  description: string
  description_zh: string
}

export type Scenario = {
  id: string
  slug: string
  icon: string
  name: string
  name_zh: string
  description: string
  description_zh: string
  tools: ScenarioTool[]
  combinations: ScenarioCombination[]
  quick_start: string
  quick_start_language: string
}

export const scenarios: Scenario[] = scenariosData as Scenario[]

export function getScenarioBySlug(slug: string): Scenario | undefined {
  return scenarios.find(s => s.slug === slug)
}

export function getToolsForScenario(scenario: Scenario): (ScenarioTool & { tool: Tool })[] {
  return scenario.tools
    .map(st => ({
      ...st,
      tool: tools.find(t => t.id === st.id)!
    }))
    .filter(st => st.tool) // Filter out any missing tools
}

export function getPriorityLabel(priority: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    essential: { en: '⭐⭐⭐ Essential', 'zh-CN': '⭐⭐⭐ 必备' },
    common: { en: '⭐⭐ Common', 'zh-CN': '⭐⭐ 常用' },
    advanced: { en: '⭐⭐ Advanced', 'zh-CN': '⭐⭐ 高级' },
    optional: { en: '⭐ Optional', 'zh-CN': '⭐ 按需' }
  }
  return labels[priority]?.[locale] || priority
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    essential: 'text-purple-600 dark:text-purple-400',
    common: 'text-blue-600 dark:text-blue-400',
    advanced: 'text-amber-600 dark:text-amber-400',
    optional: 'text-gray-600 dark:text-gray-400'
  }
  return colors[priority] || 'text-gray-600'
}