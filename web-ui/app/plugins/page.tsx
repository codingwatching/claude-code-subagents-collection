import { Suspense } from 'react'
import { getAllPlugins, getAllPluginCategories } from '@/lib/plugins-server'
import PluginsPageClient from './plugins-client'

export const metadata = {
  title: 'Plugins | BuildWithClaude',
  description: 'Browse and install Claude Code plugins from the BuildWithClaude marketplace',
}

export default function PluginsPage() {
  const allPlugins = getAllPlugins()
  const categories = getAllPluginCategories()

  return (
    <Suspense fallback={null}>
      <PluginsPageClient allPlugins={allPlugins} categories={categories} />
    </Suspense>
  )
}
