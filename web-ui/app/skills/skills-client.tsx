'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SkillCard } from '@/components/skill-card'
import { CategoryFilter } from '@/components/category-filter'
import { SearchBar } from '@/components/search-bar'
import { generateCategoryDisplayName } from '@/lib/category-utils'
import type { Skill, CategoryMetadata } from '@/lib/skills-types'

interface SkillsPageClientProps {
  skills: Skill[]
  categories: CategoryMetadata[]
}

export default function SkillsPageClient({ skills, categories }: SkillsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Set initial category from URL parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam && categories.some(cat => cat.id === categoryParam)) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams, categories])

  // Handle category change and update URL
  const handleCategoryChange = (category: string | 'all') => {
    setSelectedCategory(category)

    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }

    const newUrl = params.toString() ? `/skills?${params.toString()}` : '/skills'
    router.replace(newUrl)
  }

  const filteredSkills = useMemo(() => {
    let filtered = skills

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(skill => skill.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(normalizedQuery) ||
        skill.description.toLowerCase().includes(normalizedQuery)
      )
    }

    return filtered
  }, [skills, selectedCategory, searchQuery])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Skills</h1>
          <p className="text-muted-foreground mb-6">
            Explore our collection of {skills.length} Claude Code skills for document processing,
            development, business productivity, and creative tasks.
          </p>

          {/* Getting Started Box */}
          <div className="bg-muted/30 border border-border/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">How to Use Skills</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Skills are markdown files that teach Claude Code specific capabilities. To use a skill:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Download the SKILL.md file</li>
              <li>Place it in <code className="bg-background px-1 rounded">~/.claude/skills/skill-name/SKILL.md</code></li>
              <li>Claude Code will automatically discover and use the skill when relevant</li>
            </ol>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search skills by name or description..."
          />
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categories={categories}
          />
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredSkills.length} of {skills.length} skills
          {selectedCategory !== 'all' && ` in ${generateCategoryDisplayName(selectedCategory)}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* Grid */}
        {filteredSkills.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No skills found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
