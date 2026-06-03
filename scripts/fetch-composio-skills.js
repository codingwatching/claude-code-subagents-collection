#!/usr/bin/env node

/**
 * Fetch Composio Awesome-Claude-Skills
 *
 * Imports non-duplicate skills from ComposioHQ/awesome-claude-skills into
 * plugins/all-skills/skills/. Reads the marketplace.json for the canonical
 * list, fetches each skill directory (SKILL.md + any extra files), maps
 * categories, and writes locally.
 */

const fs = require('fs').promises;
const path = require('path');

const REPO = 'ComposioHQ/awesome-claude-skills';
const BRANCH = 'master';
const GITHUB_API = 'https://api.github.com';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const SKILLS_DIR = path.join(__dirname, '..', 'plugins', 'all-skills', 'skills');

// Skills that already exist locally (exact slug match)
const EXISTING_SLUGS = new Set([
  'artifacts-builder', 'brand-guidelines', 'canvas-design', 'changelog-generator',
  'competitive-ads-extractor', 'content-research-writer', 'developer-growth-analysis',
  'domain-name-brainstormer', 'file-organizer', 'image-enhancer', 'internal-comms',
  'invoice-organizer', 'lead-research-assistant', 'mcp-builder', 'meeting-insights-analyzer',
  'raffle-winner-picker', 'skill-creator', 'slack-gif-creator', 'theme-factory',
  'video-downloader', 'webapp-testing',
]);

// Renamed duplicates (Composio slug -> our slug)
const RENAMED_DUPLICATES = new Set([
  'document-skills-docx', 'document-skills-pdf', 'document-skills-pptx', 'document-skills-xlsx',
]);

// Meta/template skills to skip
const SKIP_SLUGS = new Set(['template-skill']);

// Category mapping: Composio category -> BWC category
const CATEGORY_MAP = {
  'analytics': 'analytics',
  'automation': 'automation',
  'business-marketing': 'business-productivity',
  'calendar': 'automation',
  'communication': 'communication',
  'communication-writing': 'creative-collaboration',
  'creative-media': 'creative-collaboration',
  'crm': 'crm',
  'design': 'design',
  'development': 'development-code',
  'devops': 'devops',
  'ecommerce': 'ecommerce',
  'email': 'email',
  'hr': 'business-productivity',
  'productivity-organization': 'business-productivity',
  'project-management': 'project-management',
  'social-media': 'social-media',
  'spreadsheets': 'business-productivity',
  'storage-docs': 'storage-docs',
  'support': 'customer-support',
};

function shouldSkip(slug) {
  return EXISTING_SLUGS.has(slug) || RENAMED_DUPLICATES.has(slug) || SKIP_SLUGS.has(slug);
}

/**
 * Make a GitHub API request with optional authentication
 */
async function githubFetch(url) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'buildwithclaude-composio-fetch',
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

/**
 * Fetch a raw file from the repo
 */
async function fetchRawFile(filePath) {
  const url = `${RAW_BASE}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response;
}

/**
 * List contents of a directory in the repo via GitHub Contents API
 */
async function listDirectoryContents(dirPath) {
  try {
    const url = `${GITHUB_API}/repos/${REPO}/contents/${encodeURIComponent(dirPath)}?ref=${BRANCH}`;
    const data = await githubFetch(url);
    if (!Array.isArray(data)) return [];
    return data.map(item => ({ path: item.path, type: item.type, name: item.name }));
  } catch {
    return [];
  }
}

/**
 * Recursively list all files in a directory
 */
async function listAllFilesRecursive(dirPath) {
  const entries = await listDirectoryContents(dirPath);
  const allFiles = [];

  for (const entry of entries) {
    if (entry.type === 'dir') {
      const subFiles = await listAllFilesRecursive(entry.path);
      allFiles.push(...subFiles);
    } else {
      allFiles.push(entry.path);
    }
  }

  return allFiles;
}

/**
 * Fetch marketplace.json from Composio repo
 */
async function fetchMarketplace() {
  const data = await githubFetch(
    `${GITHUB_API}/repos/${REPO}/contents/.claude-plugin/marketplace.json?ref=${BRANCH}`
  );
  const jsonStr = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(jsonStr);
}

/**
 * Add/update category in SKILL.md frontmatter
 */
function ensureCategory(skillMdContent, category) {
  const frontmatterMatch = skillMdContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return `---\ncategory: ${category}\n---\n\n${skillMdContent}`;
  }

  const frontmatter = frontmatterMatch[1];
  if (/^category:/m.test(frontmatter)) {
    const updatedFrontmatter = frontmatter.replace(/^category:.*$/m, `category: ${category}`);
    return skillMdContent.replace(frontmatterMatch[0], `---\n${updatedFrontmatter}\n---`);
  }

  const updatedFrontmatter = frontmatter + `\ncategory: ${category}`;
  return skillMdContent.replace(frontmatterMatch[0], `---\n${updatedFrontmatter}\n---`);
}

/**
 * Download and save a single skill
 */
async function downloadSkill(plugin) {
  const slug = plugin.name;
  const composioCategory = plugin.category || 'uncategorized';
  const bwcCategory = CATEGORY_MAP[composioCategory] || composioCategory;
  const skillDir = path.join(SKILLS_DIR, slug);

  // Fetch SKILL.md first (required)
  const skillMdResponse = await fetchRawFile(`${slug}/SKILL.md`);
  if (!skillMdResponse) {
    return { slug, status: 'failed', reason: 'SKILL.md not found' };
  }

  let skillMdContent = await skillMdResponse.text();

  // Ensure category is set in frontmatter
  skillMdContent = ensureCategory(skillMdContent, bwcCategory);

  // Create skill directory
  await fs.mkdir(skillDir, { recursive: true });

  // Write SKILL.md
  await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillMdContent);

  // Fetch additional files in the skill directory
  const entries = await listDirectoryContents(slug);
  let extraFiles = 0;

  for (const entry of entries) {
    if (entry.name === 'SKILL.md') continue; // Already handled

    if (entry.type === 'dir') {
      // Recursively fetch all files in subdirectory
      const subFiles = await listAllFilesRecursive(entry.path);
      for (const subFile of subFiles) {
        const relativePath = subFile.substring(slug.length + 1);
        const localPath = path.join(skillDir, relativePath);
        await fs.mkdir(path.dirname(localPath), { recursive: true });

        const response = await fetchRawFile(subFile);
        if (response) {
          const buffer = Buffer.from(await response.arrayBuffer());
          await fs.writeFile(localPath, buffer);
          extraFiles++;
        }
      }
    } else {
      // Download file directly
      const response = await fetchRawFile(entry.path);
      if (response) {
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(path.join(skillDir, entry.name), buffer);
        extraFiles++;
      }
    }
  }

  return { slug, status: 'added', category: bwcCategory, extraFiles };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching Composio awesome-claude-skills...\n');

  // Step 1: Fetch marketplace.json
  console.log('Fetching marketplace.json...');
  const marketplace = await fetchMarketplace();
  const plugins = marketplace.plugins;
  console.log(`Found ${plugins.length} skills in marketplace.json\n`);

  // Step 2: Filter out duplicates
  const toImport = plugins.filter(p => !shouldSkip(p.name));
  const skipped = plugins.filter(p => shouldSkip(p.name));
  console.log(`Skipping ${skipped.length} duplicates/templates:`);
  for (const s of skipped) {
    console.log(`  - ${s.name}`);
  }
  console.log(`\nImporting ${toImport.length} new skills...\n`);

  // Step 3: Download each skill
  const results = { added: [], skipped: skipped.map(s => s.name), failed: [] };
  let processed = 0;

  for (const plugin of toImport) {
    processed++;
    process.stdout.write(`[${processed}/${toImport.length}] ${plugin.name}... `);

    try {
      const result = await downloadSkill(plugin);
      if (result.status === 'added') {
        results.added.push(result.slug);
        const extraNote = result.extraFiles > 0 ? ` (+${result.extraFiles} extra files)` : '';
        console.log(`added [${result.category}]${extraNote}`);
      } else {
        results.failed.push({ slug: result.slug, reason: result.reason });
        console.log(`FAILED: ${result.reason}`);
      }
    } catch (error) {
      results.failed.push({ slug: plugin.name, reason: error.message });
      console.log(`FAILED: ${error.message}`);
    }

    // Rate limit: small delay between requests
    await sleep(200);
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Added:   ${results.added.length}`);
  console.log(`Skipped: ${results.skipped.length}`);
  console.log(`Failed:  ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log('\nFailed skills:');
    for (const f of results.failed) {
      console.log(`  - ${f.slug}: ${f.reason}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
