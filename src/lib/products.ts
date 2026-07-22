import { query } from '@/lib/db'
import {
  gradientFor, slugifyCategory, slugifySubcategory, languageColor,
  type Repo, type Review, type Seller,
} from '@/lib/marketplace-config'

const DAY = 24 * 60 * 60 * 1000

/* Map a joined product row (+ aggregates) to the Repo view model. */
function mapRow(row: any): Repo {
  const created = row.created_at ? new Date(row.created_at) : new Date()
  const price = Number(row.price) || 0
  const repoName: string | null = row.github_repo_name || null
  const owner = row.seller_handle || (row.seller_name ? String(row.seller_name).split(' ')[0].toLowerCase() : 'seller')
  const sales = Number(row.sales) || 0

  return {
    id: row.id,
    name: repoName ? repoName.split('/').pop()! : slugifyCategory(row.title || 'project'),
    owner,
    title: row.title,
    description: row.description || '',
    longDescription: row.description || '',
    price,
    category: row.category || 'Other',
    categorySlug: slugifyCategory(row.category || 'other'),
    subcategory: row.subcategory || '',
    subcategorySlug: row.subcategory ? slugifySubcategory(row.subcategory) : '',
    language: row.language || 'Code',
    languageColor: row.language_color || languageColor(row.language),
    techStack: row.tech_stack || [],
    aiTool: (row.ai_tools && row.ai_tools[0]) || 'AI',
    tags: row.tags || [],
    license: row.license_type || 'Personal',
    stars: Number(row.stars) || 0,
    forks: Number(row.forks) || 0,
    issues: Number(row.issues) || 0,
    watchers: Number(row.watchers) || 0,
    commits: Number(row.commits) || 0,
    contributors: Number(row.contributors) || 0,
    rating: row.rating != null ? Math.round(Number(row.rating) * 10) / 10 : 0,
    reviewCount: Number(row.review_count) || 0,
    sales,
    featured: Boolean(row.featured),
    trending: sales >= 25,
    verified: Boolean(row.seller_verified),
    isNew: Date.now() - created.getTime() < 14 * DAY,
    createdAt: created.toISOString().slice(0, 10),
    updatedAt: (row.updated_at ? new Date(row.updated_at) : created).toISOString().slice(0, 10),
    version: row.version || '1.0.0',
    gradient: gradientFor(row.id),
    demoUrl: row.preview_url || '',
    repoUrl: repoName ? `https://github.com/${repoName}` : '',
    sellerId: row.seller_id,
    features: row.features || [],
    changelog: [],
    reviews: [],
  }
}

const LIST_SELECT = `
  SELECT p.*, u.full_name AS seller_name, u.github_username AS seller_handle,
         u.is_verified AS seller_verified,
         agg.avg_rating AS rating, agg.review_count,
         ord.sales
  FROM products p
  JOIN users u ON p.seller_id = u.id
  LEFT JOIN (
    SELECT product_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS review_count
    FROM reviews GROUP BY product_id
  ) agg ON agg.product_id = p.id
  LEFT JOIN (
    SELECT product_id, COUNT(*)::int AS sales
    FROM orders WHERE status = 'completed' GROUP BY product_id
  ) ord ON ord.product_id = p.id
`

/** All approved listings for the marketplace. Returns [] if the DB is empty/unreachable. */
export async function listApprovedProducts(): Promise<Repo[]> {
  try {
    const res = await query(`${LIST_SELECT} WHERE p.status = 'approved' ORDER BY p.created_at DESC`)
    return res.rows.map(mapRow)
  } catch (err) {
    console.error('listApprovedProducts failed:', (err as Error).message)
    return []
  }
}

/** A single product with its seller and reviews, or null. */
export async function getProductById(id: string): Promise<{ repo: Repo; seller: Seller | null } | null> {
  try {
    const res = await query(`${LIST_SELECT} WHERE p.id = $1`, [id])
    if (res.rowCount === 0) return null
    const row = res.rows[0]
    const repo = mapRow(row)

    const reviewsRes = await query(
      `SELECT r.*, u.full_name AS author FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
      [id]
    )
    repo.reviews = reviewsRes.rows.map((r: any): Review => ({
      id: r.id,
      author: r.author || 'Buyer',
      avatar: '',
      rating: Number(r.rating) || 0,
      title: '',
      body: r.comment || '',
      date: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      helpful: Number(r.helpful) || 0,
      verified: Boolean(r.verified),
    }))

    const seller = await getSellerById(row.seller_id)
    return { repo, seller }
  } catch (err) {
    console.error('getProductById failed:', (err as Error).message)
    return null
  }
}

export async function getRelatedProducts(product: Repo, n = 3): Promise<Repo[]> {
  try {
    const res = await query(
      `${LIST_SELECT} WHERE p.status = 'approved' AND p.id <> $1
       ORDER BY (p.category = $2) DESC, p.created_at DESC LIMIT $3`,
      [product.id, product.category, n]
    )
    return res.rows.map(mapRow)
  } catch (err) {
    console.error('getRelatedProducts failed:', (err as Error).message)
    return []
  }
}

/** Featured/most-recent approved products for the landing page. */
export async function getFeaturedProducts(limit = 6): Promise<Repo[]> {
  try {
    const res = await query(
      `${LIST_SELECT} WHERE p.status = 'approved'
       ORDER BY p.featured DESC, ord.sales DESC NULLS LAST, p.created_at DESC LIMIT $1`,
      [limit]
    )
    return res.rows.map(mapRow)
  } catch (err) {
    console.error('getFeaturedProducts failed:', (err as Error).message)
    return []
  }
}

/** Top sellers by completed sales, for the landing page. */
export async function getTopSellers(limit = 4): Promise<Seller[]> {
  try {
    const res = await query(
      `SELECT u.id, u.full_name, u.github_username, u.is_verified, u.created_at,
              COUNT(DISTINCT p.id)::int AS product_count,
              COALESCE(SUM(CASE WHEN o.status='completed' THEN 1 ELSE 0 END),0)::int AS sales,
              COALESCE(AVG(r.rating),0)::float AS rating
       FROM users u
       JOIN products p ON p.seller_id = u.id AND p.status = 'approved'
       LEFT JOIN orders o ON o.product_id = p.id
       LEFT JOIN reviews r ON r.product_id = p.id
       WHERE u.role = 'seller'
       GROUP BY u.id ORDER BY sales DESC, product_count DESC LIMIT $1`,
      [limit]
    )
    return res.rows.map((u: any): Seller => ({
      id: u.id, name: u.full_name,
      handle: u.github_username || String(u.full_name).split(' ')[0].toLowerCase(),
      avatar: '', bio: '', badge: 'Top Seller', verified: Boolean(u.is_verified),
      rating: u.rating != null ? Math.round(Number(u.rating) * 10) / 10 : 0,
      sales: Number(u.sales) || 0, productCount: Number(u.product_count) || 0, followers: 0,
      joinedAt: u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : '',
      location: '', gradient: gradientFor(u.id),
    }))
  } catch (err) {
    console.error('getTopSellers failed:', (err as Error).message)
    return []
  }
}

export type PlatformStats = { products: number; sellers: number; sales: number; paidOut: number }

/** Real platform-wide counts for the landing stats band. */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const res = await query(
      `SELECT
        (SELECT COUNT(*) FROM products WHERE status='approved')::int AS products,
        (SELECT COUNT(*) FROM users WHERE role='seller')::int AS sellers,
        (SELECT COUNT(*) FROM orders WHERE status='completed')::int AS sales,
        COALESCE((SELECT SUM(amount) FROM orders WHERE status='completed'),0)::float AS paid_out`
    )
    const r = res.rows[0] as any
    return { products: r.products, sellers: r.sellers, sales: r.sales, paidOut: Math.round(r.paid_out) }
  } catch (err) {
    console.error('getPlatformStats failed:', (err as Error).message)
    return { products: 0, sellers: 0, sales: 0, paidOut: 0 }
  }
}

export async function getSellerById(id: string): Promise<Seller | null> {
  try {
    const res = await query(
      `SELECT u.id, u.full_name, u.github_username, u.is_verified, u.created_at,
              (SELECT COUNT(*)::int FROM products WHERE seller_id = u.id AND status = 'approved') AS product_count,
              (SELECT COUNT(*)::int FROM orders o JOIN products p ON o.product_id = p.id
                 WHERE p.seller_id = u.id AND o.status = 'completed') AS sales,
              (SELECT AVG(r.rating)::float FROM reviews r JOIN products p ON r.product_id = p.id
                 WHERE p.seller_id = u.id) AS rating
       FROM users u WHERE u.id = $1`,
      [id]
    )
    if (res.rowCount === 0) return null
    const u = res.rows[0]
    return {
      id: u.id,
      name: u.full_name,
      handle: u.github_username || String(u.full_name).split(' ')[0].toLowerCase(),
      avatar: '',
      bio: '',
      badge: 'Seller',
      verified: Boolean(u.is_verified),
      rating: u.rating != null ? Math.round(Number(u.rating) * 10) / 10 : 0,
      sales: Number(u.sales) || 0,
      productCount: Number(u.product_count) || 0,
      followers: 0,
      joinedAt: u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : '',
      location: '',
      gradient: gradientFor(u.id),
    }
  } catch (err) {
    console.error('getSellerById failed:', (err as Error).message)
    return null
  }
}
