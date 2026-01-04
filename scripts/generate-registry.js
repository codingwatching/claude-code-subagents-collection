#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { fetchDockerMCPServers } = require('./fetch-docker-mcp');
const { fetchOfficialMCPServers } = require('./fetch-official-mcp');
const { enhanceMCPServersWithDockerStats } = require('./enhance-docker-stats');

const REPO_ROOT = path.join(__dirname, '..');
const SUBAGENTS_DIR = path.join(REPO_ROOT, 'plugins/all-agents/agents');
const COMMANDS_DIR = path.join(REPO_ROOT, 'plugins/all-commands/commands');
const HOOKS_DIR = path.join(REPO_ROOT, 'plugins/all-hooks/hooks');
const MCP_SERVERS_DIR = path.join(REPO_ROOT, 'mcp-servers');
const OUTPUT_PATH = path.join(REPO_ROOT, 'web-ui', 'public', 'registry.json');

async function getSubagents() {
  const files = await fs.readdir(SUBAGENTS_DIR);
  const subagents = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filePath = path.join(SUBAGENTS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    
    subagents.push({
      name: data.name || file.replace('.md', ''),
      category: data.category || 'uncategorized',
      description: data.description || '',
      version: '1.0.0',
      file: `subagents/${file}`,
      path: file.replace('.md', ''),
      tools: data.tools || [],
      tags: data.tags || []
    });
  }

  return subagents.sort((a, b) => a.name.localeCompare(b.name));
}

async function getCommands() {
  const files = await fs.readdir(COMMANDS_DIR);
  const commands = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filePath = path.join(COMMANDS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    
    commands.push({
      name: data.name || file.replace('.md', ''),
      category: data.category || 'uncategorized',
      description: data.description || '',
      version: '1.0.0',
      file: `commands/${file}`,
      path: file.replace('.md', ''),
      argumentHint: data.argumentHint || '<args>',
      model: data.model || 'claude-3.5',
      prefix: data.prefix || '/',
      tags: data.tags || []
    });
  }

  return commands.sort((a, b) => a.name.localeCompare(b.name));
}

async function getHooks() {
  try {
    const files = await fs.readdir(HOOKS_DIR);
    const hooks = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(HOOKS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data } = matter(content);

      hooks.push({
        name: data.name || file.replace('.md', ''),
        category: data.category || 'automation',
        description: data.description || '',
        event: data.event || 'PostToolUse',
        matcher: data.matcher || '*',
        language: data.language || 'bash',
        version: data.version || '1.0.0',
        file: `hooks/${file}`,
        path: file.replace('.md', ''),
        tags: data.tags || []
      });
    }

    return hooks.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('Warning: Could not read hooks directory:', error.message);
    return [];
  }
}

async function getMCPServers() {
  // We only use Docker MCP servers now, no markdown files
  // All MCP servers come from fetchDockerMCPServers()
  return [];
}

async function generateRegistry() {
  try {
    console.log('Generating registry.json...');

    const [subagents, commands, hooks, mcpServers, dockerMCPServers, officialMCPServers] = await Promise.all([
      getSubagents(),
      getCommands(),
      getHooks(),
      getMCPServers(),
      fetchDockerMCPServers(),
      fetchOfficialMCPServers()
    ]);

    // Merge all MCP servers: Official MCP > Docker MCP > Local
    // Official MCP servers take priority (have correct installation commands)
    const allMCPServers = [...mcpServers, ...dockerMCPServers, ...officialMCPServers];

    // Remove duplicates based on server name, preferring official-mcp source
    const serversByName = new Map();
    for (const server of allMCPServers) {
      const existing = serversByName.get(server.name);
      if (!existing) {
        serversByName.set(server.name, server);
      } else {
        // Prefer official-mcp over docker over others
        const existingPriority = existing.source_registry?.type === 'official-mcp' ? 2 :
                                  existing.source_registry?.type === 'docker' ? 1 : 0;
        const newPriority = server.source_registry?.type === 'official-mcp' ? 2 :
                            server.source_registry?.type === 'docker' ? 1 : 0;

        if (newPriority > existingPriority) {
          // Merge: keep new server but add docker_mcp_available flag if docker exists
          if (existingPriority === 1 || existing.source_registry?.type === 'docker') {
            server.docker_mcp_available = true;
            server.docker_mcp_command = `docker mcp server enable mcp/${server.name}`;
          }
          serversByName.set(server.name, server);
        } else if (newPriority < existingPriority && server.source_registry?.type === 'docker') {
          // Mark existing server as having docker available
          existing.docker_mcp_available = true;
          existing.docker_mcp_command = `docker mcp server enable mcp/${server.name}`;
        }
      }
    }

    const uniqueServers = Array.from(serversByName.values());

    // Enhance MCP servers with Docker Hub stats
    const enhancedServers = await enhanceMCPServersWithDockerStats(uniqueServers);

    const registry = {
      $schema: 'https://buildwithclaude.com/schema/registry.json',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      subagents,
      commands,
      hooks,
      mcpServers: enhancedServers.sort((a, b) => a.name.localeCompare(b.name))
    };

    // Ensure the public directory exists
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

    // Write the registry file
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(registry, null, 2));

    console.log(`✓ Registry generated successfully!`);
    console.log(`  - ${subagents.length} subagents`);
    console.log(`  - ${commands.length} commands`);
    console.log(`  - ${hooks.length} hooks`);
    console.log(`  - ${uniqueServers.length} MCP servers`);
    console.log(`    - ${officialMCPServers.length} from Official MCP Registry`);
    console.log(`    - ${dockerMCPServers.length} from Docker MCP`);
    console.log(`  - Output: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error generating registry:', error);
    process.exit(1);
  }
}

// Run the script
generateRegistry();