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
import { ArrowLeft, Copy, Download, Check, Github, Zap, Puzzle } from 'lucide-react'
import { generateHookMarkdown } from '@/lib/utils'
import { generateCategoryDisplayName, getCategoryIcon, type Hook } from '@/lib/hooks-types'
import { InstallationModalEnhanced } from '@/components/installation-modal-enhanced'

interface HookPageClientProps {
  hook: Hook
}

const categoryColors: Record<string, string> = {
  'git': 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
  'automation': 'border-amber-500/50 text-amber-400 bg-amber-500/10',
  'notifications': 'border-violet-500/50 text-violet-400 bg-violet-500/10',
  'formatting': 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
  'security': 'border-red-500/50 text-red-400 bg-red-500/10',
  'testing': 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  'development': 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
}

const eventColors: Record<string, string> = {
  'PostToolUse': 'border-green-500/50 text-green-400 bg-green-500/10',
  'PreToolUse': 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
  'Stop': 'border-red-500/50 text-red-400 bg-red-500/10',
  'Notification': 'border-blue-500/50 text-blue-400 bg-blue-500/10'
}

export function HookPageClient({ hook }: HookPageClientProps) {
  const [copied, setCopied] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)

  const categoryName = generateCategoryDisplayName(hook.category)
  const categoryIcon = getCategoryIcon(hook.category)
  const colorClass = categoryColors[hook.category] || 'border-gray-500/50 text-gray-400 bg-gray-500/10'
  const eventColorClass = eventColors[hook.event] || 'border-gray-500/50 text-gray-400 bg-gray-500/10'

  const handleCopy = async () => {
    const markdown = generateHookMarkdown(hook)
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
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

  // Generate the hook configuration for settings.json
  const hookConfig = {
    hooks: {
      [hook.event]: [
        {
          matcher: hook.matcher,
          hooks: [
            {
              type: hook.language === 'bash' ? 'command' : 'prompt',
              command: hook.language === 'bash' ? `# Add your command here based on ${hook.slug}` : undefined,
              prompt: hook.language !== 'bash' ? hook.content.trim().split('\n')[0] : undefined
            }
          ]
        }
      ]
    }
  }

  const configString = JSON.stringify(hookConfig, null, 2)

  const handleCopyConfig = async () => {
    await navigator.clipboard.writeText(configString)
    setCopiedConfig(true)
    setTimeout(() => setCopiedConfig(false), 2000)
  }

  // Format the content for display
  const lines = hook.content.split('\n')
  const formattedContent = lines.map((line, i) => {
    // Handle headers
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.replace('## ', '')}</h2>
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace('### ', '')}</h3>
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.replace('# ', '')}</h1>
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

    // Handle inline code
    if (line.includes('`')) {
      const parts = line.split('`')
      return (
        <p key={i} className="mb-3">
          {parts.map((part, j) =>
            j % 2 === 0 ? part : <code key={j} className="bg-muted px-1 rounded text-sm">{part}</code>
          )}
        </p>
      )
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
          <Link href="/hooks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Hooks
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-primary flex-shrink-0" />
                  <h1 className="text-3xl font-bold">{hook.name}</h1>
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
                      <p>{copied ? 'Copied!' : 'Copy markdown'}</p>
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
                      <p>Download markdown file</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                        onClick={() => setShowInstallModal(true)}
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
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={`${colorClass} border font-medium inline-flex items-center gap-1 whitespace-nowrap text-sm`}
                  variant="outline"
                >
                  <span className="flex-shrink-0">{categoryIcon}</span>
                  <span>{categoryName}</span>
                </Badge>
                <Badge
                  className={`${eventColorClass} border font-medium inline-flex items-center gap-1 whitespace-nowrap text-sm`}
                  variant="outline"
                >
                  {hook.event}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">{hook.description}</p>
            </div>

            {/* Hook metadata */}
            <div className="mt-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Matcher:</span>{' '}
                <code className="bg-muted px-2 py-1 rounded font-mono">{hook.matcher}</code>
              </div>
              {hook.language && (
                <div className="text-sm">
                  <span className="font-medium">Language:</span> {hook.language}
                </div>
              )}
              {hook.version && (
                <div className="text-sm">
                  <span className="font-medium">Version:</span> {hook.version}
                </div>
              )}
            </div>
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
                    Copy Markdown Content
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownload}
                className="w-full justify-center gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Download {hook.slug}.md
              </Button>
            </div>
          </div>

          {/* Installation */}
          <div className="bg-muted rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Installation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Puzzle className="h-4 w-4 text-primary" />
                  Option A: Install using Plugin Marketplace (Recommended)
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Click the Install with Plugin button above or use the Plugin Marketplace to install all hooks in the {categoryName} category.
                </p>
                <Button
                  onClick={() => setShowInstallModal(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Puzzle className="h-4 w-4" />
                  Install with Plugin
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Option B: Manual Configuration</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Add the following to your <code className="bg-background px-1 rounded">.claude/settings.json</code> or <code className="bg-background px-1 rounded">.claude/settings.local.json</code>:
                </p>
                <div className="relative">
                  <pre className="bg-background rounded p-3 font-mono text-sm overflow-x-auto">
                    {configString}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={handleCopyConfig}
                  >
                    {copiedConfig ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-primary/5 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Hooks are configured in your Claude Code settings file. User-level hooks go in <code className="bg-muted px-1 rounded">~/.claude/settings.json</code>, project-level hooks go in <code className="bg-muted px-1 rounded">.claude/settings.local.json</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Hook Content */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Hook Details</h2>
            <div className="bg-muted rounded-lg p-6 prose prose-sm max-w-none">
              {formattedContent}
            </div>
          </div>

          {/* Event Type Info */}
          <div className="mb-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">About {hook.event} Hooks</h3>
            <p className="text-sm text-muted-foreground">
              {hook.event === 'PostToolUse' && 'PostToolUse hooks run after a tool completes execution. They can modify the result or trigger additional actions.'}
              {hook.event === 'PreToolUse' && 'PreToolUse hooks run before a tool executes. They can validate, modify, or block the tool call.'}
              {hook.event === 'Stop' && 'Stop hooks run when Claude Code finishes its response. They can perform cleanup or final actions.'}
              {hook.event === 'Notification' && 'Notification hooks run when Claude Code sends a notification. They can customize how notifications are displayed.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <a
              href={`https://github.com/davepoon/buildwithclaude/blob/main/hooks/${hook.slug}.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <Github className="h-4 w-4" />
                View on GitHub
              </Button>
            </a>
            <Link href="/hooks">
              <Button variant="outline">Browse More Hooks</Button>
            </Link>
          </div>
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
