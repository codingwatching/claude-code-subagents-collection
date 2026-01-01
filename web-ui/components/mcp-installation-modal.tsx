'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, Puzzle, Terminal } from 'lucide-react'
import { getMarketplaceAddCommand, getMCPInstallCommand } from '@/lib/bwc-utils'

interface MCPInstallationModalProps {
  isOpen: boolean
  onClose: () => void
  serverName: string
  displayName: string
  jsonConfig: string
  claudeCommand?: string
  serverType?: string
  dockerHubUrl?: string
}

export function MCPInstallationModal({
  isOpen,
  onClose,
  serverName,
  displayName,
  jsonConfig,
  claudeCommand,
  serverType,
  dockerHubUrl
}: MCPInstallationModalProps) {
  const [copiedMarketplace, setCopiedMarketplace] = useState(false)
  const [copiedPlugin, setCopiedPlugin] = useState(false)
  const [copiedDocker, setCopiedDocker] = useState(false)

  const marketplaceCommand = getMarketplaceAddCommand()
  const pluginCommand = getMCPInstallCommand()
  const dockerCommand = `docker mcp server enable ${serverName}`

  const handleCopyMarketplace = async () => {
    await navigator.clipboard.writeText(marketplaceCommand)
    setCopiedMarketplace(true)
    setTimeout(() => setCopiedMarketplace(false), 2000)
  }

  const handleCopyPlugin = async () => {
    await navigator.clipboard.writeText(pluginCommand)
    setCopiedPlugin(true)
    setTimeout(() => setCopiedPlugin(false), 2000)
  }

  const handleCopyDocker = async () => {
    await navigator.clipboard.writeText(dockerCommand)
    setCopiedDocker(true)
    setTimeout(() => setCopiedDocker(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Install {displayName}</DialogTitle>
          <DialogDescription>
            Choose how you want to install this MCP server
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="plugin" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plugin" className="flex items-center gap-2">
              <Puzzle className="h-4 w-4" />
              Plugin Install
            </TabsTrigger>
            <TabsTrigger value="docker" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Docker MCP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plugin" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install all MCP servers using Claude Code&apos;s plugin system:
              </p>

              {/* Step 1: Add marketplace */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Step 1: Add the marketplace (one-time)</h4>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg font-mono text-sm">
                  <span className="break-all">{marketplaceCommand}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 shrink-0"
                    onClick={handleCopyMarketplace}
                  >
                    {copiedMarketplace ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Step 2: Install MCP servers plugin */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Step 2: Install MCP Servers</h4>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg font-mono text-sm">
                  <span className="break-all">{pluginCommand}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 shrink-0"
                    onClick={handleCopyPlugin}
                  >
                    {copiedPlugin ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground pl-1">
                  This installs all 199 Docker MCP servers including <strong>{displayName}</strong>
                </div>
              </div>

              <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm">
                <p className="font-semibold mb-2 text-foreground">Prerequisites:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>Docker Desktop must be installed and running</li>
                  <li>Docker MCP Toolkit must be enabled</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="docker" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Enable this specific server using Docker MCP Toolkit:
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDocker}
                  className="gap-2"
                >
                  {copiedDocker ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-auto">
                  <code className="text-sm font-mono">{dockerCommand}</code>
                </pre>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>This command will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Enable the MCP server in Docker MCP Toolkit</li>
                  <li>Configure it with default settings</li>
                  <li>Make it available through the Docker MCP gateway</li>
                  <li>Allow Claude Code to access the server</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm">
                <p className="font-semibold mb-2 text-foreground">Prerequisites:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>Docker Desktop must be installed and running</li>
                  <li>Docker MCP Toolkit must be enabled</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
