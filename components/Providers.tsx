'use client'

import { ReactNode } from 'react'
import { VotesProvider } from '@/lib/VotesContext'
import { IdentityProvider } from '@/components/IdentityProvider'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <VotesProvider>
      <IdentityProvider>
        {children}
      </IdentityProvider>
    </VotesProvider>
  )
}