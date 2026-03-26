import { NextResponse } from 'next/server'
import { skills, skillCategories, getSkillsByCategory, getSkillById } from '@/lib/skills'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const id = searchParams.get('id')

  // Get single skill by ID
  if (id) {
    const skill = getSkillById(id)
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ skill })
  }

  // Get skills by category
  if (category) {
    const categorySkills = getSkillsByCategory(category)
    return NextResponse.json({ 
      skills: categorySkills,
      category: skillCategories.find(c => c.id === category)
    })
  }

  // Get all skills
  return NextResponse.json({
    skills: skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      name_zh: skill.name_zh,
      description: skill.description,
      description_zh: skill.description_zh,
      category: skill.category,
      icon: skill.icon,
      trigger: skill.trigger,
      install: skill.install,
      author: skill.author,
      github: skill.github,
      stars: skill.stars,
      verified: skill.verified,
      tags: skill.tags,
    })),
    categories: skillCategories,
    total: skills.length,
  })
}