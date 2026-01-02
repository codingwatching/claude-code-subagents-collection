'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Copy, Star, Package, Box } from 'lucide-react'
import { HiMiniCheckBadge } from 'react-icons/hi2'
import {
  MCPServer,
  SOURCE_INDICATORS,
  getMCPCategoryDisplayName,
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
  
  // Generate logo URL based on source
  const getLogoUrl = () => {
    if (server.logo_url) return server.logo_url
    
    // Docker Hub servers
    if (server.source_registry?.type === 'docker' && server.vendor) {
      return `https://hub.docker.com/public/images/logos/${server.vendor}.png`
    }
    
    // GitHub-based servers
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
  
  
  // Generate href for the detail page
  const serverSlug = server.path.replace(/\//g, '-')
  const href = `/mcp-server/${serverSlug}`
  
  return (
    <TooltipProvider>
      <Link href={href}>
        <Card className="h-full card-hover border-border/50 hover:border-primary/20 transition-all duration-300 cursor-pointer group relative overflow-hidden">
          {/* Hover actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowInstallModal(true)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy installation config</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {showLogo ? (
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <Image
                      src={logoUrl}
                      alt={`${server.vendor || server.display_name} logo`}
                      width={32}
                      height={32}
                      className="object-contain"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  <span className="text-2xl">{categoryIcon}</span>
                )}
                {/* Special badges */}
                {server.badges?.includes('popular') && (
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                    🔥 Popular
                  </Badge>
                )}
                {server.badges?.includes('featured') && (
                  <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
                    ⭐ Featured
                  </Badge>
                )}
                {server.badges?.includes('trending') && (
                  <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                    📈 Trending
                  </Badge>
                )}
                {/* Source badges - show both when available in both sources */}
                {(server.source_registry?.type === 'official-mcp' || server.docker_mcp_available) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="text-xs bg-violet-500 hover:bg-violet-600 text-white">
                        {SOURCE_INDICATORS['official-mcp']?.icon} Official MCP
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{SOURCE_INDICATORS['official-mcp']?.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {(server.source_registry?.type === 'docker' || server.docker_mcp_available) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="text-xs bg-sky-500 hover:bg-sky-600 text-white">
                        {SOURCE_INDICATORS.docker?.icon} Docker
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{SOURCE_INDICATORS.docker?.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            <CardTitle className="text-lg pr-20 flex items-center gap-1">
              {server.display_name}
              {server.verification.status === 'verified' && (
                <HiMiniCheckBadge className="h-5 w-5 text-blue-500" />
              )}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {server.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Stats */}
            {server.stats && (server.stats.github_stars || server.stats.npm_downloads) && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {server.stats.github_stars && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span>{server.stats.github_stars.toLocaleString()}</span>
                  </div>
                )}
                {server.stats.npm_downloads && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{server.stats.npm_downloads.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Installation methods */}
            <div className="flex flex-wrap gap-1">
              {server.installation_methods.map((method, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {method.type}
                </Badge>
              ))}
            </div>
            
            {/* Tags */}
            {server.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {server.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {server.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{server.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
          
          {/* Docker pulls counter in bottom right */}
          {server.stats?.docker_pulls && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1 text-xs text-muted-foreground">
              <Box className="h-3 w-3" />
              <span>{server.stats.docker_pulls.toLocaleString()}</span>
            </div>
          )}
        </Card>
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
    </TooltipProvider>
  )
}