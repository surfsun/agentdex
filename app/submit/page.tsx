import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'
import SubmitClient from './SubmitClient'

export const metadata: Metadata = {
  title: 'Submit a Tool — AgentDex',
  description: 'Submit your AI Agent tool to AgentDex directory.',
  openGraph: {
    title: 'Submit a Tool — AgentDex',
    description: 'Submit your AI Agent tool to AgentDex directory.',
    type: 'website',
  },
}

export default async function SubmitPage() {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  
  return <SubmitClient locale={locale} />
}