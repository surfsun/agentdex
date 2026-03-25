'use client'

import { useState, useEffect, useCallback } from 'react'

const COMPARE_KEY = 'agentdex_compare'
const MAX_COMPARE = 4

export function useCompare() {
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Parse tools from URL parameter
  const parseToolsFromUrl = useCallback((): string[] | null => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const toolsParam = params.get('compare')
    if (toolsParam) {
      const tools = toolsParam.split(',').filter(t => t).slice(0, MAX_COMPARE)
      return tools.length > 0 ? tools : null
    }
    return null
  }, [])

  // Update URL with current selection (without reload)
  const updateUrl = useCallback((tools: string[]) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (tools.length > 0) {
      url.searchParams.set('compare', tools.join(','))
    } else {
      url.searchParams.delete('compare')
    }
    window.history.replaceState({}, '', url.toString())
  }, [])

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

  // Load from localStorage or URL
  useEffect(() => {
    try {
      // First check URL parameters (for shared links)
      const urlTools = parseToolsFromUrl()
      if (urlTools && urlTools.length > 0) {
        setSelectedTools(urlTools)
        localStorage.setItem(COMPARE_KEY, JSON.stringify(urlTools))
        // Clean up URL parameter after loading
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('compare')
        window.history.replaceState({}, '', cleanUrl.toString())
      } else {
        // Fall back to localStorage
        const saved = localStorage.getItem(COMPARE_KEY)
        if (saved) {
          setSelectedTools(JSON.parse(saved))
        }
      }
    } catch (e) {
      console.error('Failed to load compare:', e)
    }
    setIsLoaded(true)
  }, [parseToolsFromUrl])

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
    isLoaded,
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