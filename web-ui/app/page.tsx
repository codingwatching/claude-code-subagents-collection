import { getAllSubagents } from '@/lib/subagents-server'
import { getAllCommands } from '@/lib/commands-server'
import { getAllPlugins } from '@/lib/plugins-server'
import { getAllSkills } from '@/lib/skills-server'
import HomePageClient from './page-client'

export default function Home() {
  const plugins = getAllPlugins()
  const subagents = getAllSubagents()
  const commands = getAllCommands()
  const skills = getAllSkills()

  return (
    <HomePageClient
      pluginCount={plugins.length}
      subagentCount={subagents.length}
      commandCount={commands.length}
      skillCount={skills.length}
      featuredPlugins={plugins.slice(0, 6)}
    />
  )
}
