'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { HookCard } from '@/components/hook-card'
import { CategoryFilter } from '@/components/category-filter'
import { SearchBar } from '@/components/search-bar'
import { type Hook, type CategoryMetadata, generateCategoryDisplayName } from '@/lib/hooks-types'
import { Badge } from '@/components/ui/badge'

interface HooksPageClientProps {
  allHooks: Hook[]
  categories: CategoryMetadata[]
  eventTypes: string[]
}

export default function HooksPageClient({ allHooks, categories, eventTypes }: HooksPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [selectedEvent, setSelectedEvent] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Set initial filters from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const eventParam = searchParams.get('event')
    if (categoryParam && categories.some(cat => cat.id === categoryParam)) {
      setSelectedCategory(categoryParam)
    }
    if (eventParam && eventTypes.includes(eventParam)) {
      setSelectedEvent(eventParam)
    }
  }, [searchParams, categories, eventTypes])

  // Handle category change and update URL
  const handleCategoryChange = (category: string | 'all') => {
    setSelectedCategory(category)
    updateURL(category, selectedEvent)
  }

  // Handle event change and update URL
  const handleEventChange = (event: string) => {
    const newEvent = event === selectedEvent ? 'all' : event
    setSelectedEvent(newEvent)
    updateURL(selectedCategory, newEvent)
  }

  const updateURL = (category: string | 'all', event: string | 'all') => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    if (event === 'all') {
      params.delete('event')
    } else {
      params.set('event', event)
    }
    const newUrl = params.toString() ? `/hooks?${params.toString()}` : '/hooks'
    router.replace(newUrl)
  }

  const filteredHooks = useMemo(() => {
    let filtered = allHooks

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hook => hook.category === selectedCategory)
    }

    // Filter by event type
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(hook => hook.event === selectedEvent)
    }

    // Filter by search query
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(hook =>
        hook.name.toLowerCase().includes(normalizedQuery) ||
        hook.description.toLowerCase().includes(normalizedQuery) ||
        hook.event.toLowerCase().includes(normalizedQuery) ||
        hook.content.toLowerCase().includes(normalizedQuery)
      )
    }

    return filtered
  }, [allHooks, selectedCategory, selectedEvent, searchQuery])

  const eventColors: Record<string, string> = {
    'PostToolUse': 'border-green-500/50 text-green-400 bg-green-500/5 hover:bg-green-500/10',
    'PreToolUse': 'border-yellow-500/50 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10',
    'Stop': 'border-red-500/50 text-red-400 bg-red-500/5 hover:bg-red-500/10',
    'Notification': 'border-blue-500/50 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10'
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Browse Hooks</h1>
          <p className="text-muted-foreground">
            Explore our collection of {allHooks.length} automation hooks for Claude Code.
            Hover over any card to instantly copy or download!
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search hooks by name, description, or event..."
          />
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categories={categories}
          />

          {/* Event Type Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground py-1">Event Type:</span>
            {eventTypes.map((event) => (
              <Badge
                key={event}
                variant="outline"
                className={`cursor-pointer transition-colors ${
                  selectedEvent === event
                    ? eventColors[event] || 'border-primary text-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleEventChange(event)}
              >
                {event}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredHooks.length} of {allHooks.length} hooks
          {selectedCategory !== 'all' && ` in ${generateCategoryDisplayName(selectedCategory)}`}
          {selectedEvent !== 'all' && ` for ${selectedEvent} events`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* Grid */}
        {filteredHooks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHooks.map((hook) => (
              <HookCard key={hook.slug} hook={hook} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hooks found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
