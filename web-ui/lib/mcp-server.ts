import fs from 'fs'
import path from 'path'
import { MCPServer, MCP_CATEGORIES } from './mcp-types'
import {
  getMCPServersPaginated,
  getMCPServerBySlug as getMCPServerBySlugFromDB,
  getMCPCategoriesFromDB,
  getMCPServerStatsFromDB,
  getFeaturedMCPServersFromDB,
  type MCPServerWithParsedJSON,
} from './mcp-server-db'

// Check if database is available
const hasDatabase = !!process.env.POSTGRES_URL

let registryCache: { mcpServers?: MCPServer[] } | null = null

function getRegistry(): { mcpServers?: MCPServer[] } {
  if (!registryCache) {
    const registryPath = path.join(process.cwd(), 'public', 'registry.json')
    const registryContent = fs.readFileSync(registryPath, 'utf8')
    registryCache = JSON.parse(registryContent)
  }
  return registryCache || {}
}

/**
 * Transform database MCP server to MCPServer type for UI compatibility
 */
function transformDBToMCPServer(server: MCPServerWithParsedJSON): MCPServer {
  const installationMethods = (server.installationMethods as MCPServer['installation_methods']) || []

  // Extract claude_mcp_add_command from installation methods
  // Find the first method with a claudeCode command (prefer recommended)
  const methodWithClaudeCode = installationMethods.find(
    (m) => m.recommended && m.claudeCode
  ) || installationMethods.find((m) => m.claudeCode)

  const claudeMcpAddCommand = methodWithClaudeCode?.claudeCode || undefined

  // Check if docker MCP is available
  const dockerMcpAvailable = server.sourceRegistry === 'docker' ||
    installationMethods.some((m) => m.type === 'docker' || m.type === 'docker-mcp')

  return {
    name: server.name,
    display_name: server.displayName,
    category: server.category,
    description: server.description || '',
    server_type: (server.serverType as 'stdio' | 'http' | 'websocket' | 'sse' | 'streaming-http') || 'stdio',
    protocol_version: '1.0.0',
    verification: {
      status: (server.verificationStatus as 'verified' | 'community' | 'experimental') || 'community',
      maintainer: server.vendor || 'Community',
      last_tested: server.lastIndexedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      tested_with: ['claude-code'],
    },
    sources: {
      github: server.githubUrl || undefined,
      docker: server.dockerUrl || undefined,
      npm: server.npmUrl || undefined,
      official: server.documentationUrl || undefined,
    },
    stats: {
      github_stars: server.githubStars || undefined,
      docker_pulls: server.dockerPulls || undefined,
      npm_downloads: server.npmDownloads || undefined,
      last_updated: server.updatedAt?.toISOString(),
    },
    badges: [],
    source_registry: {
      type: server.sourceRegistry as 'official-mcp' | 'docker' | 'mcpmarket' | 'manual' | 'community',
      url: server.sourceUrl || undefined,
      last_fetched: server.lastIndexedAt?.toISOString(),
    },
    tags: server.tags || [],
    installation_methods: installationMethods,
    user_inputs: [],
    packages: (server.packages as MCPServer['packages']) || [],
    remotes: (server.remotes as MCPServer['remotes']) || [],
    environment_variables: (server.environmentVariables as MCPServer['environment_variables']) || [],
    claude_mcp_add_command: claudeMcpAddCommand,
    docker_mcp_available: dockerMcpAvailable,
    file: `${server.sourceRegistry}/${server.name}.md`,
    path: server.slug,
  }
}

export async function getAllMCPServers(): Promise<MCPServer[]> {
  if (hasDatabase) {
    try {
      const result = await getMCPServersPaginated({ limit: 10000 })
      return result.servers.map(transformDBToMCPServer)
    } catch (error) {
      console.error('Database error, falling back to registry:', error)
    }
  }
  // Fallback to static registry.json
  const registry = getRegistry()
  return registry.mcpServers || []
}

export async function getMCPServerBySlug(slug: string): Promise<MCPServer | null> {
  if (hasDatabase) {
    try {
      const server = await getMCPServerBySlugFromDB(slug)
      if (server) {
        return transformDBToMCPServer(server)
      }
    } catch (error) {
      console.error('Database error, falling back to registry:', error)
    }
  }
  // Fallback to static registry.json
  const servers = getRegistry().mcpServers || []
  return servers.find((server) => server.path.replace(/\//g, '-') === slug) || null
}

export function getMCPServersByCategory(category: string): MCPServer[] {
  // Sync version for backwards compatibility - uses registry
  const registry = getRegistry()
  return (registry.mcpServers || []).filter((server) => server.category === category)
}

export function getMCPServersByVerification(
  status: 'verified' | 'community' | 'experimental'
): MCPServer[] {
  // Sync version for backwards compatibility - uses registry
  const registry = getRegistry()
  return (registry.mcpServers || []).filter((server) => server.verification.status === status)
}

export function searchMCPServers(query: string): MCPServer[] {
  // Sync version for backwards compatibility - uses registry
  const normalizedQuery = query.toLowerCase()
  const registry = getRegistry()
  return (registry.mcpServers || []).filter(
    (server) =>
      server.name.toLowerCase().includes(normalizedQuery) ||
      server.display_name.toLowerCase().includes(normalizedQuery) ||
      server.description.toLowerCase().includes(normalizedQuery) ||
      server.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  )
}

export interface MCPCategoryMetadata {
  id: string
  displayName: string
  icon: string
  count: number
  description?: string
}

export async function getAllMCPCategories(): Promise<MCPCategoryMetadata[]> {
  if (hasDatabase) {
    try {
      return await getMCPCategoriesFromDB()
    } catch (error) {
      console.error('Database error, falling back to registry:', error)
    }
  }

  // Fallback to static registry.json
  const servers = getRegistry().mcpServers || []
  const categoryCounts: Record<string, number> = {}

  // Count servers per category
  servers.forEach((server) => {
    const category = server.category
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  // Generate metadata
  const categories: MCPCategoryMetadata[] = []

  Object.entries(categoryCounts).forEach(([categoryId, count]) => {
    const categoryDef = MCP_CATEGORIES[categoryId as keyof typeof MCP_CATEGORIES]

    categories.push({
      id: categoryId,
      displayName: categoryDef?.name || categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      icon: categoryDef?.icon || '📦',
      count,
      description: categoryDef?.description,
    })
  })

  return categories.sort((a, b) => b.count - a.count)
}

export function getAllMCPCategoryIds(): string[] {
  const servers = getRegistry().mcpServers || []
  const categories = new Set(servers.map((s) => s.category))
  return Array.from(categories).sort()
}

export interface MCPServerStats {
  total: number
  verified: number
  community: number
  experimental: number
  byCategory: Record<string, number>
}

export async function getMCPServerStats(): Promise<MCPServerStats> {
  if (hasDatabase) {
    try {
      const dbStats = await getMCPServerStatsFromDB()
      return {
        total: dbStats.total,
        verified: dbStats.byVerification['verified'] || 0,
        community: dbStats.byVerification['community'] || 0,
        experimental: dbStats.byVerification['experimental'] || 0,
        byCategory: dbStats.byCategory,
      }
    } catch (error) {
      console.error('Database error, falling back to registry:', error)
    }
  }

  // Fallback to static registry.json
  const servers = getRegistry().mcpServers || []
  const stats: MCPServerStats = {
    total: servers.length,
    verified: 0,
    community: 0,
    experimental: 0,
    byCategory: {},
  }

  servers.forEach((server) => {
    // Count by verification status
    stats[server.verification.status]++

    // Count by category
    stats.byCategory[server.category] = (stats.byCategory[server.category] || 0) + 1
  })

  return stats
}

// Get featured servers (verified servers with high stats)
export async function getFeaturedMCPServers(limit: number = 6): Promise<MCPServer[]> {
  if (hasDatabase) {
    try {
      const servers = await getFeaturedMCPServersFromDB(limit)
      return servers.map(transformDBToMCPServer)
    } catch (error) {
      console.error('Database error, falling back to registry:', error)
    }
  }

  // Fallback to static registry.json
  const registry = getRegistry()
  return (registry.mcpServers || [])
    .filter((server) => server.verification.status === 'verified')
    .sort((a, b) => {
      const aScore =
        (a.stats?.github_stars || 0) + (a.stats?.docker_pulls || 0) + (a.stats?.npm_downloads || 0)
      const bScore =
        (b.stats?.github_stars || 0) + (b.stats?.docker_pulls || 0) + (b.stats?.npm_downloads || 0)
      return bScore - aScore
    })
    .slice(0, limit)
}

// Sync versions for backwards compatibility (use async versions when possible)
export function getAllMCPServersSync(): MCPServer[] {
  const registry = getRegistry()
  return registry.mcpServers || []
}

export function getMCPServerBySlugSync(slug: string): MCPServer | null {
  const servers = getRegistry().mcpServers || []
  return servers.find((server) => server.path.replace(/\//g, '-') === slug) || null
}
