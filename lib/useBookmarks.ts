'use client'

import { useState, useCallback } from 'react'

const BOOKMARKS_KEY = 'agentdex_bookmarks'

// Helper to get initial bookmarks from localStorage
function getInitialBookmarks(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const saved = localStorage.getItem(BOOKMARKS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load bookmarks:', e)
  }
  
  return []
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>(getInitialBookmarks)

  // 保存到 localStorage
  const saveBookmarks = useCallback((newBookmarks: string[]) => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks))
      setBookmarks(newBookmarks)
    } catch (e) {
      console.error('Failed to save bookmarks:', e)
    }
  }, [])

  // 添加收藏
  const addBookmark = useCallback((toolId: string) => {
    if (!bookmarks.includes(toolId)) {
      saveBookmarks([...bookmarks, toolId])
    }
  }, [bookmarks, saveBookmarks])

  // 取消收藏
  const removeBookmark = useCallback((toolId: string) => {
    saveBookmarks(bookmarks.filter(id => id !== toolId))
  }, [bookmarks, saveBookmarks])

  // 切换收藏状态
  const toggleBookmark = useCallback((toolId: string) => {
    if (bookmarks.includes(toolId)) {
      removeBookmark(toolId)
    } else {
      addBookmark(toolId)
    }
  }, [bookmarks, addBookmark, removeBookmark])

  // 检查是否已收藏
  const isBookmarked = useCallback((toolId: string) => {
    return bookmarks.includes(toolId)
  }, [bookmarks])

  // 清空所有收藏
  const clearBookmarks = useCallback(() => {
    saveBookmarks([])
  }, [saveBookmarks])

  return {
    bookmarks,
    isLoaded: typeof window !== 'undefined',
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
    bookmarkCount: bookmarks.length
  }
}