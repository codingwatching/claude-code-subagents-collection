'use client'

import { useState, useMemo } from 'react'
import { UnifiedPluginCard } from '@/components/unified-plugin-card'
import { Input } from '@/components/ui/input'
import { Bot, Terminal, Webhook, Sparkles, Package } from 'lucide-react'
import type { UnifiedPlugin, PluginType } from '@/lib/plugin-types'

interface PluginStats {
  total: number
  subagents: number
  commands: number
  hooks: number
  skills: number
  plugins: number
}

interface PluginsPageClientProps {
  plugins: UnifiedPlugin[]
  stats: PluginStats
}

const typeFilters: { value: PluginType | 'all'; label: string; icon: React.ElementType | null }[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'subagent', label: 'Subagents', icon: Bot },
  { value: 'command', label: 'Commands', icon: Terminal },
  { value: 'hook', label: 'Hooks', icon: Webhook },
  { value: 'skill', label: 'Skills', icon: Sparkles },
  { value: 'plugin', label: 'Plugins', icon: Package },
]

export default function PluginsPageClient({ plugins, stats }: PluginsPageClientProps) {
  const [selectedType, setSelectedType] = useState<PluginType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPlugins = useMemo(() => {
    let filtered = plugins

    if (selectedType !== 'all') {
      filtered = filtered.filter(plugin => plugin.type === selectedType)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(plugin =>
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.category.toLowerCase().includes(q) ||
        plugin.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [plugins, selectedType, searchQuery])

  const getTypeCount = (type: PluginType | 'all') => {
    if (type === 'all') return stats.total
    if (type === 'subagent') return stats.subagents
    if (type === 'command') return stats.commands
    if (type === 'hook') return stats.hooks
    if (type === 'skill') return stats.skills
    if (type === 'plugin') return stats.plugins
    return 0
  }

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
            Browse {stats.total} plugins across subagents, commands, hooks, skills, and external community plugins
          </p>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-500">
              <Bot className="h-4 w-4" />
              {stats.subagents} subagents
            </span>
            <span className="flex items-center gap-1.5 text-green-500">
              <Terminal className="h-4 w-4" />
              {stats.commands} commands
            </span>
            <span className="flex items-center gap-1.5 text-orange-500">
              <Webhook className="h-4 w-4" />
              {stats.hooks} hooks
            </span>
            <span className="flex items-center gap-1.5 text-yellow-500">
              <Sparkles className="h-4 w-4" />
              {stats.skills} skills
            </span>
            {stats.plugins > 0 && (
              <span className="flex items-center gap-1.5 text-purple-500">
                <Package className="h-4 w-4" />
                {stats.plugins} plugins
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md bg-card border-border"
          />
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
                <span className="text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Results count */}
        {(selectedType !== 'all' || searchQuery) && (
          <p className="text-sm text-muted-foreground mb-6">
            {filteredPlugins.length} result{filteredPlugins.length !== 1 ? 's' : ''}
            {selectedType !== 'all' && ` in ${typeFilters.find(f => f.value === selectedType)?.label}`}
          </p>
        )}

        {/* Plugin grid */}
        {filteredPlugins.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => (
              <UnifiedPluginCard key={`${plugin.type}-${plugin.name}`} plugin={plugin} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No plugins found</p>
          </div>
        )}
      </div>
    </div>
  )
}
