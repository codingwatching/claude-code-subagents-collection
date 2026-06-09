'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

/**
 * The homepage hero's primary action: a prominent search field that submits to
 * the /search results page. The global ⌘K palette is still available via the
 * nav (hinted by the kbd chip); this field gives a full-page discovery entry.
 */
export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <form onSubmit={submit} className="relative max-w-xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search plugins, skills, agents, commands, MCP servers…"
        aria-label="Search the catalog"
        className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-16 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
      <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
        ⌘K
      </kbd>
    </form>
  )
}
