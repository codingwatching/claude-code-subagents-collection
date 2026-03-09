'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, Sparkles, X, Loader2, Check, AlertTriangle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+/
const COOLDOWN_MS = 10_000

interface SubmitResult {
  success: boolean
  message: string
  skills?: Array<{ name: string; status: string; reason?: string }>
  detectionMethod?: string
  deduplicated?: boolean
}

const VARIANT_CONFIG = {
  marketplace: {
    storageKey: 'create-marketplace-banner-dismissed',
    title: 'Create Your Own Marketplace',
    description: (
      <>
        Add a{' '}
        <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">
          marketplace.json
        </code>{' '}
        to your GitHub repo. We&apos;ll automatically index your plugins for thousands of
        developers to discover.
      </>
    ),
  },
  skill: {
    storageKey: 'create-skill-banner-dismissed',
    title: 'Share Your Skills',
    description: (
      <>
        Add skills to your{' '}
        <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">
          marketplace.json
        </code>{' '}
        and we&apos;ll automatically index them, or share your skill by URL.
        We&apos;ll review and add your skills to the BuildWithClaude website.
      </>
    ),
  },
} as const

interface CreateMarketplaceBannerProps {
  variant?: 'marketplace' | 'skill'
}

export function CreateMarketplaceBanner({ variant = 'marketplace' }: CreateMarketplaceBannerProps) {
  const config = VARIANT_CONFIG[variant]
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden to avoid flash
  const [isVisible, setIsVisible] = useState(true)

  // URL submit state (skill variant only)
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(false)

  const isValidUrl = GITHUB_URL_REGEX.test(url.trim())
  const canSubmit = isValidUrl && !isSubmitting && !cooldown

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (response.status === 429) {
        setError('Please wait before submitting again (max 3 per hour)')
      } else if (response.status === 404) {
        setError('Repository not found on GitHub')
      } else if (response.status === 503) {
        setError(data.message || 'Service temporarily unavailable. Please try again in a few minutes.')
      } else if (!response.ok) {
        setError(data.message || 'Failed to process submission')
      } else {
        setResult(data)
        if (data.success) {
          setUrl('')
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
      setCooldown(true)
      setTimeout(() => setCooldown(false), COOLDOWN_MS)
    }
  }, [canSubmit, url])

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(config.storageKey)
    setIsDismissed(dismissed === 'true')
  }, [config.storageKey])

  const handleDismiss = () => {
    setIsVisible(false)
    // Wait for fade animation then update state
    setTimeout(() => {
      setIsDismissed(true)
      localStorage.setItem(config.storageKey, 'true')
    }, 300)
  }

  if (isDismissed) return null

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 p-6 mb-8 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_40px_-12px_hsl(18,55%,48%,0.3)] ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors z-10"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Decorative corner accent */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
      <div className="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-primary/50 to-transparent" />

      <div className="relative pr-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-wider text-primary">
                Get Discovered
              </span>
            </div>
            <h3 className="text-lg font-serif tracking-tight mb-1">
              {config.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {config.description}
            </p>
          </div>

          {variant === 'marketplace' && (
            <Link
              href="https://code.claude.com/docs/en/plugin-marketplaces#create-the-marketplace-file"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium transition-all duration-300 hover:bg-primary hover:text-primary-foreground group/btn shrink-0"
            >
              Learn how
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Inline URL submission form (skill variant only) */}
        {variant === 'skill' && (
          <div className="mt-4">
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setResult(null)
                  setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
                className="flex-1 bg-background/50"
                disabled={isSubmitting}
              />
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : cooldown ? (
                  'Wait...'
                ) : (
                  'Submit'
                )}
              </Button>
            </div>

            {url && !isValidUrl && url.length > 10 && (
              <p className="text-xs text-destructive mt-2">
                Please enter a valid GitHub repository URL
              </p>
            )}

            {/* Error state */}
            {error && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success / result state */}
            {result && (
              <div className="mt-3 space-y-2">
                <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  {result.success ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{result.message}</p>
                    {result.detectionMethod && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Detection: {result.detectionMethod.replace(/-/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Show discovered skills */}
                {result.skills && result.skills.length > 0 && (
                  <div className="space-y-1.5">
                    {result.skills.map((skill, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded bg-muted/50 text-sm"
                      >
                        <span className="flex-1 truncate font-mono text-xs">{skill.name}</span>
                        <Badge
                          variant={
                            skill.status === 'approved' ? 'default' :
                            skill.status === 'flagged' ? 'secondary' :
                            'destructive'
                          }
                          className="text-xs shrink-0"
                        >
                          {skill.status === 'approved' ? 'Added' :
                           skill.status === 'flagged' ? 'Under Review' :
                           'Rejected'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
