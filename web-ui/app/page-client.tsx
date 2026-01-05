'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import type { Plugin } from '@/lib/plugins-types'

interface HomePageClientProps {
  pluginCount: number
  subagentCount: number
  commandCount: number
  skillCount: number
  featuredPlugins: Plugin[]
}

export default function HomePageClient({
  pluginCount,
  subagentCount,
  commandCount,
  skillCount,
  featuredPlugins,
}: HomePageClientProps) {
  const categories = [
    { href: '/plugins', label: 'Plugins', count: pluginCount },
    { href: '/subagents', label: 'Subagents', count: subagentCount },
    { href: '/commands', label: 'Commands', count: commandCount },
    { href: '/skills', label: 'Skills', count: skillCount },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-display-1 mb-6">
              The plugin marketplace for{' '}
              <span className="text-accent">Claude Code</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
              Extend Claude Code with {pluginCount}+ plugins, {subagentCount}+ subagents,
              and {commandCount}+ commands. Install with a single click.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/plugins">
                <Button size="lg" className="btn-primary gap-2">
                  Browse Plugins <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/davepoon/buildwithclaude"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline">
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by type */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href}>
                <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors group">
                  <div className="text-3xl font-serif text-primary mb-2">
                    {cat.count}
                  </div>
                  <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {cat.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured plugins */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-display-3">Featured Plugins</h2>
            <Link href="/plugins" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPlugins.map((plugin) => (
              <Link key={plugin.name} href={`/plugin/${plugin.name}`}>
                <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors h-full">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-medium">{plugin.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      v{plugin.version}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {plugin.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick install */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-display-3 mb-4">Get started</h2>
            <p className="text-muted-foreground mb-8">
              Install the BWC CLI to manage plugins from the command line
            </p>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm text-left overflow-x-auto">
              <code>npx @anthropic/bwc-cli add --plugin your-plugin-name</code>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
