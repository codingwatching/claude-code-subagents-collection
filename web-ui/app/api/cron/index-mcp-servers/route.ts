import { NextRequest, NextResponse } from 'next/server'
import { indexMCPServers } from '@/lib/indexer/mcp-server-indexer'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for cron job

/**
 * Vercel Cron endpoint for MCP server indexing
 * Scheduled to run daily at 5 AM UTC via vercel.json (before marketplace/plugin indexing)
 */
export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('MCP server indexer CRON started')
    const result = await indexMCPServers()

    console.log(
      `MCP server indexer completed: ${result.indexed} indexed, ${result.failed} failed in ${result.durationMs}ms`
    )

    return NextResponse.json({
      success: true,
      indexed: result.indexed,
      failed: result.failed,
      skipped: result.skipped,
      durationMs: result.durationMs,
      sources: result.sources,
    })
  } catch (error) {
    console.error('MCP server CRON indexer failed:', error)
    return NextResponse.json(
      { error: 'MCP server indexing failed', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
