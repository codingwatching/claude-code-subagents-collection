'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Copy, Download } from 'lucide-react'
import { generateCategoryDisplayName } from '@/lib/hooks-types'
import { generateHookMarkdown } from '@/lib/utils'
import type { Hook } from '@/lib/hooks-types'

interface HookCardProps {
  hook: Hook
}

export function HookCard({ hook }: HookCardProps) {
  const [copied, setCopied] = useState(false)

  const categoryName = generateCategoryDisplayName(hook.category)

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
    <Link href={`/hook/${hook.slug}`}>
      <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col">
        <div className="mb-3">
          <h3 className="font-medium mb-1">{hook.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{categoryName}</span>
            <span>·</span>
            <span className="font-mono">{hook.event}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
          {hook.description}
        </p>

        {hook.matcher && hook.matcher !== '*' && (
          <p className="text-xs text-muted-foreground/70 font-mono mb-4 truncate">
            {hook.matcher}
          </p>
        )}

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
              <TooltipContent>Copy markdown</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download markdown</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </Link>
  )
}
