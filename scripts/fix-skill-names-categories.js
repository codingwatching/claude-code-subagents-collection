#!/usr/bin/env node
/**
 * One-time migration script to fix existing skill names, categories,
 * and marketplaceName in the plugins table.
 *
 * Fixes:
 * 1. Names: Humanize slug-like names (e.g., "design-taste-frontend" → "Design Taste Frontend")
 * 2. marketplaceName: Replace "Community Submitted" with GitHub owner from namespace
 * 3. Categories: Normalize invalid categories to valid skill categories
 *
 * Usage: node scripts/fix-skill-names-categories.js [--dry-run]
 */

const postgres = require('postgres')

const POSTGRES_URL = process.env.POSTGRES_URL
if (!POSTGRES_URL) {
  console.error('POSTGRES_URL is required (set it in the environment).')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')

// --- Category normalization (mirrors web-ui/lib/category-utils.ts) ---

const VALID_SKILL_CATEGORIES = new Set([
  'ai-ml', 'analytics', 'automation', 'business-productivity', 'communication',
  'creative-collaboration', 'crm', 'customer-support', 'design', 'development-code',
  'devops', 'document-processing', 'ecommerce', 'email', 'project-management',
  'security', 'social-media', 'storage-docs', 'uncategorized',
])

const SKILL_CATEGORY_ALIASES = {
  'ai': 'ai-ml',
  'machine-learning': 'ai-ml',
  'ml': 'ai-ml',
  'development': 'development-code',
  'coding': 'development-code',
  'frontend': 'development-code',
  'backend': 'development-code',
  'testing': 'development-code',
  'database': 'development-code',
  'mobile': 'development-code',
  'documentation': 'document-processing',
  'data': 'analytics',
  'workflow': 'automation',
  'commerce': 'ecommerce',
  'marketing': 'social-media',
  'support': 'customer-support',
  'productivity': 'business-productivity',
  'collaboration': 'creative-collaboration',
  'storage': 'storage-docs',
  // Additional aliases for categories found in the data
  'skills': 'uncategorized',
  'skill': 'uncategorized',
  'skill-enhancers': 'uncategorized',
  'skills-library': 'uncategorized',
  'development skills': 'development-code',
}

function normalizeSkillCategory(category) {
  if (!category) return 'uncategorized'
  const lower = category.toLowerCase().trim()
  if (VALID_SKILL_CATEGORIES.has(lower)) return lower
  return SKILL_CATEGORY_ALIASES[lower] || 'uncategorized'
}

// --- Name humanization ---

// Known abbreviations that should be uppercased
const UPPER_WORDS = new Set([
  'api', 'ci', 'cd', 'ui', 'ux', 'tdd', 'pr', 'gh', 'cli',
  'sql', 'css', 'html', 'ai', 'ml', 'llm', 'sdk',
])

// Known casing overrides for specific words
const CASING_OVERRIDES = {
  'github': 'GitHub',
  'swiftui': 'SwiftUI',
  'graphql': 'GraphQL',
  'nextjs': 'NextJS',
  'nodejs': 'NodeJS',
  'typescript': 'TypeScript',
  'javascript': 'JavaScript',
  'mongodb': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'eslint': 'ESLint',
  'vitest': 'Vitest',
}

function humanizeName(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .map(word => {
      const lower = word.toLowerCase()
      if (UPPER_WORDS.has(lower)) return word.toUpperCase()
      if (CASING_OVERRIDES[lower]) return CASING_OVERRIDES[lower]
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
    .trim()
}

function isSlugLike(name) {
  // A name is slug-like if it contains hyphens or underscores and is all lowercase
  return /^[a-z0-9]+([-_][a-z0-9]+)+$/.test(name)
}

// --- Main ---

async function main() {
  const sql = postgres(POSTGRES_URL)

  try {
    // Fetch all skills from plugins table
    const skills = await sql`
      SELECT id, name, namespace, slug, marketplace_name, categories
      FROM plugins
      WHERE type = 'skill'
      ORDER BY name
    `

    console.log(`Found ${skills.length} skills in plugins table`)
    if (DRY_RUN) console.log('DRY RUN — no changes will be made\n')

    let nameChanges = 0
    let marketplaceChanges = 0
    let categoryChanges = 0

    for (const skill of skills) {
      const updates = {}

      // 1. Fix slug-like names
      if (isSlugLike(skill.name)) {
        const newName = humanizeName(skill.name)
        if (newName !== skill.name) {
          updates.name = newName
          nameChanges++
        }
      }

      // 2. Fix "Community Submitted" marketplaceName → owner from namespace
      if (skill.marketplace_name === 'Community Submitted') {
        // namespace is "@owner/slug" — extract owner
        const match = skill.namespace.match(/^@([^/]+)\//)
        if (match) {
          updates.marketplace_name = match[1]
          marketplaceChanges++
        }
      }

      // 3. Fix categories
      const oldCategories = skill.categories || []
      const newCategories = oldCategories.length === 0
        ? ['uncategorized']
        : oldCategories.map(c => normalizeSkillCategory(c))

      // Deduplicate
      const uniqueNew = [...new Set(newCategories)]
      const changed = JSON.stringify(oldCategories) !== JSON.stringify(uniqueNew)
      if (changed) {
        updates.categories = uniqueNew
        categoryChanges++
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        const logParts = [`  ${skill.name} (${skill.id})`]
        if (updates.name) logParts.push(`    name: "${skill.name}" → "${updates.name}"`)
        if (updates.marketplace_name) logParts.push(`    source: "Community Submitted" → "${updates.marketplace_name}"`)
        if (updates.categories) logParts.push(`    categories: [${oldCategories.join(', ')}] → [${updates.categories.join(', ')}]`)
        console.log(logParts.join('\n'))

        if (!DRY_RUN) {
          await sql`
            UPDATE plugins
            SET
              name = ${updates.name || skill.name},
              marketplace_name = ${updates.marketplace_name || skill.marketplace_name},
              categories = ${updates.categories || skill.categories || []},
              updated_at = NOW()
            WHERE id = ${skill.id}
          `
        }
      }
    }

    console.log(`\n--- Summary ---`)
    console.log(`Names humanized:      ${nameChanges}`)
    console.log(`Sources fixed:        ${marketplaceChanges}`)
    console.log(`Categories normalized: ${categoryChanges}`)
    if (DRY_RUN) console.log('\n(dry run — re-run without --dry-run to apply)')
  } finally {
    await sql.end()
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
