'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Copy, Check, ExternalLink, Package, Terminal } from 'lucide-react'
import { generateCategoryDisplayName, getCategoryIcon } from '@/lib/category-utils'
import type { Plugin } from '@/lib/plugins-types'

interface PluginCardProps {
  plugin: Plugin
}

const categoryColors: Record<string, string> = {
  'utilities': 'border-purple-500/50 text-purple-400',
  'agents': 'border-blue-500/50 text-blue-400',
  'commands': 'border-green-500/50 text-green-400',
  'hooks': 'border-orange-500/50 text-orange-400',
  'mcp-servers': 'border-cyan-500/50 text-cyan-400'
}

const defaultColorClass = 'border-gray-500/50 text-gray-400'

export function PluginCard({ plugin }: PluginCardProps) {
  const [copiedInstall, setCopiedInstall] = useState(false)
  const [copiedMarketplace, setCopiedMarketplace] = useState(false)

  const categoryName = generateCategoryDisplayName(plugin.category)
  const categoryIcon = getCategoryIcon(plugin.category)
  const colorClass = categoryColors[plugin.category] || defaultColorClass

  const installCommand = `/plugin install ${plugin.name}`
  const marketplaceCommand = '/plugin marketplace add davepoon/buildwithclaude'

  const handleCopyInstall = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    await navigator.clipboard.writeText(installCommand)
    setCopiedInstall(true)
    setTimeout(() => setCopiedInstall(false), 2000)
  }

  const handleCopyMarketplace = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    await navigator.clipboard.writeText(marketplaceCommand)
    setCopiedMarketplace(true)
    setTimeout(() => setCopiedMarketplace(false), 2000)
  }

  const handleOpenRepo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (plugin.repository) {
      window.open(plugin.repository, '_blank')
    }
  }

  // Limit keywords to display
  const displayKeywords = plugin.keywords.slice(0, 3)
  const remainingKeywords = plugin.keywords.length - 3

  return (
    <TooltipProvider>
      <div className="relative group">
        <Card className="h-full card-hover border-border/50 hover:border-primary/20 transition-all duration-300 overflow-hidden">
          <CardHeader>
            <div className="space-y-2">
              <Link href={`/plugin/${plugin.name}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Package className="h-5 w-5 text-primary flex-shrink-0" />
                <CardTitle className="text-xl font-mono">{plugin.name}</CardTitle>
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`${colorClass} bg-transparent border font-medium inline-flex items-center gap-1 whitespace-nowrap text-xs`}
                  variant="outline"
                >
                  <span className="flex-shrink-0">{categoryIcon}</span>
                  <span>{categoryName}</span>
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  v{plugin.version}
                </Badge>
              </div>
            </div>
            <CardDescription className="line-clamp-3 text-muted-foreground/80">
              {plugin.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Keywords */}
            {displayKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayKeywords.map((keyword, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs bg-muted/30 border-muted-foreground/20"
                  >
                    {keyword}
                  </Badge>
                ))}
                {remainingKeywords > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-muted/30 border-muted-foreground/20"
                  >
                    +{remainingKeywords} more
                  </Badge>
                )}
              </div>
            )}

            {/* Install commands */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted/50 px-2 py-1 rounded font-mono truncate">
                  {installCommand}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={handleCopyInstall}
                    >
                      {copiedInstall ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copiedInstall ? 'Copied!' : 'Copy install command'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Link
                href={`/plugin/${plugin.name}`}
                className="block text-xs text-center text-muted-foreground hover:text-primary transition-colors"
              >
                View details
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons - positioned at top right */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary/20 hover:text-primary border border-border/50"
                onClick={handleCopyMarketplace}
              >
                {copiedMarketplace ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Terminal className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copiedMarketplace ? 'Copied!' : 'Copy marketplace add command'}</p>
            </TooltipContent>
          </Tooltip>

          {plugin.repository && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary/20 hover:text-primary border border-border/50"
                  onClick={handleOpenRepo}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View on GitHub</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
