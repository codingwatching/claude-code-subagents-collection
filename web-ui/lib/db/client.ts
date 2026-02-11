import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

function createDb() {
  const sql = neon(process.env.POSTGRES_URL!)
  return drizzle(sql, { schema })
}

type DB = ReturnType<typeof createDb>

let _db: DB | undefined

// Lazy-initialized proxy: defers neon() connection from module-load time
// to first property access. This allows next build to import the module
// without requiring POSTGRES_URL at build time.
export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    if (!_db) _db = createDb()
    return Reflect.get(_db, prop, receiver)
  },
})

export type DbClient = typeof db
