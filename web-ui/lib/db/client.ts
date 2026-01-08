import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Create a Neon serverless SQL client
const sql = neon(process.env.POSTGRES_URL!)

// Create a Drizzle ORM client using Neon HTTP
export const db = drizzle(sql, { schema })

// Export for type inference
export type DbClient = typeof db
