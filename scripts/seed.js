#!/usr/bin/env node
/**
 * Demo data seeder for AIAppsBase.
 *
 * Populates the database with realistic sellers, buyers, products, reviews,
 * orders, and wishlists so a fresh install looks fully launched. Safe to run
 * against an empty database; skips if products already exist (use FORCE=1 to
 * wipe and reseed the demo rows).
 *
 *   DATABASE_URL=... npm run seed
 *   DATABASE_URL=... FORCE=1 npm run seed
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.warn('Skipping seed: DATABASE_URL is not set (set it in .env.local).')
  process.exit(0)
}

/* Deterministic PRNG so reseeds are stable. */
let s = 20260704
const rand = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (a) => a[Math.floor(rand() * a.length)]
const pickN = (a, n) => { const c = [...a], o = []; for (let i = 0; i < n && c.length; i++) o.push(c.splice(Math.floor(rand() * c.length), 1)[0]); return o }
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min

const CATEGORIES = ['SaaS', 'Website Template', 'Component Library', 'Dashboard', 'Full-Stack App', 'E-commerce', 'Mobile App', 'Landing Page', 'Portfolio', 'Blog']
const AI_TOOLS = ['Claude', 'ChatGPT', 'v0', 'Bolt', 'Cursor', 'Lovable', 'Windsurf']
const TECHS = ['Next.js', 'React', 'Vue', 'Svelte', 'Node.js', 'Python', 'Django', 'Laravel', 'Flutter', 'React Native', 'Tailwind CSS']
const LICENSES = ['Personal', 'Commercial', 'Extended Commercial']
const MOD = ['Pure AI', 'Lightly Edited', 'Heavily Modified', 'AI-Assisted']
const ADJ = ['Nexus', 'Orbit', 'Quantum', 'Aurora', 'Pulse', 'Vertex', 'Lumen', 'Cobalt', 'Zenith', 'Nova', 'Echo', 'Flux', 'Prism', 'Atlas', 'Halo', 'Onyx']
const NOUN = ['Starter', 'Kit', 'Studio', 'Stack', 'Board', 'Suite', 'Flow', 'Grid', 'Forge', 'Base', 'Deck', 'Hub', 'Lab', 'Works', 'Engine']
const NAMES = ['Alex Rivera', 'Mira Chen', 'Dev Patel', 'Sofia Marín', 'Jordan Blake', 'Priya Nair', 'Marco Rossi', 'Hannah Wu', 'Tom Fisher', 'Aisha Khan', 'Leo Novak', 'Yuki Tanaka', 'Elena Petrova', 'Sam Okafor', 'Nina Larsson', 'Omar Haddad', 'Grace Lee', 'Diego Torres', 'Freya Berg', 'Ravi Menon', 'Clara Dupont', 'Ken Adams', 'Lucia Ferro', 'Noah Brooks', 'Amara Diallo', 'Ivan Kovac', 'Maya Suzuki', 'Ethan Cole', 'Zara Ahmed', 'Felix Braun']
const REVIEW_BODIES = [
  'The code quality is genuinely excellent — well structured and easy to extend.',
  'I shipped my MVP in a weekend thanks to this. Everything just worked.',
  'Beautiful UI and thoughtful architecture. Clearly built by someone who ships.',
  'Saved my team a huge amount of setup time. Painless delivery.',
  'Honestly better than some paid frameworks. Clean commits, zero bloat.',
  'Great value. Modern design and reusable components.',
]

async function main() {
  const pool = new Pool({ connectionString })
  const db = await pool.connect()
  try {
    const { rows: existing } = await db.query(`SELECT COUNT(*)::int AS n FROM products`)
    if (existing[0].n > 0 && !process.env.FORCE) {
      console.log(`Products already present (${existing[0].n}). Use FORCE=1 to reseed. Skipping.`)
      return
    }

    await db.query('BEGIN')

    if (process.env.FORCE) {
      console.log('FORCE set — removing existing demo data…')
      await db.query(`DELETE FROM orders`)
      await db.query(`DELETE FROM reviews`)
      await db.query(`DELETE FROM wishlists`)
      await db.query(`DELETE FROM products`)
      await db.query(`DELETE FROM users WHERE email LIKE '%@demo.aiappsbase.dev'`)
    }

    const passwordHash = await bcrypt.hash('demo-password-123', 10)

    // Sellers
    const sellerIds = []
    for (let i = 0; i < NAMES.length; i++) {
      const name = NAMES[i]
      const email = `${name.toLowerCase().replace(/[^a-z]/g, '.')}.${i}@demo.aiappsbase.dev`
      const { rows } = await db.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_verified, github_username)
         VALUES ($1,$2,$3,'seller',true,$4) RETURNING id`,
        [name, email, passwordHash, name.toLowerCase().replace(/[^a-z]/g, '')]
      )
      sellerIds.push(rows[0].id)
    }

    // A demo buyer
    const { rows: buyerRows } = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_verified)
       VALUES ('Demo Buyer','buyer@demo.aiappsbase.dev',$1,'buyer',true) RETURNING id`,
      [passwordHash]
    )
    const buyerId = buyerRows[0].id

    // Products
    const productIds = []
    const usedSlugs = new Set()
    for (let i = 0; i < 54; i++) {
      let a, n, slug
      do { a = pick(ADJ); n = pick(NOUN); slug = `${a.toLowerCase()}-${n.toLowerCase()}` } while (usedSlugs.has(slug))
      usedSlugs.add(slug)
      const sellerId = pick(sellerIds)
      const isFree = rand() > 0.82
      const price = isFree ? 0 : pick([19, 29, 39, 49, 59, 79, 89, 99, 129])
      const { rows } = await db.query(
        `INSERT INTO products
          (seller_id, title, description, price, category, ai_tools, tech_stack, human_mod_level,
           screenshots, preview_url, license_type, status, tags, featured, github_repo_name, github_default_branch)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'approved',$12,$13,$14,'main') RETURNING id`,
        [
          sellerId,
          `${a} ${n}`,
          `A production-ready ${pick(CATEGORIES).toLowerCase()} built with a modern stack and refined with ${pick(AI_TOOLS)}. Clean architecture, docs, and everything you need to ship.`,
          price,
          pick(CATEGORIES),
          pickN(AI_TOOLS, int(1, 3)),
          pickN(TECHS, int(3, 5)),
          pick(MOD),
          [],
          'https://demo.aiappsbase.dev',
          isFree ? 'Personal' : pick(LICENSES),
          pickN(['open-source', 'starter', 'premium', 'modern', 'minimal', 'enterprise', 'fullstack'], int(2, 4)),
          rand() > 0.72,
          `${slug}`,
        ]
      )
      productIds.push(rows[0].id)
    }

    // Reviews (buyer reviews a subset)
    let reviewCount = 0
    for (const pid of pickN(productIds, Math.min(productIds.length, 40))) {
      const r = int(4, 5)
      await db.query(
        `INSERT INTO reviews (product_id, user_id, rating, code_quality, design, documentation, value_for_money, comment, verified, helpful)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9)
         ON CONFLICT (product_id, user_id) DO NOTHING`,
        [pid, buyerId, r, int(4, 5), int(4, 5), int(3, 5), int(4, 5), pick(REVIEW_BODIES), int(0, 60)]
      )
      reviewCount++
    }

    // Orders + wishlist for the demo buyer
    for (const pid of pickN(productIds, 6)) {
      const { rows } = await db.query(`SELECT price, license_type FROM products WHERE id = $1`, [pid])
      await db.query(
        `INSERT INTO orders (product_id, buyer_id, amount, license_type, status)
         VALUES ($1,$2,$3,$4,'completed')`,
        [pid, buyerId, rows[0].price, rows[0].license_type]
      )
    }
    for (const pid of pickN(productIds, 8)) {
      await db.query(`INSERT INTO wishlists (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [buyerId, pid])
    }

    await db.query('COMMIT')
    console.log(`✓ Seeded ${sellerIds.length} sellers, ${productIds.length} products, ${reviewCount} reviews, orders & wishlist.`)
    console.log('  Demo buyer login: buyer@demo.aiappsbase.dev / demo-password-123')
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    db.release()
    await pool.end()
  }
}

main().catch((e) => { console.error('Seed failed:', e); process.exit(1) })
