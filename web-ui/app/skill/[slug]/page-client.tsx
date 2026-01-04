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
import { ArrowLeft, Copy, Download, Check, ExternalLink, Sparkles } from 'lucide-react'
import { type Skill } from '@/lib/skills-types'
import { generateSkillMarkdown } from '@/lib/utils'
import { generateCategoryDisplayName, getCategoryIcon } from '@/lib/category-utils'

interface SkillPageClientProps {
  skill: Skill
}

const categoryColors: Record<string, string> = {
  'document-processing': 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  'development-code': 'border-green-500/50 text-green-400 bg-green-500/10',
  'business-productivity': 'border-purple-500/50 text-purple-400 bg-purple-500/10',
  'creative-collaboration': 'border-pink-500/50 text-pink-400 bg-pink-500/10',
  'uncategorized': 'border-gray-500/50 text-gray-400 bg-gray-500/10'
}

const defaultColorClass = 'border-gray-500/50 text-gray-400 bg-gray-500/10'

export function SkillPageClient({ skill }: SkillPageClientProps) {
  const [copied, setCopied] = useState(false)
  const [copiedPath, setCopiedPath] = useState(false)
  const categoryName = generateCategoryDisplayName(skill.category)
  const categoryIcon = getCategoryIcon(skill.category)
  const colorClass = categoryColors[skill.category] || defaultColorClass

  const installPath = `~/.claude/skills/${skill.slug}/SKILL.md`

  const handleCopy = async () => {
    const markdown = generateSkillMarkdown(skill)
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPath = async () => {
    await navigator.clipboard.writeText(installPath)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 2000)
  }

  const handleDownload = () => {
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

  // Format the content for display
  const lines = skill.content.split('\n')
  const formattedContent = lines.map((line, i) => {
    // Handle headers
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.replace('## ', '')}</h2>
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace('### ', '')}</h3>
    }

    // Handle lists
    if (line.startsWith('- ')) {
      return <li key={i} className="ml-6 list-disc">{line.replace('- ', '')}</li>
    }
    if (/^\d+\. /.test(line)) {
      return <li key={i} className="ml-6 list-decimal">{line.replace(/^\d+\. /, '')}</li>
    }

    // Handle code blocks
    if (line.startsWith('```')) {
      return <div key={i} className="font-mono text-sm bg-muted p-2 rounded my-2">{line}</div>
    }

    // Regular paragraphs
    if (line.trim()) {
      return <p key={i} className="mb-3">{line}</p>
    }

    return <br key={i} />
  })

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back button */}
          <Link href="/skills" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Skills
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-primary flex-shrink-0" />
                  <h1 className="text-3xl font-bold">{skill.name}</h1>
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
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
                        variant="outline"
                        className="h-9 w-9 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download SKILL.md</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Badge
                className={`${colorClass} border font-medium inline-flex items-center gap-1 text-sm px-3 py-1`}
                variant="outline"
              >
                <span>{categoryIcon}</span>
                <span>{categoryName}</span>
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground mt-4">{skill.description}</p>
            {skill.allowedTools && (
              <div className="text-sm mt-2">
                <span className="font-medium">Allowed Tools:</span> {skill.allowedTools}
              </div>
            )}
            {skill.model && (
              <div className="text-sm mt-1">
                <span className="font-medium">Model:</span> {skill.model}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-primary/10 rounded-lg p-6 mb-8 border border-primary/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={handleCopy}
                className="w-full justify-center gap-2"
                variant="outline"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy SKILL.md Content
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownload}
                className="w-full justify-center gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Download SKILL.md
              </Button>
            </div>
          </div>

          {/* Installation */}
          <div className="bg-muted rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Installation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Step 1: Create the skill directory</h3>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  mkdir -p ~/.claude/skills/{skill.slug}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Step 2: Save SKILL.md to</h3>
                <div className="bg-background rounded p-3 font-mono text-sm flex items-center justify-between">
                  <span>{installPath}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 shrink-0"
                    onClick={handleCopyPath}
                  >
                    {copiedPath ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-primary/5 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> After installation, restart Claude Code. The skill will be automatically discovered and used when relevant.
                </p>
              </div>
            </div>
          </div>

          {/* Skill Content */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Skill Instructions</h2>
            <div className="bg-muted rounded-lg p-6 prose prose-sm max-w-none">
              {formattedContent}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <a
              href={`https://github.com/davepoon/buildwithclaude/tree/main/plugins/all-skills/skills/${skill.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View on GitHub
              </Button>
            </a>
            <Link href="/skills">
              <Button variant="outline">Browse More Skills</Button>
            </Link>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
