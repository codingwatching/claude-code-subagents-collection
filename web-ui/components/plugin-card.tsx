'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { generateCategoryDisplayName } from '@/lib/category-utils'
import type { Plugin } from '@/lib/plugins-types'

interface PluginCardProps {
  plugin: Plugin
}

export function PluginCard({ plugin }: PluginCardProps) {
  const [copied, setCopied] = useState(false)

  const categoryName = generateCategoryDisplayName(plugin.category)
  const installCommand = `bwc add --plugin ${plugin.name}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenRepo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(`https://github.com/davepoon/buildwithclaude/tree/main/plugins/${plugin.name}`, '_blank')
  }

  return (
    <Link href={`/plugin/${plugin.name}`}>
      <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col bg-card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{plugin.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{categoryName}</span>
              <span className="text-xs text-muted-foreground">v{plugin.version}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
          {plugin.description}
        </p>

        <TooltipProvider>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy install command</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleOpenRepo}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  GitHub
                </Button>
              </TooltipTrigger>
              <TooltipContent>View on GitHub</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </Link>
  )
}
