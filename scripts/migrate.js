#!/usr/bin/env node

const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const fs = require('fs')
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('Skipping migrations: DATABASE_URL is not set (set it in .env.local).')
  process.exit(0)
}

async function main() {
  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    const migrationsDir = path.join(__dirname, '../migrations')
    if (!fs.existsSync(migrationsDir)) {
      console.warn('Migrations directory not found:', migrationsDir)
      return
    }

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

    for (const file of files) {
      const already = await client.query('SELECT 1 FROM migrations WHERE name = $1', [file])
      if (already.rowCount > 0) continue

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      console.log(`Applying migration ${file}...`)
      await client.query(sql)
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [file])
    }

    console.log('Migrations complete.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
