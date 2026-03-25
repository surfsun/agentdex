'use client'

import { useState, useEffect, useCallback } from 'react'

const COMPARE_KEY = 'agentdex_compare'
const MAX_COMPARE = 4

export function useCompare() {
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPARE_KEY)
      if (saved) {
        setSelectedTools(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load compare:', e)
    }
    setIsLoaded(true)
  }, [])

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
      saveCompare([...selectedTools, toolId])
      return true
    }
    return false
  }, [selectedTools, saveCompare])

  // Remove tool from compare
  const removeFromCompare = useCallback((toolId: string) => {
    saveCompare(selectedTools.filter(id => id !== toolId))
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
    compareCount: selectedTools.length
  }
}