import { promises as fs } from 'fs'
import path from 'path'
import { desc, asc, eq, sql, ilike, or, and } from 'drizzle-orm'
import type { MarketplaceRegistry } from './marketplace-types'

// Check if we have a database configured
const hasDatabase = !!process.env.POSTGRES_URL

export type SortOption = 'relevance' | 'stars' | 'newest' | 'oldest' | 'a-z' | 'z-a'

export interface PaginatedMarketplaces {
  marketplaces: MarketplaceRegistry[]
  total: number
  hasMore: boolean
}

export interface MarketplaceQueryOptions {
  limit?: number
  offset?: number
  search?: string
  sort?: SortOption
}

/**
 * Transform database row to MarketplaceRegistry
 */
function transformRow(row: {
  id: string
  name: string
  displayName: string
  description: string | null
  url: string | null
  repository: string
  installCommand: string | null
  namespace: string
  pluginCount: number
  skillCount: number
  categories: string[] | null
  badges: string[] | null
  maintainerName: string | null
  maintainerGithub: string | null
  stars: number
  installs: number
  verified: boolean
  lastIndexedAt: Date | null
  updatedAt: Date
}): MarketplaceRegistry {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName,
    description: row.description || '',
    url: row.url || row.repository,
    repository: row.repository,
    installCommand: row.installCommand || `/plugin marketplace add ${row.namespace}`,
    pluginCount: row.pluginCount,
    skillCount: row.skillCount,
    categories: row.categories || [],
    badges: row.badges || [],
    maintainer: {
      name: row.maintainerName || '',
      github: row.maintainerGithub || '',
    },
    stars: row.stars,
    installs: row.installs,
    verified: row.verified,
    lastIndexedAt: row.lastIndexedAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  }
}

/**
 * Get sort order for database query
 */
function getOrderBy(sort: SortOption, marketplaces: any) {
  switch (sort) {
    case 'relevance':
      // Primary: installs (actual usage), Secondary: stars (popularity proxy)
      return [desc(marketplaces.installs), desc(marketplaces.stars)]
    case 'stars':
      return desc(marketplaces.stars)
    case 'newest':
      return desc(marketplaces.updatedAt)
    case 'oldest':
      return asc(marketplaces.updatedAt)
    case 'a-z':
      return asc(marketplaces.displayName)
    case 'z-a':
      return desc(marketplaces.displayName)
    default:
      return desc(marketplaces.stars)
  }
}

/**
 * Sort marketplaces array (for fallback/static data)
 */
function sortMarketplaces(marketplaces: MarketplaceRegistry[], sort: SortOption): MarketplaceRegistry[] {
  const sorted = [...marketplaces]
  switch (sort) {
    case 'relevance':
      return sorted.sort((a, b) => {
        // Primary: installs (actual usage), Secondary: stars
        const installDiff = (b.installs || 0) - (a.installs || 0)
        if (installDiff !== 0) return installDiff
        return (b.stars || 0) - (a.stars || 0)
      })
    case 'stars':
      return sorted.sort((a, b) => (b.stars || 0) - (a.stars || 0))
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return dateB - dateA
      })
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return dateA - dateB
      })
    case 'a-z':
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName))
    case 'z-a':
      return sorted.sort((a, b) => b.displayName.localeCompare(a.displayName))
    default:
      return sorted
  }
}

/**
 * Get marketplaces with pagination and search
 */
export async function getMarketplacesPaginated(
  options: MarketplaceQueryOptions = {}
): Promise<PaginatedMarketplaces> {
  const { limit = 20, offset = 0, search, sort = 'relevance' } = options

  if (hasDatabase) {
    try {
      const { db } = await import('./db/client')
      const { marketplaces } = await import('./db/schema')

      // Build where clause
      let whereClause = eq(marketplaces.active, true)

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`
        whereClause = and(
          whereClause,
          or(
            ilike(marketplaces.name, searchTerm),
            ilike(marketplaces.displayName, searchTerm),
            ilike(marketplaces.description, searchTerm),
            ilike(marketplaces.maintainerName, searchTerm)
          )
        )!
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(marketplaces)
        .where(whereClause)

      const total = Number(countResult[0]?.count || 0)

      // Get paginated results with sorting
      const orderByClause = getOrderBy(sort, marketplaces)
      const results = await db
        .select()
        .from(marketplaces)
        .where(whereClause)
        .orderBy(...(Array.isArray(orderByClause) ? orderByClause : [orderByClause]))
        .limit(limit)
        .offset(offset)

      return {
        marketplaces: results.map(transformRow),
        total,
        hasMore: offset + results.length < total,
      }
    } catch (error) {
      console.error('Error fetching marketplaces from database:', error)
    }
  }

  // Fallback to static registry.json with client-side filtering
  const allMarketplaces = await getMarketplacesFromRegistry()
  let filtered = allMarketplaces

  if (search && search.trim()) {
    const searchLower = search.toLowerCase()
    filtered = allMarketplaces.filter(
      (m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.displayName.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.maintainer.name.toLowerCase().includes(searchLower)
    )
  }

  // Sort the filtered results
  const sorted = sortMarketplaces(filtered, sort)
  const paginated = sorted.slice(offset, offset + limit)

  return {
    marketplaces: paginated,
    total: filtered.length,
    hasMore: offset + paginated.length < filtered.length,
  }
}

/**
 * Get all marketplaces (for backwards compatibility and totals calculation)
 */
export async function getMarketplaces(): Promise<MarketplaceRegistry[]> {
  const result = await getMarketplacesPaginated({ limit: 10000 })
  return result.marketplaces
}

/**
 * Get marketplace totals (plugin count, skill count, marketplace count)
 */
export async function getMarketplaceTotals(): Promise<{
  totalPlugins: number
  totalSkills: number
  totalMarketplaces: number
}> {
  if (hasDatabase) {
    try {
      const { db } = await import('./db/client')
      const { marketplaces } = await import('./db/schema')

      const result = await db
        .select({
          totalPlugins: sql<number>`sum(plugin_count)`,
          totalSkills: sql<number>`sum(skill_count)`,
          totalMarketplaces: sql<number>`count(*)`,
        })
        .from(marketplaces)
        .where(eq(marketplaces.active, true))

      return {
        totalPlugins: Number(result[0]?.totalPlugins || 0),
        totalSkills: Number(result[0]?.totalSkills || 0),
        totalMarketplaces: Number(result[0]?.totalMarketplaces || 0),
      }
    } catch (error) {
      console.error('Error fetching marketplace totals:', error)
    }
  }

  const allMarketplaces = await getMarketplacesFromRegistry()
  return {
    totalPlugins: allMarketplaces.reduce((sum, m) => sum + m.pluginCount, 0),
    totalSkills: allMarketplaces.reduce((sum, m) => sum + m.skillCount, 0),
    totalMarketplaces: allMarketplaces.length,
  }
}

/**
 * Get a single marketplace by ID or name
 */
export async function getMarketplaceById(id: string): Promise<MarketplaceRegistry | null> {
  if (hasDatabase) {
    try {
      const { db } = await import('./db/client')
      const { marketplaces } = await import('./db/schema')
      const { eq, or } = await import('drizzle-orm')

      const results = await db
        .select()
        .from(marketplaces)
        .where(or(eq(marketplaces.id, id), eq(marketplaces.name, id), eq(marketplaces.namespace, id)))
        .limit(1)

      if (results.length > 0) {
        return transformRow(results[0])
      }
    } catch (error) {
      console.error('Error fetching marketplace from database:', error)
    }
  }

  // Fallback to static registry
  const allMarketplaces = await getMarketplacesFromRegistry()
  return allMarketplaces.find((m) => m.name === id) || null
}

/**
 * Read marketplaces from static registry.json file
 */
async function getMarketplacesFromRegistry(): Promise<MarketplaceRegistry[]> {
  try {
    const registryPath = path.join(process.cwd(), 'public', 'registry.json')
    const data = await fs.readFile(registryPath, 'utf-8')
    const registry = JSON.parse(data)
    return registry.marketplaces || []
  } catch (error) {
    console.error('Error reading marketplaces from registry:', error)
    return []
  }
}
