import { Pool, QueryResult } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for database access.')
  }
  if (!pool) {
    pool = new Pool({ connectionString })
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
