import { db } from '@/lib/db/client'
import { plugins, skills, marketplaces } from '@/lib/db/schema'
import { eq, ilike, or, sql, desc, asc, and, inArray } from 'drizzle-orm'
import type { UnifiedPlugin, PluginType } from './plugin-types'

export type SortOption = 'relevance' | 'stars' | 'newest' | 'oldest' | 'name' | 'name-desc' | 'updated'

export interface PluginFilters {
  search?: string
  type?: PluginType | 'all'
  marketplaceId?: string
  category?: string
}

export interface PaginatedPlugins {
  plugins: UnifiedPlugin[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface MarketplaceOption {
  id: string
  name: string
  displayName: string
  pluginCount: number
}

/**
 * Get paginated plugins from the database with optional filters
 */
export async function getPluginsPaginated(options: {
  limit?: number
  offset?: number
  search?: string
  sort?: SortOption
  type?: PluginType | 'all'
  marketplaceId?: string
  category?: string
}): Promise<PaginatedPlugins> {
  const {
    limit = 50,
    offset = 0,
    search,
    sort = 'stars',
    type = 'all',
    marketplaceId,
    category,
  } = options

  // Build where conditions
  const conditions = []

  // Active plugins only
  conditions.push(eq(plugins.active, true))

  // Type filter
  if (type && type !== 'all') {
    conditions.push(eq(plugins.type, type))
  }

  // Marketplace filter - try both marketplaceId and marketplaceName
  // (sources from plugins table use name as ID)
  if (marketplaceId) {
    conditions.push(
      or(
        eq(plugins.marketplaceId, marketplaceId),
        eq(plugins.marketplaceName, marketplaceId)
      )
    )
  }

  // Category filter
  if (category) {
    conditions.push(sql`${category} = ANY(${plugins.categories})`)
  }

  // Search filter
  if (search) {
    const searchPattern = `%${search}%`
    conditions.push(
      or(
        ilike(plugins.name, searchPattern),
        ilike(plugins.description, searchPattern),
        sql`${search} = ANY(${plugins.keywords})`
      )
    )
  }

  // Determine sort order
  let orderBy
  switch (sort) {
    case 'name':
      orderBy = asc(plugins.name)
      break
    case 'name-desc':
      orderBy = desc(plugins.name)
      break
    case 'newest':
      orderBy = desc(plugins.updatedAt)
      break
    case 'oldest':
      orderBy = asc(plugins.updatedAt)
      break
    case 'updated':
      // Keep for backwards compatibility
      orderBy = desc(plugins.updatedAt)
      break
    case 'relevance':
      // For relevance, prioritize Build with Claude plugins first
      if (search) {
        orderBy = sql`
          CASE WHEN ${plugins.marketplaceName} = 'Build with Claude' THEN 0 ELSE 1 END,
          CASE
            WHEN ${plugins.name} ILIKE ${search} THEN 0
            WHEN ${plugins.name} ILIKE ${`${search}%`} THEN 1
            WHEN ${plugins.name} ILIKE ${`%${search}%`} THEN 2
            WHEN ${plugins.description} ILIKE ${`%${search}%`} THEN 3
            ELSE 4
          END,
          COALESCE(${plugins.stars}, 0) DESC
        `
      } else {
        // When no search, prioritize Build with Claude plugins, then sort by name
        orderBy = sql`
          CASE WHEN ${plugins.marketplaceName} = 'Build with Claude' THEN 0 ELSE 1 END,
          ${plugins.name} ASC
        `
      }
      break
    case 'stars':
    default:
      // Use COALESCE to put plugins without stars at the end
      orderBy = sql`COALESCE(${plugins.stars}, 0) DESC`
      break
  }

  // Execute query
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [results, countResult] = await Promise.all([
    db
      .select({
        id: plugins.id,
        name: plugins.name,
        namespace: plugins.namespace,
        slug: plugins.slug,
        description: plugins.description,
        version: plugins.version,
        author: plugins.author,
        type: plugins.type,
        categories: plugins.categories,
        keywords: plugins.keywords,
        repository: plugins.repository,
        stars: plugins.stars,
        installCommand: plugins.installCommand,
        marketplaceId: plugins.marketplaceId,
        marketplaceName: plugins.marketplaceName,
        updatedAt: plugins.updatedAt,
      })
      .from(plugins)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(plugins)
      .where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  // Transform to UnifiedPlugin format
  const unifiedPlugins: UnifiedPlugin[] = results.map((p) => ({
    type: (p.type as PluginType) || 'plugin',
    name: p.name,
    description: p.description || '',
    category: p.categories?.[0] || 'uncategorized',
    tags: p.keywords || [],
    marketplaceId: p.marketplaceId || undefined,
    marketplaceName: p.marketplaceName || undefined,
    repository: p.repository || undefined,
    stars: p.stars,
    installCommand: p.installCommand || undefined,
    namespace: p.namespace,
    author: p.author || undefined,
    version: p.version || undefined,
  }))

  return {
    plugins: unifiedPlugins,
    total,
    limit,
    offset,
    hasMore: offset + results.length < total,
  }
}

/**
 * Get list of marketplaces for filter dropdown
 * Includes both registered marketplaces and any marketplace names found in plugins
 */
export async function getPluginMarketplaces(): Promise<MarketplaceOption[]> {
  // Get registered marketplaces from marketplaces table
  const dbMarketplaces = await db
    .select({
      id: marketplaces.id,
      name: marketplaces.name,
      displayName: marketplaces.displayName,
      pluginCount: marketplaces.pluginCount,
    })
    .from(marketplaces)
    .where(eq(marketplaces.active, true))
    .orderBy(desc(marketplaces.pluginCount))

  // Also get unique marketplaceNames from plugins (to include sources not in marketplaces table)
  const pluginMarketplaces = await db
    .select({
      marketplaceName: plugins.marketplaceName,
      count: sql<number>`count(*)`,
    })
    .from(plugins)
    .where(eq(plugins.active, true))
    .groupBy(plugins.marketplaceName)

  // Map db marketplaces to result format
  const results: MarketplaceOption[] = dbMarketplaces.map((m) => ({
    id: m.id,
    name: m.name,
    displayName: m.displayName,
    pluginCount: m.pluginCount,
  }))

  // Add any marketplace names from plugins that aren't already in results
  const existingNames = new Set(results.map((m) => m.displayName))
  for (const pm of pluginMarketplaces) {
    if (pm.marketplaceName && !existingNames.has(pm.marketplaceName)) {
      results.push({
        id: pm.marketplaceName, // Use name as ID for filtering by marketplaceName
        name: pm.marketplaceName,
        displayName: pm.marketplaceName,
        pluginCount: Number(pm.count),
      })
    }
  }

  // Sort by plugin count descending
  return results.sort((a, b) => b.pluginCount - a.pluginCount)
}

/**
 * Get plugin stats for the UI (matching plugin-server.ts format)
 */
export async function getPluginStatsForUI(): Promise<{
  total: number
  subagents: number
  commands: number
  hooks: number
  skills: number
  plugins: number
}> {
  const typeStats = await db
    .select({
      type: plugins.type,
      count: sql<number>`count(*)`,
    })
    .from(plugins)
    .where(eq(plugins.active, true))
    .groupBy(plugins.type)

  const counts = {
    total: 0,
    subagents: 0,
    commands: 0,
    hooks: 0,
    skills: 0,
    plugins: 0,
  }

  for (const stat of typeStats) {
    const count = Number(stat.count)
    counts.total += count

    switch (stat.type) {
      case 'subagent':
        counts.subagents = count
        break
      case 'command':
        counts.commands = count
        break
      case 'hook':
        counts.hooks = count
        break
      case 'skill':
        counts.skills = count
        break
      case 'plugin':
      case 'mcp':
      default:
        counts.plugins += count
        break
    }
  }

  return counts
}

/**
 * Get plugin stats by type and marketplace
 */
export async function getPluginStats(): Promise<{
  total: number
  byType: Record<string, number>
  byMarketplace: Record<string, number>
}> {
  // Count by type
  const typeStats = await db
    .select({
      type: plugins.type,
      count: sql<number>`count(*)`,
    })
    .from(plugins)
    .where(eq(plugins.active, true))
    .groupBy(plugins.type)

  // Count by marketplace
  const marketplaceStats = await db
    .select({
      marketplaceName: plugins.marketplaceName,
      count: sql<number>`count(*)`,
    })
    .from(plugins)
    .where(eq(plugins.active, true))
    .groupBy(plugins.marketplaceName)

  const byType: Record<string, number> = {}
  let total = 0

  for (const stat of typeStats) {
    byType[stat.type] = Number(stat.count)
    total += Number(stat.count)
  }

  const byMarketplace: Record<string, number> = {}
  for (const stat of marketplaceStats) {
    if (stat.marketplaceName) {
      byMarketplace[stat.marketplaceName] = Number(stat.count)
    }
  }

  return { total, byType, byMarketplace }
}

/**
 * Get skills paginated
 */
export async function getSkillsPaginated(options: {
  limit?: number
  offset?: number
  search?: string
  marketplaceId?: string
  category?: string
}): Promise<{
  skills: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    category: string | null
    marketplaceName: string | null
    repository: string | null
  }>
  total: number
  hasMore: boolean
}> {
  const { limit = 50, offset = 0, search, marketplaceId, category } = options

  const conditions = [eq(skills.active, true)]

  if (marketplaceId) {
    conditions.push(eq(skills.marketplaceId, marketplaceId))
  }

  if (category) {
    conditions.push(eq(skills.category, category))
  }

  if (search) {
    const searchPattern = `%${search}%`
    const searchCondition = or(
      ilike(skills.name, searchPattern),
      ilike(skills.description, searchPattern)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [results, countResult] = await Promise.all([
    db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        category: skills.category,
        marketplaceName: skills.marketplaceName,
        repository: skills.repository,
      })
      .from(skills)
      .where(whereClause)
      .orderBy(asc(skills.name))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return {
    skills: results,
    total,
    hasMore: offset + results.length < total,
  }
}

/**
 * Get plugin by slug or name
 */
export async function getPluginBySlug(slug: string): Promise<UnifiedPlugin | null> {
  const result = await db
    .select()
    .from(plugins)
    .where(or(eq(plugins.slug, slug), eq(plugins.name, slug)))
    .limit(1)

  if (!result.length) return null

  const p = result[0]
  return {
    type: (p.type as PluginType) || 'plugin',
    name: p.name,
    description: p.description || '',
    category: p.categories?.[0] || 'uncategorized',
    tags: p.keywords || [],
    marketplaceId: p.marketplaceId || undefined,
    marketplaceName: p.marketplaceName || undefined,
    repository: p.repository || undefined,
    stars: p.stars,
    installCommand: p.installCommand || undefined,
    namespace: p.namespace,
    author: p.author || undefined,
    version: p.version || undefined,
  }
}
