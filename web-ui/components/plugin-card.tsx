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
import { Check, ExternalLink, Package, Copy } from 'lucide-react'
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

  const categoryName = generateCategoryDisplayName(plugin.category)
  const categoryIcon = getCategoryIcon(plugin.category)
  const colorClass = categoryColors[plugin.category] || defaultColorClass

  const installCommand = `/plugin install ${plugin.name}`

  const handleCopyInstall = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    await navigator.clipboard.writeText(installCommand)
    setCopiedInstall(true)
    setTimeout(() => setCopiedInstall(false), 2000)
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
        <Link href={`/plugin/${plugin.name}`}>
          <Card className="h-full card-hover border-border/50 hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden">
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary flex-shrink-0" />
                  <CardTitle className="text-xl font-mono">{plugin.name}</CardTitle>
                </div>
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
            <CardContent>
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
            </CardContent>
          </Card>
        </Link>

        {/* Action buttons - positioned at bottom right */}
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary/20 hover:text-primary border border-border/50"
                onClick={handleCopyInstall}
              >
                {copiedInstall ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copiedInstall ? 'Copied!' : 'Copy install command'}</p>
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
