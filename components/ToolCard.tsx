import { Tool } from '@/lib/tools'

export default function ToolCard({ tool }: { tool: Tool }) {
  const pricingColor = {
    free: 'bg-green-100 text-green-700',
    freemium: 'bg-blue-100 text-blue-700',
    paid: 'bg-orange-100 text-orange-700',
  }[tool.pricing]

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all bg-white">

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{tool.name}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{tool.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {tool.agent_friendly && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              🤖 Agent-friendly
            </span>
          )}
          {tool.featured && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              ⭐ Featured
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tool.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {tool.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pricingColor}`}>
          {tool.pricing}
        </span>
        <div className="flex gap-2">
          {tool.github && (
            <a
              href={tool.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              GitHub
            </a>
          )}
          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
          >
            Visit →
          </a>
        </div>
      </div>
    </div>
  )
}