import { Pool, QueryResult } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required for database access.')
}

const pool = new Pool({ connectionString })

export async function query<T extends Record<string, unknown> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params)
}

export async function getClient() {
  return pool.connect()
}
