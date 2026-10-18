import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, cleanupTestUsers } from '@/test/db-test-helpers'

/** DB-level constraints added by migration 030 — regression coverage so they can never be silently dropped later. */
describe.skipIf(!isDatabaseConfigured())('schema constraints (integration)', () => {
  const createdUserIds: string[] = []
  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('rejects a negative product price at the database level', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)

    await expect(
      query(
        `INSERT INTO products (seller_id, title, description, price, category, human_mod_level, license_type)
         VALUES ($1, 'Bad price', 'desc', -5, 'web-app', 'none', 'commercial')`,
        [seller.id]
      )
    ).rejects.toThrow(/products_price_non_negative/)
  })

  it('accepts a zero (free) price', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)

    await expect(
      query(
        `INSERT INTO products (seller_id, title, description, price, category, human_mod_level, license_type)
         VALUES ($1, 'Free product', 'desc', 0, 'web-app', 'none', 'commercial')`,
        [seller.id]
      )
    ).resolves.toBeDefined()
  })

  it('rejects a product with both an uploaded deliverable and a GitHub repo set', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)

    await expect(
      query(
        `INSERT INTO products (seller_id, title, description, price, category, human_mod_level, license_type,
                                deliverable_remote_path, github_repo_name)
         VALUES ($1, 'Ambiguous source', 'desc', 10, 'web-app', 'none', 'commercial', '/remote/x.zip', 'seller/repo')`,
        [seller.id]
      )
    ).rejects.toThrow(/products_delivery_source_exclusive/)
  })

  it('allows a product with neither delivery source set yet (e.g. a draft)', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)

    await expect(
      query(
        `INSERT INTO products (seller_id, title, description, price, category, human_mod_level, license_type)
         VALUES ($1, 'Draft', 'desc', 10, 'web-app', 'none', 'commercial')`,
        [seller.id]
      )
    ).resolves.toBeDefined()
  })

  it('rejects a product_versions row marked published without a stored deliverable', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productRes = await query<{ id: string }>(
      `INSERT INTO products (seller_id, title, description, price, category, human_mod_level, license_type)
       VALUES ($1, 'P', 'desc', 10, 'web-app', 'none', 'commercial') RETURNING id`,
      [seller.id]
    )

    await expect(
      query(
        `INSERT INTO product_versions (product_id, seller_id, version, delivery_type, status)
         VALUES ($1, $2, '1.0.0', 'upload', 'published')`,
        [productRes.rows[0].id, seller.id]
      )
    ).rejects.toThrow(/product_versions_published_has_deliverable/)
  })

  it('rejects two active (publishing/published) product_versions rows with the same product+version', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productRes = await query<{ id: string }>(
      `INSERT INTO products (seller_id, title, description, price, category, human_mod_level, license_type)
       VALUES ($1, 'P', 'desc', 10, 'web-app', 'none', 'commercial') RETURNING id`,
      [seller.id]
    )
    const productId = productRes.rows[0].id

    await query(
      `INSERT INTO product_versions (product_id, seller_id, version, delivery_type, status)
       VALUES ($1, $2, '1.0.0', 'upload', 'publishing')`,
      [productId, seller.id]
    )

    await expect(
      query(
        `INSERT INTO product_versions (product_id, seller_id, version, delivery_type, status)
         VALUES ($1, $2, '1.0.0', 'upload', 'publishing')`,
        [productId, seller.id]
      )
    ).rejects.toThrow(/idx_product_versions_unique_active/)
  })
})
