'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Loader2,
  Package,
  Server,
  Sparkles,
  SquareTerminal,
  Store,
  Webhook,
  CornerDownLeft,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useDebounce } from '@/hooks/use-debounce'
import { HighlightedText } from '@/components/highlighted-text'
import {
  TYPE_LABELS,
  TYPE_LABELS_PLURAL,
  TYPE_ORDER,
  getTypeBadgeClasses,
  type ContentType,
  type SearchHit,
} from '@/lib/content-types'

const QUICK_LINKS: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: '/plugins', label: 'Plugins', icon: <Package className="h-4 w-4" /> },
  { href: '/skills', label: 'Skills', icon: <Sparkles className="h-4 w-4" /> },
  { href: '/subagents', label: 'Subagents', icon: <Bot className="h-4 w-4" /> },
  { href: '/commands', label: 'Commands', icon: <SquareTerminal className="h-4 w-4" /> },
  { href: '/hooks', label: 'Hooks', icon: <Webhook className="h-4 w-4" /> },
  { href: '/mcp-servers', label: 'MCP Servers', icon: <Server className="h-4 w-4" /> },
  { href: '/marketplaces', label: 'Marketplaces', icon: <Store className="h-4 w-4" /> },
]

function snippet(hit: SearchHit): string | undefined {
  return hit._formatted?.description || hit._formatted?.content || hit.description || undefined
}

function groupByType(hits: SearchHit[]): [ContentType, SearchHit[]][] {
  const groups = new Map<ContentType, SearchHit[]>()
  for (const hit of hits) {
    const list = groups.get(hit.type)
    if (list) list.push(hit)
    else groups.set(hit.type, [hit])
  }
  return TYPE_ORDER.filter((t) => groups.has(t)).map((t) => [t, groups.get(t)!])
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 250)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [facets, setFacets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)

  // Clear the query when the palette closes so it opens fresh next time.
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  // Debounced fetch against the unified search endpoint.
  useEffect(() => {
    if (!open) return
    const q = debounced.trim()
    if (!q) {
      setHits([])
      setFacets({})
      setLoading(false)
      setErrored(false)
      return
    }
    const ac = new AbortController()
    setLoading(true)
    setErrored(false)
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=24`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        setHits(data.hits ?? [])
        setFacets(data.facetDistribution?.type ?? {})
        setLoading(false)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setErrored(true)
        setLoading(false)
      })
    return () => ac.abort()
  }, [debounced, open])

  const grouped = useMemo(() => groupByType(hits), [hits])
  const trimmed = debounced.trim()

  const go = (url: string) => {
    onOpenChange(false)
    if (url.startsWith('http')) window.open(url, '_blank')
    else router.push(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0" style={{ maxWidth: '36rem' }}>
        <DialogTitle className="sr-only">Search Build with Claude</DialogTitle>
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search plugins, skills, agents, commands, MCP servers…"
          />
          <CommandList className="max-h-[60vh]">
            <div aria-live="polite" className="sr-only">
              {loading ? 'Searching' : trimmed ? `${hits.length} results` : ''}
            </div>

            {loading && (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {!loading && errored && (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Search is temporarily unavailable. Try the browse pages below.
              </div>
            )}

            {!loading && !errored && trimmed && hits.length === 0 && (
              <CommandEmpty>No results for “{trimmed}”. Try fewer or different keywords.</CommandEmpty>
            )}

            {/* Idle state: quick links to the browse pages. */}
            {!trimmed && (
              <CommandGroup heading="Browse">
                {QUICK_LINKS.map((link) => (
                  <CommandItem
                    key={link.href}
                    value={`go:${link.label}`}
                    onSelect={() => go(link.href)}
                    className="group data-[selected=true]:bg-primary/15 data-[selected=true]:text-foreground"
                  >
                    <span className="text-muted-foreground group-data-[selected=true]:text-primary">
                      {link.icon}
                    </span>
                    {link.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Grouped results. */}
            {grouped.map(([type, list]) => (
              <CommandGroup
                key={type}
                heading={`${TYPE_LABELS_PLURAL[type]}${facets[type] ? ` (${facets[type].toLocaleString()})` : ''}`}
              >
                {list.map((hit) => (
                  <CommandItem
                    key={hit.objectID}
                    value={hit.objectID}
                    onSelect={() => go(hit.url)}
                    className="gap-3 data-[selected=true]:bg-primary/15 data-[selected=true]:text-foreground"
                  >
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${getTypeBadgeClasses(type)}`}
                    >
                      {TYPE_LABELS[type]}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">
                        <HighlightedText text={hit._formatted?.name || hit.name} />
                      </span>
                      {snippet(hit) && (
                        <span className="truncate text-xs text-muted-foreground">
                          <HighlightedText text={snippet(hit)} />
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {/* See-all footer. */}
            {trimmed && hits.length > 0 && (
              <CommandGroup>
                <CommandItem
                  value="__see_all__"
                  onSelect={() => go(`/search?q=${encodeURIComponent(trimmed)}`)}
                  className="gap-2 text-sm text-primary data-[selected=true]:bg-primary/15 data-[selected=true]:text-primary"
                >
                  <CornerDownLeft className="h-4 w-4" />
                  See all results for “{trimmed}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
