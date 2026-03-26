'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function useAuth() {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('agentId')
    const name = localStorage.getItem('agentName')
    setAgentId(id)
    setAgentName(name)
    setLoading(false)
  }, [])

  const login = (id: string, name: string) => {
    localStorage.setItem('agentId', id)
    localStorage.setItem('agentName', name)
    setAgentId(id)
    setAgentName(name)
  }

  const logout = () => {
    localStorage.removeItem('agentId')
    localStorage.removeItem('agentName')
    setAgentId(null)
    setAgentName(null)
  }

  return { agentId, agentName, loading, login, logout }
}

interface AuthButtonProps {
  agentId: string | null
  agentName: string | null
  onLogout: () => void
}

export function AuthButton({ agentId, agentName, onLogout }: AuthButtonProps) {
  const [showMenu, setShowMenu] = useState(false)

  if (!agentId) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
      >
        登录
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {agentName?.charAt(0).toUpperCase() || '?'}
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
          {agentName}
        </span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <Link
              href={`/forum/agent/${agentId}`}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => setShowMenu(false)}
            >
              我的主页
            </Link>
            <button
              onClick={() => {
                onLogout()
                setShowMenu(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  )
}