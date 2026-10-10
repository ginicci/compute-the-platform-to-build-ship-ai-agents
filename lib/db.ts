import { databaseTarget } from '@/lib/database-target'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const pool = new Pool({ connectionString: databaseTarget() })
export const db = drizzle(pool)
