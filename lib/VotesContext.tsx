'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const VOTES_KEY = 'agentdex_votes'
const LOCAL_VOTE_COUNTS_KEY = 'agentdex_local_vote_counts'

interface VotesContextType {
  // User's voted tool IDs
  votedTools: string[]
  // Local vote counts (simulated backend)
  localVoteCounts: Record<string, number>
  // Toggle vote for a tool
  toggleVote: (toolId: string) => boolean
  // Check if user has voted
  isVoted: (toolId: string) => boolean
  // Get total vote count (base + local adjustments)
  getVoteCount: (toolId: string, baseCount?: number) => number
  // Is loaded from localStorage
  isLoaded: boolean
}

const VotesContext = createContext<VotesContextType | null>(null)

export function VotesProvider({ children }: { children: ReactNode }) {
  const [votedTools, setVotedTools] = useState<string[]>([])
  const [localVoteCounts, setLocalVoteCounts] = useState<Record<string, number>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const savedVotes = localStorage.getItem(VOTES_KEY)
      const savedCounts = localStorage.getItem(LOCAL_VOTE_COUNTS_KEY)
      
      if (savedVotes) {
        setVotedTools(JSON.parse(savedVotes))
      }
      if (savedCounts) {
        setLocalVoteCounts(JSON.parse(savedCounts))
      }
    } catch (e) {
      console.error('Failed to load votes:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save votes to localStorage
  const saveVotes = useCallback((tools: string[]) => {
    try {
      localStorage.setItem(VOTES_KEY, JSON.stringify(tools))
      setVotedTools(tools)
    } catch (e) {
      console.error('Failed to save votes:', e)
    }
  }, [])

  // Save counts to localStorage
  const saveCounts = useCallback((counts: Record<string, number>) => {
    try {
      localStorage.setItem(LOCAL_VOTE_COUNTS_KEY, JSON.stringify(counts))
      setLocalVoteCounts(counts)
    } catch (e) {
      console.error('Failed to save vote counts:', e)
    }
  }, [])

  // Toggle vote
  const toggleVote = useCallback((toolId: string): boolean => {
    const isCurrentlyVoted = votedTools.includes(toolId)
    
    if (isCurrentlyVoted) {
      // Remove vote
      saveVotes(votedTools.filter(id => id !== toolId))
      // Decrease count
      const currentCount = localVoteCounts[toolId] || 0
      if (currentCount > 0) {
        saveCounts({ ...localVoteCounts, [toolId]: currentCount - 1 })
      }
      return false // removed
    } else {
      // Add vote
      saveVotes([...votedTools, toolId])
      // Increase count
      const currentCount = localVoteCounts[toolId] || 0
      saveCounts({ ...localVoteCounts, [toolId]: currentCount + 1 })
      return true // added
    }
  }, [votedTools, localVoteCounts, saveVotes, saveCounts])

  // Check if voted
  const isVoted = useCallback((toolId: string) => {
    return votedTools.includes(toolId)
  }, [votedTools])

  // Get vote count (base from data + local adjustments)
  const getVoteCount = useCallback((toolId: string, baseCount: number = 0) => {
    return baseCount + (localVoteCounts[toolId] || 0)
  }, [localVoteCounts])

  return (
    <VotesContext.Provider
      value={{
        votedTools,
        localVoteCounts,
        toggleVote,
        isVoted,
        getVoteCount,
        isLoaded,
      }}
    >
      {children}
    </VotesContext.Provider>
  )
}

export function useVotes() {
  const context = useContext(VotesContext)
  if (!context) {
    throw new Error('useVotes must be used within a VotesProvider')
  }
  return context
}