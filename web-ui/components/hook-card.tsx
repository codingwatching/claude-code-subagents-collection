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
import { Copy, Download, Check, Zap, Puzzle } from 'lucide-react'
import { generateCategoryDisplayName, getCategoryIcon } from '@/lib/hooks-types'
import { generateHookMarkdown } from '@/lib/utils'
import type { Hook } from '@/lib/hooks-types'
import { InstallationModalEnhanced } from './installation-modal-enhanced'

interface HookCardProps {
  hook: Hook
}

const categoryColors: Record<string, string> = {
  'git': 'border-emerald-500/50 text-emerald-400',
  'automation': 'border-amber-500/50 text-amber-400',
  'notifications': 'border-violet-500/50 text-violet-400',
  'formatting': 'border-cyan-500/50 text-cyan-400',
  'security': 'border-red-500/50 text-red-400',
  'testing': 'border-blue-500/50 text-blue-400',
  'development': 'border-indigo-500/50 text-indigo-400'
}

const eventColors: Record<string, string> = {
  'PostToolUse': 'border-green-500/50 text-green-400 bg-green-500/10',
  'PreToolUse': 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
  'Stop': 'border-red-500/50 text-red-400 bg-red-500/10',
  'Notification': 'border-blue-500/50 text-blue-400 bg-blue-500/10'
}

const defaultColorClass = 'border-gray-500/50 text-gray-400'

export function HookCard({ hook }: HookCardProps) {
  const [copied, setCopied] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const categoryName = generateCategoryDisplayName(hook.category)
  const categoryIcon = getCategoryIcon(hook.category)
  const colorClass = categoryColors[hook.category] || defaultColorClass
  const eventColorClass = eventColors[hook.event] || 'border-gray-500/50 text-gray-400 bg-gray-500/10'

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const markdown = generateHookMarkdown(hook)
    await navigator.clipboard.writeText(markdown)

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const markdown = generateHookMarkdown(hook)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${hook.slug}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <TooltipProvider>
      <div className="relative group">
        <Link href={`/hook/${hook.slug}`}>
          <Card className="h-full card-hover border-border/50 hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden">
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                  <CardTitle className="text-xl">{hook.name}</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`${colorClass} bg-transparent border font-medium inline-flex items-center gap-1 whitespace-nowrap text-xs`}
                    variant="outline"
                  >
                    <span className="flex-shrink-0">{categoryIcon}</span>
                    <span>{categoryName}</span>
                  </Badge>
                  <Badge
                    className={`${eventColorClass} border font-medium inline-flex items-center gap-1 whitespace-nowrap text-xs`}
                    variant="outline"
                  >
                    {hook.event}
                  </Badge>
                </div>
              </div>
              <CardDescription className="line-clamp-3 text-muted-foreground/80">
                {hook.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hook.matcher && hook.matcher !== '*' && (
                <div className="text-sm text-muted-foreground/60 font-mono">
                  <span className="font-sans font-medium text-muted-foreground/80">Matcher:</span> {hook.matcher}
                </div>
              )}
              {hook.language && (
                <div className="text-sm text-muted-foreground/60 mt-1">
                  <span className="font-medium text-muted-foreground/80">Language:</span> {hook.language}
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
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? 'Copied!' : 'Copy markdown'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary/20 hover:text-primary border border-border/50"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download markdown file</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-primary/20 hover:text-primary border border-border/50"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowInstallModal(true)
                }}
              >
                <Puzzle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Install with Plugin</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <InstallationModalEnhanced
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        resourceType="hook"
        resourceName={hook.slug}
        category={hook.category}
        displayName={hook.name}
        markdownContent={generateHookMarkdown(hook)}
      />
    </TooltipProvider>
  )
}
