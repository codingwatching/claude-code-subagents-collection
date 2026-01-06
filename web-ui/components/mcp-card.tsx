'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Copy, Box, Star } from 'lucide-react'
import { HiMiniCheckBadge } from 'react-icons/hi2'
import {
  MCPServer,
  SOURCE_INDICATORS,
  getMCPCategoryIcon
} from '@/lib/mcp-types'
import { MCPInstallationModal } from './mcp-installation-modal'

interface MCPCardProps {
  server: MCPServer
}

export function MCPCard({ server }: MCPCardProps) {
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const categoryIcon = getMCPCategoryIcon(server.category)

  const getLogoUrl = () => {
    if (server.logo_url) return server.logo_url

    if (server.source_registry?.type === 'docker' && server.vendor) {
      return `https://hub.docker.com/public/images/logos/${server.vendor}.png`
    }

    if (server.sources.github) {
      const match = server.sources.github.match(/github\.com\/([^/]+)/)
      if (match) {
        return `https://github.com/${match[1]}.png?size=40`
      }
    }

    return null
  }

  const logoUrl = getLogoUrl()
  const showLogo = logoUrl && !logoError
  const serverSlug = server.path.replace(/\//g, '-')
  const href = `/mcp-server/${serverSlug}`

  const handleInstall = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowInstallModal(true)
  }

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  return (
    <>
      <Link href={href}>
        <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col bg-card">
          {/* Header with logo and source indicators */}
          <div className="flex items-start gap-3 mb-3">
            {showLogo ? (
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={`${server.vendor || server.display_name} logo`}
                  width={32}
                  height={32}
                  className="object-contain rounded"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <span className="text-2xl flex-shrink-0">{categoryIcon}</span>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium truncate">{server.display_name}</h3>
                {server.verification.status === 'verified' && (
                  <HiMiniCheckBadge className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {server.source_registry?.type === 'official-mcp' && (
                  <span>{SOURCE_INDICATORS['official-mcp'].icon} Official</span>
                )}
                {(server.source_registry?.type === 'docker' || server.docker_mcp_available) && (
                  <span>{SOURCE_INDICATORS.docker.icon} Docker</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
            {server.description}
          </p>

          {/* Stats row */}
          {(server.stats?.docker_pulls || server.stats?.github_stars) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              {server.stats.docker_pulls && (
                <span className="flex items-center gap-1">
                  <Box className="h-3 w-3" />
                  {formatNumber(server.stats.docker_pulls)}
                </span>
              )}
              {server.stats.github_stars && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {formatNumber(server.stats.github_stars)}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleInstall}
            >
              <Copy className="h-3 w-3 mr-1" />
              Install
            </Button>
          </div>
        </div>
      </Link>

      <MCPInstallationModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        serverName={server.name}
        displayName={server.display_name}
        claudeMcpAddCommand={server.claude_mcp_add_command}
        dockerMcpAvailable={server.docker_mcp_available || server.source_registry?.type === 'docker'}
        dockerMcpCommand={server.docker_mcp_command || `docker mcp server enable mcp/${server.name}`}
        environmentVariables={server.environment_variables}
      />
    </>
  )
}
