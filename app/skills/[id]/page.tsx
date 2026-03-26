import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { skills, getSkillById, skillCategories, getSkillsByCategory } from '@/lib/skills'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'

interface Params {
  id: string
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params
  const skill = getSkillById(id)
  
  if (!skill) {
    return { title: 'Skill not found' }
  }
  
  return {
    title: `${skill.name} — AgentDex Skills`,
    description: skill.description,
  }
}

export async function generateStaticParams() {
  return skills.map(skill => ({ id: skill.id }))
}

export default async function SkillPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const skill = getSkillById(id)

  if (!skill) {
    notFound()
  }

  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)

  const name = locale === 'zh-CN' && skill.name_zh ? skill.name_zh : skill.name
  const description = locale === 'zh-CN' && skill.description_zh ? skill.description_zh : skill.description
  const category = skillCategories.find(c => c.id === skill.category)
  const categoryLabel = locale === 'zh-CN' && category?.label_zh ? category.label_zh : category?.label

  // Get related skills (same category)
  const relatedSkills = getSkillsByCategory(skill.category)
    .filter(s => s.id !== skill.id)
    .slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">Home</Link>
          {' / '}
          <Link href="/skills" className="hover:text-gray-700 dark:hover:text-gray-300">Skills</Link>
          {' / '}
          <span className="text-gray-900 dark:text-white">{name}</span>
        </div>
        <Link
          href="/skills"
          className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 text-sm flex items-center gap-1"
        >
          ← {locale === 'zh-CN' ? '返回 Skills' : 'Back to Skills'}
        </Link>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{skill.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{name}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ⭐ {skill.stars >= 1000 ? `${(skill.stars / 1000).toFixed(1)}k` : skill.stars} stars
              </span>
              {skill.verified && (
                <span className="text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                  ✓ Verified
                </span>
              )}
              <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                {skill.icon} {categoryLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Install */}
      <div className="mb-8 bg-gray-900 dark:bg-gray-950 rounded-xl p-6">
        <h3 className="text-gray-400 font-mono mb-3"># {locale === 'zh-CN' ? '快速安装' : 'Quick Install'}</h3>
        <code className="text-green-400 block overflow-x-auto whitespace-pre-wrap break-all">
          {skill.install}
        </code>
        {skill.install_alt && (
          <div className="mt-3">
            <div className="text-gray-500 text-xs mb-1">OpenClaw:</div>
            <code className="text-blue-400 text-sm">{skill.install_alt}</code>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {locale === 'zh-CN' ? '描述' : 'Description'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>

      {/* Trigger */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {locale === 'zh-CN' ? '触发方式' : 'Trigger'}
        </h2>
        <code className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-mono text-lg">
          {skill.trigger}
        </code>
      </div>

      {/* Examples */}
      {skill.examples.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {locale === 'zh-CN' ? '示例' : 'Examples'}
          </h2>
          <div className="space-y-4">
            {skill.examples.map((example, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <div className="mb-3">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mb-1">
                    {locale === 'zh-CN' ? '输入' : 'Input'}:
                  </div>
                  <code className="text-gray-800 dark:text-gray-200 font-mono">{example.input}</code>
                </div>
                <div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-mono mb-1">
                    {locale === 'zh-CN' ? '输出' : 'Output'}:
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{example.output}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {skill.dependencies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {locale === 'zh-CN' ? '依赖工具' : 'Dependencies'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {skill.dependencies.map(dep => (
              <span 
                key={dep}
                className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-sm"
              >
                {dep}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {locale === 'zh-CN' 
              ? '此 Skill 需要上述工具/服务才能正常工作'
              : 'This skill requires the above tools/services to work properly'}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {locale === 'zh-CN' ? '标签' : 'Tags'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {skill.tags.map(tag => (
            <span 
              key={tag}
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-4 mb-8">
        <a
          href={skill.github}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-900 dark:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-700 transition"
        >
          {locale === 'zh-CN' ? '查看 GitHub →' : 'View on GitHub →'}
        </a>
      </div>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {locale === 'zh-CN' ? '相关 Skills' : 'Related Skills'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedSkills.map(s => {
              const relatedName = locale === 'zh-CN' && s.name_zh ? s.name_zh : s.name
              return (
                <Link
                  key={s.id}
                  href={`/skills/${s.id}`}
                  className="group p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {relatedName}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {s.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-8 text-center">
        <Link
          href="/skills"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {locale === 'zh-CN' ? '← 查看所有 Skills' : '← View All Skills'}
        </Link>
      </div>
    </div>
  )
}