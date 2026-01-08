import { NextRequest, NextResponse } from 'next/server'
import { indexMCPServers, syncMCPServerStats } from '@/lib/indexer/mcp-server-indexer'
import { indexMarketplaces } from '@/lib/indexer/marketplace-indexer'
import { indexPlugins } from '@/lib/indexer/plugin-indexer'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for cron job

/**
 * Unified Vercel Cron endpoint for all indexing tasks
 * Scheduled to run daily at 5 AM UTC via vercel.json
 *
 * Runs sequentially:
 * 1. MCP servers (Official Registry + Docker Hub)
 * 2. Plugin marketplaces
 * 3. Plugins from marketplaces
 * 4. MCP server stats sync (GitHub stars, Docker pulls)
 */
export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  console.log('Unified indexer CRON started')

  const results: Record<string, unknown> = {}
  const errors: string[] = []

  // 1. Index MCP servers
  try {
    console.log('Step 1/4: Indexing MCP servers...')
    results.mcpServers = await indexMCPServers()
  } catch (error) {
    console.error('MCP server indexing failed:', error)
    errors.push(`mcpServers: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 2. Index marketplaces
  try {
    console.log('Step 2/4: Indexing marketplaces...')
    results.marketplaces = await indexMarketplaces()
  } catch (error) {
    console.error('Marketplace indexing failed:', error)
    errors.push(`marketplaces: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 3. Index plugins
  try {
    console.log('Step 3/4: Indexing plugins...')
    results.plugins = await indexPlugins()
  } catch (error) {
    console.error('Plugin indexing failed:', error)
    errors.push(`plugins: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 4. Sync MCP server stats
  try {
    console.log('Step 4/4: Syncing MCP server stats...')
    results.mcpStats = await syncMCPServerStats()
  } catch (error) {
    console.error('MCP stats sync failed:', error)
    errors.push(`mcpStats: ${error instanceof Error ? error.message : String(error)}`)
  }

  const durationMs = Date.now() - startTime
  console.log(`Unified indexer completed in ${durationMs}ms`)

  return NextResponse.json({
    success: errors.length === 0,
    durationMs,
    results,
    errors: errors.length > 0 ? errors : undefined,
  })
}
