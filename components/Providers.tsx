'use client'

import { ReactNode } from 'react'
import { VotesProvider } from '@/lib/VotesContext'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <VotesProvider>
      {children}
    </VotesProvider>
  )
}