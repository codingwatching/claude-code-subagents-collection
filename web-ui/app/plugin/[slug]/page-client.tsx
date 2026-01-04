'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowLeft, Copy, Check, ExternalLink, Package, Terminal, User, Scale, Bot, Command, Webhook, Server, ChevronRight } from 'lucide-react'
import { generateCategoryDisplayName, getCategoryIcon } from '@/lib/category-utils'
import type { Plugin } from '@/lib/plugins-types'

interface PluginPageClientProps {
  plugin: Plugin
}

// Keywords to skip when extracting item names
const SKIP_KEYWORDS = new Set([
  'agents', 'subagents', 'agent', 'subagent',
  'commands', 'command', 'slash-commands', 'slash-command',
  'hooks', 'hook', 'automation', 'notifications',
  'mcp-servers', 'mcp', 'mcp-server', 'docker',
  'claude-code', 'claude', 'plugin', 'plugins',
  'ai', 'development', 'productivity', 'utilities',
])

// Extract linked item names from keywords based on category
function extractLinkedItems(plugin: Plugin): { name: string; href: string }[] {
  const items: { name: string; href: string }[] = []

  // Also skip the category itself
  const skipSet = new Set([...SKIP_KEYWORDS, plugin.category])

  for (const keyword of plugin.keywords) {
    const normalizedKeyword = keyword.toLowerCase()

    // Skip generic keywords
    if (skipSet.has(normalizedKeyword)) {
      continue
    }

    // Determine link based on category
    let href = ''
    switch (plugin.category) {
      case 'agents':
        href = `/subagent/${keyword}`
        break
      case 'commands':
        href = `/command/${keyword}`
        break
      case 'hooks':
        href = `/hook/${keyword}`
        break
      case 'mcp-servers':
        // MCP servers link to the main page
        href = '/mcp-servers'
        break
      default:
        continue
    }

    items.push({ name: keyword, href })
  }

  return items
}

// Get the appropriate icon and label for linked items section
function getLinkedItemsConfig(category: string): { icon: React.ReactNode; label: string; singularLabel: string } {
  switch (category) {
    case 'agents':
      return { icon: <Bot className="h-4 w-4" />, label: 'Included Agents', singularLabel: 'Agent' }
    case 'commands':
      return { icon: <Command className="h-4 w-4" />, label: 'Included Commands', singularLabel: 'Command' }
    case 'hooks':
      return { icon: <Webhook className="h-4 w-4" />, label: 'Included Hooks', singularLabel: 'Hook' }
    case 'mcp-servers':
      return { icon: <Server className="h-4 w-4" />, label: 'Included MCP Servers', singularLabel: 'MCP Server' }
    default:
      return { icon: <Package className="h-4 w-4" />, label: 'Included Items', singularLabel: 'Item' }
  }
}

const categoryColors: Record<string, string> = {
  'utilities': 'border-purple-500/50 text-purple-400 bg-purple-500/10',
  'agents': 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  'commands': 'border-green-500/50 text-green-400 bg-green-500/10',
  'hooks': 'border-orange-500/50 text-orange-400 bg-orange-500/10',
  'mcp-servers': 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
}

const defaultColorClass = 'border-gray-500/50 text-gray-400 bg-gray-500/10'

export function PluginPageClient({ plugin }: PluginPageClientProps) {
  const [copiedMarketplace, setCopiedMarketplace] = useState(false)
  const [copiedInstall, setCopiedInstall] = useState(false)

  const categoryName = generateCategoryDisplayName(plugin.category)
  const categoryIcon = getCategoryIcon(plugin.category)
  const colorClass = categoryColors[plugin.category] || defaultColorClass

  const marketplaceCommand = '/plugin marketplace add davepoon/buildwithclaude'
  const installCommand = `/plugin install ${plugin.name}`

  const linkedItems = extractLinkedItems(plugin)
  const linkedItemsConfig = getLinkedItemsConfig(plugin.category)

  // Filter out linked item keywords for the keywords section
  const linkedItemNames = new Set(linkedItems.map(item => item.name.toLowerCase()))
  const displayKeywords = plugin.keywords.filter(k => !linkedItemNames.has(k.toLowerCase()) && !SKIP_KEYWORDS.has(k.toLowerCase()))

  const handleCopyMarketplace = async () => {
    await navigator.clipboard.writeText(marketplaceCommand)
    setCopiedMarketplace(true)
    setTimeout(() => setCopiedMarketplace(false), 2000)
  }

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText(installCommand)
    setCopiedInstall(true)
    setTimeout(() => setCopiedInstall(false), 2000)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back button */}
          <Link href="/plugins" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Plugins
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary flex-shrink-0" />
                <h1 className="text-3xl font-bold font-mono">{plugin.name}</h1>
              </div>
              <Badge variant="secondary" className="text-sm">
                v{plugin.version}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge
                className={`${colorClass} border font-medium inline-flex items-center gap-1 text-sm px-3 py-1`}
                variant="outline"
              >
                <span>{categoryIcon}</span>
                <span>{categoryName}</span>
              </Badge>
            </div>

            <p className="text-lg text-muted-foreground">{plugin.description}</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-primary/10 rounded-lg p-6 mb-8 border border-primary/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={handleCopyInstall}
                className="w-full justify-center gap-2"
                variant="outline"
              >
                {copiedInstall ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Install Command
                  </>
                )}
              </Button>
              {plugin.repository && (
                <a href={plugin.repository} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full justify-center gap-2" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                    View on GitHub
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Installation */}
          <div className="bg-muted rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Installation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                  Step 1: Add the marketplace (one-time setup)
                </h3>
                <div className="bg-background rounded p-3 font-mono text-sm flex items-center justify-between">
                  <span className="break-all">{marketplaceCommand}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 shrink-0"
                        onClick={handleCopyMarketplace}
                      >
                        {copiedMarketplace ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copiedMarketplace ? 'Copied!' : 'Copy command'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                  Step 2: Install this plugin
                </h3>
                <div className="bg-background rounded p-3 font-mono text-sm flex items-center justify-between">
                  <span className="break-all">{installCommand}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 shrink-0"
                        onClick={handleCopyInstall}
                      >
                        {copiedInstall ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copiedInstall ? 'Copied!' : 'Copy command'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Items Section */}
          {linkedItems.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-6 mb-8 border border-border/50">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {linkedItemsConfig.icon}
                {linkedItemsConfig.label}
              </h2>
              <div className="space-y-2">
                {linkedItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <span className="font-mono text-sm">{item.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Click to view detailed documentation for each {linkedItemsConfig.singularLabel.toLowerCase()}
              </p>
            </div>
          )}

          {/* Keywords */}
          {displayKeywords.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {displayKeywords.map((keyword, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-sm bg-muted/30 border-muted-foreground/20"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="bg-muted rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Author:</span>
                {plugin.author.url ? (
                  <a
                    href={plugin.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {plugin.author.name}
                  </a>
                ) : (
                  <span className="text-sm">{plugin.author.name}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">License:</span>
                <span className="text-sm">{plugin.license}</span>
              </div>
              {plugin.repository && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Repository:</span>
                  <a
                    href={plugin.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {plugin.repository.replace('https://github.com/', '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Source:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">{plugin.source}</code>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 flex-wrap">
            {plugin.repository && (
              <a href={plugin.repository} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on GitHub
                </Button>
              </a>
            )}
            <Link href="/plugins">
              <Button variant="outline">Browse More Plugins</Button>
            </Link>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
