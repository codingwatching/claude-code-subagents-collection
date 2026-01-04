'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PluginCard } from '@/components/plugin-card'
import { CategoryFilter } from '@/components/category-filter'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { Copy, Check, Terminal } from 'lucide-react'
import { generateCategoryDisplayName } from '@/lib/category-utils'
import type { Plugin, PluginCategory } from '@/lib/plugins-types'

interface PluginsPageClientProps {
  allPlugins: Plugin[]
  categories: PluginCategory[]
}

export default function PluginsPageClient({ allPlugins, categories }: PluginsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedMarketplace, setCopiedMarketplace] = useState(false)

  const marketplaceCommand = '/plugin marketplace add davepoon/buildwithclaude'

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

    // Update URL with new category parameter
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }

    // Use replace to avoid adding to browser history for each filter change
    const newUrl = params.toString() ? `/plugins?${params.toString()}` : '/plugins'
    router.replace(newUrl)
  }

  const handleCopyMarketplace = async () => {
    await navigator.clipboard.writeText(marketplaceCommand)
    setCopiedMarketplace(true)
    setTimeout(() => setCopiedMarketplace(false), 2000)
  }

  const filteredPlugins = useMemo(() => {
    let filtered = allPlugins

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(plugin => plugin.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(plugin =>
        plugin.name.toLowerCase().includes(normalizedQuery) ||
        plugin.description.toLowerCase().includes(normalizedQuery) ||
        plugin.keywords.some(k => k.toLowerCase().includes(normalizedQuery))
      )
    }

    return filtered
  }, [allPlugins, selectedCategory, searchQuery])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Plugin Marketplace</h1>
          <p className="text-muted-foreground mb-6">
            Explore our collection of {allPlugins.length} plugins for Claude Code.
            Install agents, commands, hooks, and more with a single command.
          </p>

          {/* Getting Started Box */}
          <div className="bg-muted/30 border border-border/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Getting Started
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              First, add the BuildWithClaude marketplace to Claude Code:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-background px-3 py-2 rounded font-mono border border-border/50">
                {marketplaceCommand}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyMarketplace}
                className="flex-shrink-0"
              >
                {copiedMarketplace ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Then install any plugin using <code className="bg-background px-1 rounded">/plugin install {'<name>'}</code>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search plugins by name, description, or keywords..."
          />
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categories={categories}
          />
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredPlugins.length} of {allPlugins.length} plugins
          {selectedCategory !== 'all' && ` in ${generateCategoryDisplayName(selectedCategory)}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* Grid */}
        {filteredPlugins.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => (
              <PluginCard key={plugin.name} plugin={plugin} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No plugins found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
