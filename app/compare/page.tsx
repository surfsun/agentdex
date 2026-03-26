import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getToolsByFilter } from '@/lib/db'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'
import CompareClient from './CompareClient'

interface ComparePageProps {
  searchParams: Promise<{ tools?: string }>
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const params = await searchParams
  const toolIds = params.tools?.split(',').filter(Boolean) || []
  
  if (toolIds.length === 0) {
    return {
      title: 'Compare Tools — AgentDex',
      description: 'Compare AI agent tools side by side.',
    }
  }
  
  // 从数据库获取工具
  const { tools: foundTools } = await getToolsByFilter({ limit: 1000 })
  
  const toolNames = toolIds
    .map(id => foundTools.find(t => t.id === id || t.slug === id)?.name)
    .filter(Boolean)
    .join(' vs ')
  
  return {
    title: toolNames ? `${toolNames} — AgentDex Compare` : 'Compare Tools — AgentDex',
    description: `Compare ${toolNames || 'AI agent tools'} side by side on AgentDex.`,
    openGraph: {
      title: toolNames ? `Compare: ${toolNames}` : 'Compare Tools — AgentDex',
      description: `Side-by-side comparison of ${toolNames || 'AI agent tools'}.`,
      type: 'website',
    },
  }
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams
  const toolIds = params.tools?.split(',').filter(Boolean) || []
  
  // 获取 locale
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  
  // 从数据库获取所有工具
  const { tools } = await getToolsByFilter({ limit: 1000 })
  
  // Validate tools exist
  const validTools = toolIds
    .map(id => tools.find(t => t.id === id || t.slug === id))
    .filter(Boolean)
  
  if (toolIds.length > 0 && validTools.length === 0) {
    notFound()
  }
  
  return <CompareClient tools={tools} initialToolIds={validTools.map(t => t!.id)} locale={locale} />
}