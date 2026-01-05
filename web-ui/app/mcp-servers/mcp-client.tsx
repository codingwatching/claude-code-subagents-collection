'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MCPCard } from '@/components/mcp-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, TrendingDown, TrendingUp, Calendar, CalendarDays, SortAsc, SortDesc } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type MCPServer,
  SOURCE_INDICATORS
} from '@/lib/mcp-types'
import { type MCPCategoryMetadata } from '@/lib/mcp-server'

interface MCPPageClientProps {
  allServers: MCPServer[]
  categories: MCPCategoryMetadata[]
  popularServers?: MCPServer[]
  featuredServers?: MCPServer[]
  trendingServers?: MCPServer[]
}

export default function MCPPageClient({
  allServers,
  categories,
  popularServers = [],
  featuredServers = [],
  trendingServers = []
}: MCPPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'downloads-desc' | 'downloads-asc' | 'newest' | 'oldest' | 'name-asc' | 'name-desc'>('downloads-desc')

  const ITEMS_PER_PAGE = 24

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const sourceParam = searchParams.get('source')
    const sortParam = searchParams.get('sort')

    if (categoryParam && categories.some(cat => cat.id === categoryParam)) {
      setSelectedCategory(categoryParam)
    }

    if (sourceParam && ['official-mcp', 'docker'].includes(sourceParam)) {
      setSelectedSource(sourceParam)
    }

    if (sortParam && ['downloads-desc', 'downloads-asc', 'newest', 'oldest', 'name-asc', 'name-desc'].includes(sortParam)) {
      setSortBy(sortParam as typeof sortBy)
    }
  }, [searchParams, categories])

  const handleCategoryChange = (category: string | 'all') => {
    setSelectedCategory(category)
    updateURL({ category })
  }

  const handleSourceChange = (source: string) => {
    setSelectedSource(source)
    if (source === 'official-mcp' && (sortBy === 'downloads-desc' || sortBy === 'downloads-asc')) {
      setSortBy('name-asc')
      updateURL({ source, sort: 'name-asc' })
    } else {
      updateURL({ source })
    }
  }

  const updateURL = (newParams: { category?: string | 'all', source?: string, sort?: string }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newParams.category !== undefined) {
      if (newParams.category === 'all') {
        params.delete('category')
      } else {
        params.set('category', newParams.category)
      }
    }

    if (newParams.source !== undefined) {
      if (newParams.source === 'all') {
        params.delete('source')
      } else {
        params.set('source', newParams.source)
      }
    }

    if (newParams.sort !== undefined) {
      if (newParams.sort === 'downloads-desc') {
        params.delete('sort')
      } else {
        params.set('sort', newParams.sort)
      }
    }

    const newUrl = params.toString() ? `/mcp-servers?${params.toString()}` : '/mcp-servers'
    router.replace(newUrl)
  }

  const filteredServers = useMemo(() => {
    let filtered = allServers

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(server => server.category === selectedCategory)
    }

    if (selectedSource !== 'all') {
      if (selectedSource === 'docker') {
        filtered = filtered.filter(server =>
          server.source_registry?.type === 'docker' || server.docker_mcp_available
        )
      } else {
        filtered = filtered.filter(server => server.source_registry?.type === selectedSource)
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(q) ||
        server.display_name.toLowerCase().includes(q) ||
        server.description.toLowerCase().includes(q) ||
        server.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    const sorted = [...filtered].sort((a, b) => {
      switch(sortBy) {
        case 'downloads-desc':
          return (b.stats?.docker_pulls || 0) - (a.stats?.docker_pulls || 0)
        case 'downloads-asc':
          return (a.stats?.docker_pulls || 0) - (b.stats?.docker_pulls || 0)
        case 'newest':
          return new Date(b.stats?.last_updated || 0).getTime() - new Date(a.stats?.last_updated || 0).getTime()
        case 'oldest':
          return new Date(a.stats?.last_updated || 0).getTime() - new Date(b.stats?.last_updated || 0).getTime()
        case 'name-asc':
          return a.display_name.localeCompare(b.display_name)
        case 'name-desc':
          return b.display_name.localeCompare(a.display_name)
        default:
          return 0
      }
    })

    return sorted
  }, [allServers, selectedCategory, selectedSource, searchQuery, sortBy])

  const sourceCounts = useMemo(() => {
    const officialMcp = allServers.filter(server => server.source_registry?.type === 'official-mcp').length
    const docker = allServers.filter(server =>
      server.source_registry?.type === 'docker' || server.docker_mcp_available
    ).length
    return { 'official-mcp': officialMcp, docker }
  }, [allServers])

  const hasActiveFilters = useMemo(() => {
    return searchQuery !== '' || selectedCategory !== 'all' || selectedSource !== 'all'
  }, [searchQuery, selectedCategory, selectedSource])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedSource])

  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredServers.slice(startIndex, endIndex)
  }, [filteredServers, currentPage])

  const totalPages = Math.ceil(filteredServers.length / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-display-2 mb-2">MCP Servers</h1>
          <p className="text-muted-foreground">
            {allServers.length} Model Context Protocol servers
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MCP servers..."
            className="max-w-md bg-card border-border"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-4">
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

        {/* Source and Sort controls */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          {/* Source filters */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground py-1.5">Source:</span>
            <button
              onClick={() => handleSourceChange('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedSource === 'all'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              All ({allServers.length})
            </button>
            <button
              onClick={() => handleSourceChange('official-mcp')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedSource === 'official-mcp'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {SOURCE_INDICATORS['official-mcp'].icon} Official ({sourceCounts['official-mcp']})
            </button>
            <button
              onClick={() => handleSourceChange('docker')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedSource === 'docker'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {SOURCE_INDICATORS.docker.icon} Docker ({sourceCounts.docker})
            </button>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortBy === 'downloads-desc' ? 'Most Downloaded' :
                 sortBy === 'downloads-asc' ? 'Least Downloaded' :
                 sortBy === 'newest' ? 'Newest' :
                 sortBy === 'oldest' ? 'Oldest' :
                 sortBy === 'name-asc' ? 'A to Z' :
                 'Z to A'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {selectedSource !== 'official-mcp' && (
                <>
                  <DropdownMenuItem onClick={() => {
                    setSortBy('downloads-desc')
                    updateURL({ sort: 'downloads-desc' })
                  }}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Most Downloaded
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSortBy('downloads-asc')
                    updateURL({ sort: 'downloads-asc' })
                  }}>
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Least Downloaded
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => {
                setSortBy('newest')
                updateURL({ sort: 'newest' })
              }}>
                <Calendar className="h-4 w-4 mr-2" />
                Newest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy('oldest')
                updateURL({ sort: 'oldest' })
              }}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Oldest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy('name-asc')
                updateURL({ sort: 'name-asc' })
              }}>
                <SortAsc className="h-4 w-4 mr-2" />
                A to Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSortBy('name-desc')
                updateURL({ sort: 'name-desc' })
              }}>
                <SortDesc className="h-4 w-4 mr-2" />
                Z to A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Featured Sections - Only show when no filters active and on first page */}
        {!hasActiveFilters && currentPage === 1 && (popularServers.length > 0 || featuredServers.length > 0) && (
          <div className="mb-12">
            {popularServers.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-medium mb-4">Popular</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularServers.map((server) => (
                    <MCPCard key={server.path} server={server} />
                  ))}
                </div>
              </div>
            )}

            {featuredServers.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-medium mb-4">Featured</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredServers.map((server) => (
                    <MCPCard key={server.path} server={server} />
                  ))}
                </div>
              </div>
            )}

            <hr className="border-border/50" />
          </div>
        )}

        {/* All Servers header when featured visible */}
        {(!hasActiveFilters && currentPage === 1 && (popularServers.length > 0 || featuredServers.length > 0)) && (
          <h2 className="text-xl font-medium mb-4 mt-8">All Servers</h2>
        )}

        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground mb-6">
            {filteredServers.length} result{filteredServers.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.displayName || selectedCategory}`}
          </p>
        )}

        {/* Grid */}
        {filteredServers.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedServers.map((server) => (
                <MCPCard key={server.path} server={server} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-muted-foreground"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="text-muted-foreground"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No MCP servers found</p>
          </div>
        )}
      </div>
    </div>
  )
}
