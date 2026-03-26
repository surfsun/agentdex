'use client'

import { useState, useEffect, useCallback } from 'react'

const COMPARE_KEY = 'agentdex_compare'
const MAX_COMPARE = 4

// Helper to get initial tools from URL or localStorage
function getInitialTools(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    // First check URL parameters (for shared links)
    const params = new URLSearchParams(window.location.search)
    const toolsParam = params.get('compare')
    if (toolsParam) {
      const tools = toolsParam.split(',').filter(t => t).slice(0, MAX_COMPARE)
      if (tools.length > 0) {
        return tools
      }
    }
    
    // Fall back to localStorage
    const saved = localStorage.getItem(COMPARE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load compare:', e)
  }
  
  return []
}

export function useCompare() {
  const [selectedTools, setSelectedTools] = useState<string[]>(getInitialTools)

  // Generate shareable URL
  const getShareUrl = useCallback((tools?: string[]): string => {
    const toolsToShare = tools || selectedTools
    if (toolsToShare.length === 0) return ''
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.origin)
    url.pathname = '/compare'
    url.searchParams.set('tools', toolsToShare.join(','))
    return url.toString()
  }, [selectedTools])

  // Clean up URL and sync to localStorage on mount
  useEffect(() => {
    try {
      // Clean up URL parameter after loading
      const params = new URLSearchParams(window.location.search)
      if (params.has('compare')) {
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('compare')
        window.history.replaceState({}, '', cleanUrl.toString())
      }
      
      // Sync initial tools to localStorage
      if (selectedTools.length > 0) {
        localStorage.setItem(COMPARE_KEY, JSON.stringify(selectedTools))
      }
    } catch (e) {
      console.error('Failed to clean up URL:', e)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage
  const saveCompare = useCallback((tools: string[]) => {
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(tools))
      setSelectedTools(tools)
    } catch (e) {
      console.error('Failed to save compare:', e)
    }
  }, [])

  // Add tool to compare
  const addToCompare = useCallback((toolId: string) => {
    if (selectedTools.length < MAX_COMPARE && !selectedTools.includes(toolId)) {
      const newTools = [...selectedTools, toolId]
      saveCompare(newTools)
      return true
    }
    return false
  }, [selectedTools, saveCompare])

  // Remove tool from compare
  const removeFromCompare = useCallback((toolId: string) => {
    const newTools = selectedTools.filter(id => id !== toolId)
    saveCompare(newTools)
  }, [selectedTools, saveCompare])

  // Toggle compare selection
  const toggleCompare = useCallback((toolId: string) => {
    if (selectedTools.includes(toolId)) {
      removeFromCompare(toolId)
      return false
    } else {
      return addToCompare(toolId)
    }
  }, [selectedTools, addToCompare, removeFromCompare])

  // Check if tool is selected
  const isSelected = useCallback((toolId: string) => {
    return selectedTools.includes(toolId)
  }, [selectedTools])

  // Clear all selections
  const clearCompare = useCallback(() => {
    saveCompare([])
  }, [saveCompare])

  // Check if can add more (max 4)
  const canAddMore = selectedTools.length < MAX_COMPARE

  return {
    selectedTools,
    isLoaded: typeof window !== 'undefined',
    addToCompare,
    removeFromCompare,
    toggleCompare,
    isSelected,
    clearCompare,
    canAddMore,
    compareCount: selectedTools.length,
    getShareUrl
  }
}