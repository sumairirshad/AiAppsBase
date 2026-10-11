import { defineConfig } from 'vitest/config'
import path from 'path'
import dotenv from 'dotenv'

// Integration tests need DATABASE_URL (and, for the ones that mock Stripe
// instead of a real call, nothing else) — load it the same way scripts/migrate.js
// does for local runs. CI sets DATABASE_URL directly in the workflow env, so
// this is a no-op there.
dotenv.config({ path: path.resolve(__dirname, '.env.local') })
dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
