'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Copy, Download, Check, ExternalLink } from 'lucide-react'
import { generateHookMarkdown } from '@/lib/utils'
import { generateCategoryDisplayName, type Hook } from '@/lib/hooks-types'

interface HookPageClientProps {
  hook: Hook
}

export function HookPageClient({ hook }: HookPageClientProps) {
  const [copied, setCopied] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)

  const categoryName = generateCategoryDisplayName(hook.category)

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

  const lines = hook.content.split('\n')
  const formattedContent = lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-medium mt-6 mb-3">{line.replace('## ', '')}</h2>
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.replace('### ', '')}</h3>
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-medium mt-6 mb-3">{line.replace('# ', '')}</h1>
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="ml-6 list-disc">{line.replace('- ', '')}</li>
    }
    if (/^\d+\. /.test(line)) {
      return <li key={i} className="ml-6 list-decimal">{line.replace(/^\d+\. /, '')}</li>
    }
    if (line.startsWith('```')) {
      return <div key={i} className="font-mono text-sm bg-muted p-2 rounded my-2">{line}</div>
    }
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
    if (line.trim()) {
      return <p key={i} className="mb-3">{line}</p>
    }
    return <br key={i} />
  })

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back */}
        <Link href="/hooks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Hooks
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-display-2">{hook.name}</h1>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>{categoryName}</span>
            <span>·</span>
            <span className="font-mono">{hook.event}</span>
          </div>
          <p className="text-lg text-muted-foreground mb-4">{hook.description}</p>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Matcher:</span>{' '}
            <code className="bg-muted px-2 py-1 rounded font-mono">{hook.matcher}</code>
          </div>
        </div>

        {/* Configuration */}
        <div className="mb-10">
          <h2 className="text-lg font-medium mb-4">Configuration</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Add to your <code className="bg-muted px-1 rounded">.claude/settings.json</code>:
          </p>
          <div className="relative bg-card rounded-lg border border-border">
            <pre className="p-4 font-mono text-sm overflow-x-auto">
              {configString}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={handleCopyConfig}
            >
              {copiedConfig ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-10">
          <h2 className="text-lg font-medium mb-4">Hook Details</h2>
          <div className="bg-card rounded-lg p-6 border border-border prose prose-sm max-w-none">
            {formattedContent}
          </div>
        </div>

        {/* Event Info */}
        <div className="mb-10 p-4 bg-card rounded-lg border border-border">
          <h3 className="text-sm font-medium mb-2">About {hook.event} Hooks</h3>
          <p className="text-sm text-muted-foreground">
            {hook.event === 'PostToolUse' && 'PostToolUse hooks run after a tool completes execution. They can modify the result or trigger additional actions.'}
            {hook.event === 'PreToolUse' && 'PreToolUse hooks run before a tool executes. They can validate, modify, or block the tool call.'}
            {hook.event === 'Stop' && 'Stop hooks run when Claude Code finishes its response. They can perform cleanup or final actions.'}
            {hook.event === 'Notification' && 'Notification hooks run when Claude Code sends a notification. They can customize how notifications are displayed.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <a
            href={`https://github.com/davepoon/buildwithclaude/blob/main/hooks/${hook.slug}.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </Button>
          </a>
          <Link href="/hooks">
            <Button variant="outline">Browse More</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
