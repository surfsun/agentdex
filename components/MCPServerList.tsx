'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export interface MCPServer {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  provider: string | null
  classification: 'official' | 'reference' | 'community'
  tools_count: number
  installation: string
  verified: boolean
  website: string | null
  github: string | null
  category: string
  tags: string[]
}

interface MCPServerListProps {
  servers: MCPServer[]
}

const classificationLabels: Record<string, { en: string; zh: string; color: string }> = {
  official: { en: 'Official', zh: '官方', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  reference: { en: 'Reference', zh: '参考', color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
  community: { en: 'Community', zh: '社区', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
}

const sortOptions = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'tools_count', label: 'Most Tools' },
  { value: 'name', label: 'Name (A-Z)' },
]

export default function MCPServerList({ servers }: MCPServerListProps) {
  const [search, setSearch] = useState('')
  const [classification, setClassification] = useState<string | null>(null)
  const [sort, setSort] = useState('popularity')

  // Filter and sort servers
  const filteredServers = useMemo(() => {
    let result = [...servers]

    // Apply classification filter
    if (classification) {
      result = result.filter(s => s.classification === classification)
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.tagline?.toLowerCase().includes(searchLower) ||
        s.provider?.toLowerCase().includes(searchLower) ||
        s.tags.some(t => t.toLowerCase().includes(searchLower))
      )
    }

    // Apply sorting
    switch (sort) {
      case 'tools_count':
        result.sort((a, b) => b.tools_count - a.tools_count)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'popularity':
      default:
        result.sort((a, b) => {
          if (a.verified !== b.verified) return b.verified ? 1 : -1
          return b.tools_count - a.tools_count
        })
    }

    return result
  }, [servers, search, classification, sort])

  // Group by classification for display
  const officialServers = filteredServers.filter(s => s.classification === 'official')
  const referenceServers = filteredServers.filter(s => s.classification === 'reference')
  const communityServers = filteredServers.filter(s => s.classification === 'community')

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search MCP servers... (name, description, provider)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Classification Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
            <button
              onClick={() => setClassification(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                !classification
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({servers.length})
            </button>
            {(['official', 'reference', 'community'] as const).map((c) => {
              const count = servers.filter(s => s.classification === c).length
              return (
                <button
                  key={c}
                  onClick={() => setClassification(classification === c ? null : c)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    classification === c
                      ? classificationLabels[c].color
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {classificationLabels[c].en} ({count})
                </button>
              )
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        {(search || classification) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found {filteredServers.length} MCP server{filteredServers.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
            {classification && ` in ${classification}`}
          </p>
        )}
      </div>

      {/* Server Lists - Grouped by Classification when no filter */}
      {!classification && !search ? (
        <>
          {officialServers.length > 0 && (
            <ServerSection title="Official Servers" icon="🔵" servers={officialServers} />
          )}
          {referenceServers.length > 0 && (
            <ServerSection title="Reference Servers" icon="🟣" servers={referenceServers} />
          )}
          {communityServers.length > 0 && (
            <ServerSection title="Community Servers" icon="🟢" servers={communityServers} />
          )}
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredServers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredServers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No MCP servers found matching your criteria.</p>
          <button
            onClick={() => {
              setSearch('')
              setClassification(null)
            }}
            className="mt-4 text-blue-500 hover:text-blue-700"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

function ServerSection({ title, icon, servers }: { title: string; icon: string; servers: MCPServer[] }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>
    </div>
  )
}

function ServerCard({ server }: { server: MCPServer }) {
  const label = classificationLabels[server.classification]

  return (
    <Link
      href={`/tools/${server.slug}`}
      className="group block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              {server.name}
            </h3>
            {server.verified && (
              <span className="text-green-500 text-sm" title="Verified">✓</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs ${label.color}`}>
              {label.en}
            </span>
            {server.provider && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {server.provider}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {server.tagline || server.description}
      </p>

      {/* Tools Count */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          🔧 {server.tools_count} tool{server.tools_count !== 1 ? 's' : ''}
        </span>
        {server.website && (
          <span className="text-blue-500 dark:text-blue-400 text-xs">
            View docs →
          </span>
        )}
      </div>

      {/* Installation */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded p-2 text-xs font-mono text-gray-600 dark:text-gray-400 overflow-hidden">
        <span className="text-gray-400">$</span> {server.installation}
      </div>
    </Link>
  )
}