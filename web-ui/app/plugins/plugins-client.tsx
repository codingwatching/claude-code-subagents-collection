'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { UnifiedPluginCard } from '@/components/unified-plugin-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Bot, Terminal, Webhook, Sparkles, Package, Store, Loader2, ArrowUpDown, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UnifiedPlugin, PluginType } from '@/lib/plugin-types'
import type { MarketplaceOption, SortOption } from '@/lib/plugin-db-server'

interface PluginStats {
  total: number
  subagents: number
  commands: number
  hooks: number
  skills: number
  plugins: number
}

interface PluginsPageClientProps {
  initialPlugins: UnifiedPlugin[]
  initialHasMore: boolean
  stats: PluginStats
  marketplaces: MarketplaceOption[]
}

const typeFilters: { value: PluginType | 'all'; label: string; icon: React.ElementType | null }[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'subagent', label: 'Subagents', icon: Bot },
  { value: 'command', label: 'Commands', icon: Terminal },
  { value: 'hook', label: 'Hooks', icon: Webhook },
  { value: 'skill', label: 'Skills', icon: Sparkles },
  { value: 'plugin', label: 'Plugins', icon: Package },
]

const ITEMS_PER_PAGE = 24

export default function PluginsPageClient({
  initialPlugins,
  initialHasMore,
  stats,
  marketplaces,
}: PluginsPageClientProps) {
  // State
  const [plugins, setPlugins] = useState<UnifiedPlugin[]>(initialPlugins)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedType, setSelectedType] = useState<PluginType | 'all'>('all')
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all')
  const [sort, setSort] = useState<SortOption>('stars')
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)

  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(initialPlugins.length)
  const isFirstRender = useRef(true)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset and fetch when filters change
  useEffect(() => {
    const fetchFiltered = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          limit: ITEMS_PER_PAGE.toString(),
          offset: '0',
          sort,
        })
        if (debouncedSearch) {
          params.set('search', debouncedSearch)
        }
        if (selectedType !== 'all') {
          params.set('type', selectedType)
        }
        if (selectedMarketplace !== 'all') {
          params.set('marketplaceId', selectedMarketplace)
        }

        const response = await fetch(`/api/plugins/list?${params}`)
        const data = await response.json()

        setPlugins(data.plugins)
        setHasMore(data.hasMore)
        offsetRef.current = data.plugins.length
      } catch (error) {
        console.error('Error fetching plugins:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Skip fetch on initial mount (we have server-rendered data)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    fetchFiltered()
  }, [debouncedSearch, selectedType, selectedMarketplace, sort])

  // Load more function
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offsetRef.current.toString(),
        sort,
      })
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }
      if (selectedType !== 'all') {
        params.set('type', selectedType)
      }
      if (selectedMarketplace !== 'all') {
        params.set('marketplaceId', selectedMarketplace)
      }

      const response = await fetch(`/api/plugins/list?${params}`)
      const data = await response.json()

      setPlugins((prev) => [...prev, ...data.plugins])
      setHasMore(data.hasMore)
      offsetRef.current += data.plugins.length
    } catch (error) {
      console.error('Error loading more plugins:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, debouncedSearch, selectedType, selectedMarketplace, sort])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, loadMore])

  const getTypeCount = (type: PluginType | 'all') => {
    if (type === 'all') return stats.total
    if (type === 'subagent') return stats.subagents
    if (type === 'command') return stats.commands
    if (type === 'hook') return stats.hooks
    if (type === 'skill') return stats.skills
    if (type === 'plugin') return stats.plugins
    return 0
  }

  // Filter marketplaces: remove duplicates by displayName and entries with 0 plugins
  // Sort with "Build with Claude" first, then by pluginCount descending
  const filteredMarketplaces = useMemo(() => {
    const seen = new Set<string>()
    const filtered = marketplaces.filter(mp => {
      // Skip if 0 plugins
      if (mp.pluginCount === 0) return false
      // Skip if duplicate displayName
      if (seen.has(mp.displayName)) return false
      seen.add(mp.displayName)
      return true
    })

    // Sort: "Build with Claude" first, then by pluginCount descending
    return filtered.sort((a, b) => {
      const aIsBWC = a.displayName.toLowerCase().includes('build with claude')
      const bIsBWC = b.displayName.toLowerCase().includes('build with claude')
      if (aIsBWC && !bIsBWC) return -1
      if (!aIsBWC && bIsBWC) return 1
      return b.pluginCount - a.pluginCount
    })
  }, [marketplaces])

  // Get selected marketplace display name
  const selectedMarketplaceDisplay = useMemo(() => {
    if (selectedMarketplace === 'all') {
      return `All Sources (${stats.total.toLocaleString()})`
    }
    const mp = filteredMarketplaces.find(m => m.id === selectedMarketplace)
    return mp ? `${mp.displayName} (${mp.pluginCount.toLocaleString()})` : 'Select source...'
  }, [selectedMarketplace, filteredMarketplaces, stats.total])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-2 mb-2 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Plugins
          </h1>
          <p className="text-muted-foreground mb-4">
            Browse {stats.total.toLocaleString()} plugins across subagents, commands, hooks, skills, and community plugins
          </p>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-500">
              <Bot className="h-4 w-4" />
              {stats.subagents.toLocaleString()} subagents
            </span>
            <span className="flex items-center gap-1.5 text-green-500">
              <Terminal className="h-4 w-4" />
              {stats.commands.toLocaleString()} commands
            </span>
            <span className="flex items-center gap-1.5 text-orange-500">
              <Webhook className="h-4 w-4" />
              {stats.hooks.toLocaleString()} hooks
            </span>
            <span className="flex items-center gap-1.5 text-yellow-500">
              <Sparkles className="h-4 w-4" />
              {stats.skills.toLocaleString()} skills
            </span>
            {stats.plugins > 0 && (
              <span className="flex items-center gap-1.5 text-purple-500">
                <Package className="h-4 w-4" />
                {stats.plugins.toLocaleString()} plugins
              </span>
            )}
          </div>
        </div>

        {/* Search, Marketplace Filter, and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md bg-card border-border"
          />
          {filteredMarketplaces.length > 0 && (
            <Popover open={marketplaceOpen} onOpenChange={setMarketplaceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={marketplaceOpen}
                  className="w-[280px] justify-between bg-card border-border group gap-2"
                >
                  <span className="flex items-center gap-4 truncate">
                    <Store className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    <span className="truncate">{selectedMarketplaceDisplay}</span>
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput placeholder="Search sources..." />
                  <CommandList>
                    <CommandEmpty>No source found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedMarketplace('all')
                          setMarketplaceOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMarketplace === 'all' ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Sources ({stats.total.toLocaleString()})
                      </CommandItem>
                      {filteredMarketplaces.map((mp) => (
                        <CommandItem
                          key={mp.id}
                          value={mp.displayName}
                          onSelect={() => {
                            setSelectedMarketplace(mp.id)
                            setMarketplaceOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMarketplace === mp.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {mp.displayName} ({mp.pluginCount.toLocaleString()})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars">Most Stars</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {typeFilters.map((filter) => {
            const Icon = filter.icon
            const count = getTypeCount(filter.value)
            return (
              <button
                key={filter.value}
                onClick={() => setSelectedType(filter.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                  selectedType === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {filter.label}
                <span className="text-xs opacity-70">({count.toLocaleString()})</span>
              </button>
            )
          })}
        </div>

        {/* Results count */}
        {(selectedType !== 'all' || selectedMarketplace !== 'all' || debouncedSearch) && (
          <p className="text-sm text-muted-foreground mb-6">
            Showing {plugins.length.toLocaleString()} result{plugins.length !== 1 ? 's' : ''}
            {selectedType !== 'all' && ` in ${typeFilters.find(f => f.value === selectedType)?.label}`}
            {selectedMarketplace !== 'all' && ` from ${filteredMarketplaces.find(m => m.id === selectedMarketplace)?.displayName}`}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </p>
        )}

        {/* Plugin grid */}
        {plugins.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plugins.map((plugin) => (
              <UnifiedPluginCard
                key={`${plugin.namespace || plugin.marketplaceName || 'unknown'}-${plugin.type}-${plugin.name}`}
                plugin={plugin}
              />
            ))}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No plugins found</p>
          </div>
        ) : null}

        {/* Load more trigger / Loading indicator */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
          {!hasMore && plugins.length > 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              Showing all {plugins.length.toLocaleString()} plugins
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
