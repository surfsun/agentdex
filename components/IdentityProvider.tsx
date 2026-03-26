'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Identity } from '@/lib/tools'

interface IdentityContextType {
  identity: Identity | null
  setIdentity: (identity: Identity | null) => void
}

const IdentityContext = createContext<IdentityContextType>({
  identity: null,
  setIdentity: () => {},
})

export function useIdentity() {
  return useContext(IdentityContext)
}

// Helper to get initial identity from localStorage (avoids effect setState)
function getInitialIdentity(): Identity | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('agentdex_identity')
  return saved as Identity | null
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<Identity | null>(getInitialIdentity)

  // Sync identity to URL on mount (optional, for shareable links)
  useEffect(() => {
    if (identity) {
      const url = new URL(window.location.href)
      if (!url.searchParams.has('identity')) {
        url.searchParams.set('identity', identity)
        window.history.replaceState({}, '', url.toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to localStorage and update URL
  const setIdentity = (newIdentity: Identity | null) => {
    setIdentityState(newIdentity)
    if (newIdentity) {
      localStorage.setItem('agentdex_identity', newIdentity)
      // Update URL without reload
      const url = new URL(window.location.href)
      url.searchParams.set('identity', newIdentity)
      window.history.replaceState({}, '', url.toString())
    } else {
      localStorage.removeItem('agentdex_identity')
      const url = new URL(window.location.href)
      url.searchParams.delete('identity')
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <IdentityContext.Provider value={{ identity, setIdentity }}>
      {children}
    </IdentityContext.Provider>
  )
}