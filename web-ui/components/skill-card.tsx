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
import { Copy, Download, Check, ExternalLink, Sparkles } from 'lucide-react'
import { generateCategoryDisplayName, getCategoryIcon } from '@/lib/category-utils'
import { generateSkillMarkdown } from '@/lib/utils'
import type { Skill } from '@/lib/skills-types'

interface SkillCardProps {
  skill: Skill
}

const categoryColors: Record<string, string> = {
  'document-processing': 'border-blue-500/50 text-blue-400',
  'development-code': 'border-green-500/50 text-green-400',
  'business-productivity': 'border-purple-500/50 text-purple-400',
  'creative-collaboration': 'border-pink-500/50 text-pink-400',
  'uncategorized': 'border-gray-500/50 text-gray-400'
}

const defaultColorClass = 'border-gray-500/50 text-gray-400'

export function SkillCard({ skill }: SkillCardProps) {
  const [copied, setCopied] = useState(false)
  const categoryName = generateCategoryDisplayName(skill.category)
  const categoryIcon = getCategoryIcon(skill.category)
  const colorClass = categoryColors[skill.category] || defaultColorClass

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const markdown = generateSkillMarkdown(skill)
    await navigator.clipboard.writeText(markdown)

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const markdown = generateSkillMarkdown(skill)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SKILL.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleOpenRepo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const skillUrl = `https://github.com/davepoon/buildwithclaude/tree/main/plugins/all-skills/skills/${skill.slug}`
    window.open(skillUrl, '_blank')
  }

  return (
    <TooltipProvider>
      <div className="relative group">
        <Link href={`/skill/${skill.slug}`}>
          <Card className="h-full card-hover border-border/50 hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden">
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-xl font-semibold">{skill.name}</CardTitle>
                  </div>
                </div>
                <Badge
                  className={`${colorClass} bg-transparent border font-medium inline-flex items-center gap-1 whitespace-nowrap text-xs`}
                  variant="outline"
                >
                  <span className="flex-shrink-0">{categoryIcon}</span>
                  <span>{categoryName}</span>
                </Badge>
              </div>
              <CardDescription className="line-clamp-3 text-muted-foreground/80">
                {skill.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {skill.allowedTools && (
                <div className="text-sm text-muted-foreground/60 font-mono">
                  <span className="font-sans font-medium text-muted-foreground/80">Tools:</span> {skill.allowedTools}
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
              <p>{copied ? 'Copied!' : 'Copy SKILL.md'}</p>
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
              <p>Download SKILL.md</p>
            </TooltipContent>
          </Tooltip>

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
        </div>
      </div>
    </TooltipProvider>
  )
}
