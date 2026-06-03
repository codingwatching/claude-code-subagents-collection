#!/usr/bin/env node
/**
 * One-time migration script to re-categorize existing skills using
 * keyword inference from name + description.
 *
 * Also fixes:
 * - Slug-like names → humanized names
 * - Broken descriptions ("name: slug-name" → humanized, "---" → "Skill from {namespace}")
 *
 * Usage: node scripts/categorize-skills.js [--dry-run]
 */

const postgres = require('postgres')

const POSTGRES_URL = process.env.POSTGRES_URL
if (!POSTGRES_URL) {
  console.error('POSTGRES_URL is required (set it in the environment).')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')

// --- Valid categories (mirrors web-ui/lib/category-utils.ts) ---

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
  // Useless source categories
  'skills': 'uncategorized',
  'skill': 'uncategorized',
  'skill-enhancers': 'uncategorized',
  'skills-library': 'uncategorized',
}

function normalizeSkillCategory(category) {
  if (!category) return 'uncategorized'
  const lower = category.toLowerCase().trim()
  if (VALID_SKILL_CATEGORIES.has(lower)) return lower
  return SKILL_CATEGORY_ALIASES[lower] || 'uncategorized'
}

// --- Keyword inference (mirrors web-ui/lib/category-utils.ts) ---

const CATEGORY_KEYWORDS = {
  'security': ['security', 'vulnerability', 'pentest', 'encryption', 'defense in depth'],
  'ai-ml': ['hallucination', 'prompt engineering', 'llm', 'ai model', 'ai agent', 'confidence', 'uncertainty', 'citation', 'grounding', 'output-audit', 'source-verif', 'cross-check', 'opencode', 'truncation', 'foresight', 'anti-hallucination'],
  'design': ['design', 'ui/ux', 'visual', 'redesign', 'figma', 'high end visual', 'typography', 'fonts', 'spacing', 'animation', 'color scheme', 'premium quality', 'aesthetic', 'pixel perfect', 'agency'],
  'devops': ['ci-cd', 'ci cd', 'deployment', 'deploy', 'docker', 'kubernetes', 'infrastructure', 'port killer', 'smithery'],
  'project-management': ['writing plans', 'executing plans', 'task manage', 'kanban', 'project manage'],
  'automation': ['workflow', 'automat', 'pipeline', 'scripting', 'calendar'],
  'communication': ['slack', 'discord', 'messaging', 'notification'],
  'creative-collaboration': ['brainstorm', 'creative', 'whiteboard', 'ideation'],
  'business-productivity': ['venture capital', 'finance', 'sales', 'prospect', 'productivity', 'spreadsheet'],
  'analytics': ['analytics', 'data science', 'metrics', 'dashboard'],
  'document-processing': ['document', 'pdf', 'markdown process'],
  'development-code': ['code review', 'debug', 'testing', 'tdd', 'test writer', 'refactor', 'github', 'git', 'commit', 'api doc', 'frontend', 'backend', 'typescript', 'javascript', 'php', 'elixir', 'swift', 'nest', 'astro', 'vitest', 'linting', 'web fetch', 'error explain', 'pr analy', 'codebase', 'full-stack', 'full stack', 'coding', 'programmer'],
}

function inferSkillCategory(name, description) {
  const text = `${name} ${description}`.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category
      }
    }
  }
  return 'uncategorized'
}

function smartCategorizeSkill(sourceCategory, name, description) {
  const normalized = normalizeSkillCategory(sourceCategory)
  if (normalized !== 'uncategorized') return normalized
  return inferSkillCategory(name, description)
}

// --- Name humanization ---

const UPPER_WORDS = new Set([
  'api', 'ci', 'cd', 'ui', 'ux', 'tdd', 'pr', 'gh', 'cli',
  'sql', 'css', 'html', 'ai', 'ml', 'llm', 'sdk',
])

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
  return /^[a-z0-9]+([-_][a-z0-9]+)+$/.test(name)
}

// --- Description fixes ---

function fixDescription(description, name, namespace) {
  if (!description) return null

  // Fix "name: slug-name" pattern
  if (/^name:\s*\S+$/i.test(description.trim())) {
    return humanizeName(name)
  }

  // Fix bare "---"
  if (description.trim() === '---') {
    const owner = namespace ? namespace.replace(/^@([^/]+)\/.*/, '$1') : 'unknown'
    return `Skill from ${owner}`
  }

  return null // no fix needed
}

// --- Main ---

async function main() {
  const sql = postgres(POSTGRES_URL)

  try {
    // Fetch all active skills
    const skills = await sql`
      SELECT id, name, namespace, slug, description, categories
      FROM plugins
      WHERE type = 'skill' AND active = true
      ORDER BY name
    `

    console.log(`Found ${skills.length} active skills`)
    if (DRY_RUN) console.log('DRY RUN — no changes will be made\n')

    let nameChanges = 0
    let categoryChanges = 0
    let descriptionChanges = 0
    let unchanged = 0

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

      // 2. Fix broken descriptions
      const fixedDesc = fixDescription(skill.description, skill.name, skill.namespace)
      if (fixedDesc) {
        updates.description = fixedDesc
        descriptionChanges++
      }

      // 3. Smart re-categorize
      const oldCategories = skill.categories || []
      const effectiveName = skill.name  // always use original for keyword matching
      const effectiveDesc = updates.description || skill.description || ''
      const oldCat = oldCategories.length > 0 ? oldCategories[0] : null
      const newCat = smartCategorizeSkill(oldCat, effectiveName, effectiveDesc)
      const newCategories = [newCat]

      const catChanged = JSON.stringify(oldCategories) !== JSON.stringify(newCategories)
      if (catChanged) {
        updates.categories = newCategories
        categoryChanges++
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        const logParts = [`  ${skill.name} (${skill.id.slice(0, 8)}...)`]
        if (updates.name) logParts.push(`    name: "${skill.name}" → "${updates.name}"`)
        if (updates.description) logParts.push(`    desc: "${skill.description}" → "${updates.description}"`)
        if (updates.categories) logParts.push(`    categories: [${oldCategories.join(', ')}] → [${updates.categories.join(', ')}]`)
        console.log(logParts.join('\n'))

        if (!DRY_RUN) {
          await sql`
            UPDATE plugins
            SET
              name = ${updates.name || skill.name},
              description = ${updates.description || skill.description || ''},
              categories = ${updates.categories || skill.categories || []},
              updated_at = NOW()
            WHERE id = ${skill.id}
          `
        }
      } else {
        unchanged++
      }
    }

    console.log(`\n--- Summary ---`)
    console.log(`Total active skills:    ${skills.length}`)
    console.log(`Names humanized:        ${nameChanges}`)
    console.log(`Descriptions fixed:     ${descriptionChanges}`)
    console.log(`Categories improved:    ${categoryChanges}`)
    console.log(`Unchanged:              ${unchanged}`)
    if (DRY_RUN) console.log('\n(dry run — re-run without --dry-run to apply)')
  } finally {
    await sql.end()
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
