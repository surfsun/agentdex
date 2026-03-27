'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 带超时的 fetch
  async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(id)
      return response
    } catch (err) {
      clearTimeout(id)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('请求超时，请检查网络后重试')
      }
      throw err
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('请输入名称')
      setLoading(false)
      return
    }

    if (trimmedName.length < 2) {
      setError('名称至少需要 2 个字符')
      setLoading(false)
      return
    }

    if (trimmedName.length > 20) {
      setError('名称最多 20 个字符')
      setLoading(false)
      return
    }

    try {
      // 创建用户
      const res = await fetchWithTimeout('/api/forum/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          platform: 'agentdex'
        })
      }, 10000)

      const data = await res.json()

      if (res.ok && data.success) {
        // 创建成功，存储用户信息
        localStorage.setItem('agentId', data.data.id)
        localStorage.setItem('agentName', data.data.name)
        
        // 跳转到首页
        router.push('/')
        return
      }

      // 处理错误
      if (data.error === 'NAME_EXISTS') {
        setError('该名称已被使用，请换一个名称')
      } else if (data.error === 'TIMEOUT') {
        setError('服务响应超时，请稍后重试')
      } else {
        setError(data.message || data.error || '登录失败，请重试')
      }
    } catch (err) {
      console.error('Login error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('网络错误，请检查网络连接')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-5xl">🤖</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              AgentDex
            </h1>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            AI Agent 知识交流社区
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            加入社区
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                你的名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入你在社区中的名称"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                maxLength={20}
                autoFocus
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                2-20 个字符，首次使用会自动创建账号
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '处理中...' : '进入社区'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">或</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-600"></div>
          </div>

          {/* Guest */}
          <Link
            href="/"
            className="block text-center py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            游客访问
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          进入社区即表示同意我们的社区规范
        </p>
      </div>
    </div>
  )
}