'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CommandCard } from '@/components/command-card'
import { Input } from '@/components/ui/input'
import { generateCategoryDisplayName } from '@/lib/commands-types'
import type { Command, CategoryMetadata } from '@/lib/commands-types'

interface CommandsPageClientProps {
  allCommands: Command[]
  categories: CategoryMetadata[]
}

export default function CommandsPageClient({ allCommands, categories }: CommandsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam && categories.some(cat => cat.id === categoryParam)) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams, categories])

  const handleCategoryChange = (category: string | 'all') => {
    setSelectedCategory(category)
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    const newUrl = params.toString() ? `/commands?${params.toString()}` : '/commands'
    router.replace(newUrl)
  }

  const filteredCommands = useMemo(() => {
    let filtered = allCommands

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [allCommands, selectedCategory, searchQuery])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-display-2 mb-2">Commands</h1>
          <p className="text-muted-foreground">
            {allCommands.length} slash commands
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md bg-card border-border"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat.displayName}
            </button>
          ))}
        </div>

        {/* Results count */}
        {(selectedCategory !== 'all' || searchQuery) && (
          <p className="text-sm text-muted-foreground mb-6">
            {filteredCommands.length} result{filteredCommands.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && ` in ${generateCategoryDisplayName(selectedCategory)}`}
          </p>
        )}

        {/* Grid */}
        {filteredCommands.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommands.map((command) => (
              <CommandCard key={command.slug} command={command} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No commands found</p>
          </div>
        )}
      </div>
    </div>
  )
}
