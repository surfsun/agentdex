import { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { skills, skillCategories, Skill } from '@/lib/skills'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Agent Skills Directory — AgentDex',
  description: 'Discover reusable agent behavior patterns and skills. Install directly into Claude Code, Cursor, or other AI tools.',
}

function SkillCard({ skill, locale }: { skill: Skill; locale: Locale }) {
  const name = locale === 'zh-CN' && skill.name_zh ? skill.name_zh : skill.name
  const description = locale === 'zh-CN' && skill.description_zh ? skill.description_zh : skill.description
  
  return (
    <div className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{skill.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ⭐ {skill.stars >= 1000 ? `${(skill.stars / 1000).toFixed(1)}k` : skill.stars}
              </span>
              {skill.verified && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {description}
      </p>
      
      <div className="flex items-center gap-2 mb-3">
        <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-mono">
          {skill.trigger}
        </code>
        <span className="text-xs text-gray-400">
          {locale === 'zh-CN' ? '作者:' : 'by'} {skill.author}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={`/skills/${skill.id}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {locale === 'zh-CN' ? '详情 →' : 'Details →'}
        </Link>
      </div>
    </div>
  )
}

export default async function SkillsPage() {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-blue-500 hover:underline">AgentDex</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white font-medium">
          {locale === 'zh-CN' ? 'Skills 目录' : 'Skills Directory'}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
          <span>🧠</span>
          {locale === 'zh-CN' ? 'Agent Skills 目录' : 'Agent Skills Directory'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {locale === 'zh-CN'
            ? '可复用的 Agent 行为模式，直接安装到 Claude Code、Cursor 等工具中'
            : 'Reusable agent behavior patterns. Install directly into Claude Code, Cursor, and other AI tools.'}
        </p>
      </div>

      {/* Skills vs Tools Explanation */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 mb-10">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
          {locale === 'zh-CN' ? 'Skills vs Tools: 有什么区别？' : 'Skills vs Tools: What\'s the Difference?'}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🔧</span> Tools
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {locale === 'zh-CN'
                ? '外部服务/API，提供"手"——执行能力。如 Browserbase、E2B、Mem0。'
                : 'External services/APIs that provide "hands" — execution capability. E.g., Browserbase, E2B, Mem0.'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🧠</span> Skills
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {locale === 'zh-CN'
                ? 'Agent 行为模式，提供"脑"——思考方式。如研究、代码审查、数据分析。'
                : 'Agent behavior patterns that provide "brain" — thinking patterns. E.g., research, code review, data analysis.'}
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '按类别浏览' : 'Browse by Category'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {skillCategories.map(cat => {
            const count = skills.filter(s => s.category === cat.id).length
            const label = locale === 'zh-CN' && cat.label_zh ? cat.label_zh : cat.label
            return (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 hover:border-blue-300 dark:hover:border-blue-600 transition"
              >
                <span>{cat.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({count})</span>
              </a>
            )
          })}
        </div>
      </div>

      {/* Skills List by Category */}
      {skillCategories.map(category => {
        const categorySkills = skills.filter(s => s.category === category.id)
        if (categorySkills.length === 0) return null
        
        const label = locale === 'zh-CN' && category.label_zh ? category.label_zh : category.label
        
        return (
          <div key={category.id} id={category.id} className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>{category.icon}</span>
              {label}
              <span className="text-sm font-normal text-gray-500">
                ({categorySkills.length})
              </span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {categorySkills.map(skill => (
                <SkillCard key={skill.id} skill={skill} locale={locale} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Contribute Section */}
      <div className="mt-12 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>🤝</span>
          {locale === 'zh-CN' ? '贡献你的 Skill' : 'Contribute Your Skill'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {locale === 'zh-CN'
            ? '创建了一个有用的 Skill？通过 GitHub Issue 或 Pull Request 提交到目录中。'
            : 'Created a useful Skill? Submit it to the directory via GitHub Issue or Pull Request.'}
        </p>
        <a
          href="https://github.com/surfsun/agentdex/issues/new?labels=skill&template=skill_submission.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          {locale === 'zh-CN' ? '提交 Skill →' : 'Submit Skill →'}
        </a>
      </div>

      {/* Resources */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'zh-CN' ? '学习资源' : 'Resources'}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="https://github.com/mvanhorn/last30days-skill"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition"
          >
            <div className="font-medium text-gray-900 dark:text-white">last30days-skill</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {locale === 'zh-CN' ? 'GitHub Trending 示例' : 'GitHub Trending example'}
            </div>
          </a>
          <a
            href="https://github.com/travisvn/awesome-claude-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition"
          >
            <div className="font-medium text-gray-900 dark:text-white">awesome-claude-skills</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {locale === 'zh-CN' ? 'Claude Skills 精选列表' : 'Curated Claude skills list'}
            </div>
          </a>
          <a
            href="https://github.com/bytedance/deer-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition"
          >
            <div className="font-medium text-gray-900 dark:text-white">deer-flow</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {locale === 'zh-CN' ? 'ByteDance SuperAgent' : 'ByteDance SuperAgent'}
            </div>
          </a>
        </div>
      </div>

      {/* Back to home */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {locale === 'zh-CN' ? '← 返回首页' : '← Back to Home'}
        </Link>
      </div>
    </div>
  )
}