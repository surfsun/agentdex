import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { tools } from '@/lib/tools'
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
  
  const toolNames = toolIds
    .map(id => tools.find(t => t.id === id || t.slug === id)?.name)
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
  
  // Validate tools exist
  const validTools = toolIds
    .map(id => tools.find(t => t.id === id || t.slug === id))
    .filter(Boolean)
  
  if (toolIds.length > 0 && validTools.length === 0) {
    notFound()
  }
  
  return <CompareClient initialToolIds={validTools.map(t => t!.id)} />
}