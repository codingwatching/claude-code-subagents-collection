'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Copy, Download, ExternalLink } from 'lucide-react'
import type { UnifiedPlugin } from '@/lib/plugin-types'

interface UnifiedPluginCardProps {
  plugin: UnifiedPlugin
}

const typeLabels: Record<string, string> = {
  subagent: 'Subagent',
  command: 'Command',
  hook: 'Hook',
  skill: 'Skill',
  external: 'Plugin',
}

function getDetailUrl(plugin: UnifiedPlugin): string {
  switch (plugin.type) {
    case 'subagent': return `/subagent/${plugin.name}`
    case 'command': return `/command/${plugin.name}`
    case 'hook': return `/hook/${plugin.name}`
    case 'skill': return `/skill/${plugin.name}`
    case 'external': return plugin.repository || '#'
  }
}

function generatePluginMarkdown(plugin: UnifiedPlugin): string {
  const lines: string[] = []
  lines.push(`# ${plugin.name}`)
  lines.push('')
  lines.push(`**Type:** ${typeLabels[plugin.type]}`)
  lines.push(`**Category:** ${plugin.category}`)
  lines.push('')
  lines.push('## Description')
  lines.push('')
  lines.push(plugin.description)
  lines.push('')

  if (plugin.isExternal && plugin.installCommand) {
    lines.push('## Installation')
    lines.push('')
    lines.push('```bash')
    lines.push(plugin.installCommand)
    lines.push('```')
    lines.push('')
  }

  if (plugin.tags && plugin.tags.length > 0) {
    lines.push('## Tags')
    lines.push('')
    lines.push(plugin.tags.join(', '))
    lines.push('')
  }

  return lines.join('\n')
}

export function UnifiedPluginCard({ plugin }: UnifiedPluginCardProps) {
  const [copied, setCopied] = useState(false)

  const githubUrl = plugin.isExternal
    ? plugin.repository
    : `https://github.com/davepoon/buildwithclaude/tree/main/plugins/${plugin.file}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const markdown = generatePluginMarkdown(plugin)
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const markdown = generatePluginMarkdown(plugin)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${plugin.name}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleOpenRepo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (githubUrl) {
      window.open(githubUrl, '_blank')
    }
  }

  const cardContent = (
    <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col bg-card">
      {/* Header: Name + Type Badge + External Badge */}
      <div className="mb-3">
        <h3 className="font-medium mb-1">{plugin.name}</h3>
        <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
          {typeLabels[plugin.type]}
        </span>
        {plugin.isExternal && (
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-xs text-purple-500 font-medium ml-1">
            External
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
        {plugin.description}
      </p>

      {/* Action Buttons */}
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
  )

  // Use Link for internal plugins, <a> for external
  if (plugin.isExternal) {
    return (
      <a href={plugin.repository || '#'} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </a>
    )
  }

  return (
    <Link href={getDetailUrl(plugin)}>
      {cardContent}
    </Link>
  )
}
