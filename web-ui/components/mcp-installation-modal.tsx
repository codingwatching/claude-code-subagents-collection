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
import { Copy, Check, Terminal } from 'lucide-react'
import { getClaudeMCPAddCommand, getDockerMCPEnableCommand } from '@/lib/bwc-utils'

interface MCPInstallationModalProps {
  isOpen: boolean
  onClose: () => void
  serverName: string
  displayName: string
  jsonConfig?: string
  claudeCommand?: string
  serverType?: string
  dockerHubUrl?: string
}

export function MCPInstallationModal({
  isOpen,
  onClose,
  serverName,
  displayName,
}: MCPInstallationModalProps) {
  const [copiedClaude, setCopiedClaude] = useState(false)
  const [copiedDocker, setCopiedDocker] = useState(false)

  const claudeCommand = getClaudeMCPAddCommand(serverName)
  const dockerCommand = getDockerMCPEnableCommand(serverName)

  const handleCopyClaude = async () => {
    await navigator.clipboard.writeText(claudeCommand)
    setCopiedClaude(true)
    setTimeout(() => setCopiedClaude(false), 2000)
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

        <Tabs defaultValue="claude" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="claude" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Claude CLI
            </TabsTrigger>
            <TabsTrigger value="docker" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Docker MCP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="claude" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install this MCP server using Claude Code CLI <span className="text-primary font-medium">(Recommended)</span>:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg font-mono text-sm">
                  <span className="break-all">{claudeCommand}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 shrink-0"
                    onClick={handleCopyClaude}
                  >
                    {copiedClaude ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>This command will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Add the MCP server to your Claude Code configuration</li>
                  <li>Configure it with default settings</li>
                  <li>Make it available in Claude Code immediately</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm">
                <p className="font-semibold mb-2 text-foreground">Prerequisites:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>Claude Code CLI must be installed</li>
                  <li>Docker Desktop must be installed and running</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="docker" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enable this server using Docker MCP Toolkit:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg font-mono text-sm">
                  <span className="break-all">{dockerCommand}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 shrink-0"
                    onClick={handleCopyDocker}
                  >
                    {copiedDocker ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>This command will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Enable the MCP server in Docker MCP Toolkit</li>
                  <li>Configure it with default settings</li>
                  <li>Make it available through the Docker MCP gateway</li>
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
