import { Suspense } from 'react'
import { getAllSkills, getAllSkillCategories } from '@/lib/skills-server'
import SkillsPageClient from './skills-client'

export const metadata = {
  title: 'Skills | BuildWithClaude',
  description: 'Browse Claude Code skills for document processing, development, business productivity, and creative tasks',
}

export default function SkillsPage() {
  const skills = getAllSkills()
  const categories = getAllSkillCategories()

  return (
    <Suspense fallback={null}>
      <SkillsPageClient skills={skills} categories={categories} />
    </Suspense>
  )
}
