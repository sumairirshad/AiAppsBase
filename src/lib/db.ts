import { Pool, QueryResult } from 'pg'

let pool: Pool | null = null

/**
 * Most managed Postgres providers (RDS, Supabase, Neon, Render, etc.) require
 * TLS and reject plain connections outright. DATABASE_SSL lets an operator
 * override the default (`require` in production, off for local dev) when a
 * given deployment needs the opposite.
 */
function resolveSsl(): false | { rejectUnauthorized: boolean } {
  const mode = process.env.DATABASE_SSL
  if (mode === 'disable') return false
  if (mode === 'require') return { rejectUnauthorized: false }
  return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for database access.')
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: resolveSsl(),
      max: Number(process.env.DATABASE_POOL_MAX) || 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  return pool
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export async function query<T extends Record<string, unknown> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params)
}

export async function getClient() {
  return getPool().connect()
}
