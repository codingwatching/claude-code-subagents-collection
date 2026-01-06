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
  plugin: 'Plugin',
}

function getTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'subagent':
      return 'bg-blue-500/10 text-blue-500'
    case 'command':
      return 'bg-green-500/10 text-green-500'
    case 'hook':
      return 'bg-orange-500/10 text-orange-500'
    case 'skill':
      return 'bg-yellow-500/10 text-yellow-500'
    case 'plugin':
      return 'bg-purple-500/10 text-purple-500'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function isExternalPlugin(plugin: UnifiedPlugin): boolean {
  // External plugins have a repository URL and no local file path
  return !!plugin.repository && !plugin.file
}

function getDetailUrl(plugin: UnifiedPlugin): string {
  switch (plugin.type) {
    case 'subagent': return `/subagent/${plugin.name}`
    case 'command': return `/command/${plugin.name}`
    case 'hook': return `/hook/${plugin.name}`
    case 'skill': return `/skill/${plugin.name}`
    case 'plugin': return plugin.repository || '#'
    default: return '#'
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

  if (plugin.installCommand) {
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
  const isExternal = isExternalPlugin(plugin)

  const githubUrl = isExternal
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
      {/* Header: Name + Type Badge + Marketplace Badge */}
      <div className="mb-3">
        <h3 className="font-medium mb-1">{plugin.name}</h3>
        <div className="flex flex-wrap items-center gap-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClasses(plugin.type)}`}>
            {typeLabels[plugin.type]}
          </span>
          {plugin.marketplaceName && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-xs text-indigo-500 font-medium truncate max-w-[140px]">
              {plugin.marketplaceName}
            </span>
          )}
        </div>
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
  if (isExternal) {
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
