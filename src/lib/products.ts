import { query } from '@/lib/db'
import {
  gradientFor, slugifyCategory, slugifySubcategory, languageColor,
  type Repo, type Review, type Seller,
} from '@/lib/marketplace-config'
import { sellerHandle } from '@/lib/seo'

const DAY = 24 * 60 * 60 * 1000

/* Map a joined product row (+ aggregates) to the Repo view model. */
function mapRow(row: any): Repo {
  const created = row.created_at ? new Date(row.created_at) : new Date()
  const price = Number(row.price) || 0
  const repoName: string | null = row.github_repo_name || null
  const owner = row.seller_handle || (row.seller_name ? String(row.seller_name).split(' ')[0].toLowerCase() : 'seller')
  const sales = Number(row.sales) || 0
  const screenshots: string[] = (row.screenshots || []).filter(Boolean)

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
    image: screenshots[0] || '',
    images: screenshots,
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
  return listPublicSellers(limit)
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

/* Seller profile + storefront aggregates. Counts only approved listings so the
   public numbers match what a visitor can actually browse. */
const SELLER_SELECT = `
  SELECT u.id, u.full_name, u.github_username, u.is_verified, u.created_at,
         u.bio, u.location, u.website_url, u.role, u.account_status, u.seller_status,
         (SELECT COUNT(*)::int FROM products WHERE seller_id = u.id AND status = 'approved') AS product_count,
         (SELECT COUNT(*)::int FROM orders o JOIN products p ON o.product_id = p.id
            WHERE p.seller_id = u.id AND p.status = 'approved' AND o.status = 'completed') AS sales,
         (SELECT AVG(r.rating)::float FROM reviews r JOIN products p ON r.product_id = p.id
            WHERE p.seller_id = u.id AND p.status = 'approved') AS rating,
         (SELECT COUNT(*)::int FROM reviews r JOIN products p ON r.product_id = p.id
            WHERE p.seller_id = u.id AND p.status = 'approved') AS review_count
  FROM users u
`

function sellerBadge(sales: number, rating: number, createdAt: Date | null): string {
  if (sales >= 100) return 'Top Seller'
  if (sales >= 25 && rating >= 4.5) return 'Power Author'
  if (createdAt && Date.now() - createdAt.getTime() < 90 * DAY && sales >= 5) return 'Rising Star'
  return 'Seller'
}

function mapSeller(u: any): Seller {
  const created = u.created_at ? new Date(u.created_at) : null
  const sales = Number(u.sales) || 0
  const rating = u.rating != null ? Math.round(Number(u.rating) * 10) / 10 : 0
  return {
    id: u.id,
    name: u.full_name,
    handle: sellerHandle(u),
    avatar: u.github_username ? `https://github.com/${encodeURIComponent(u.github_username)}.png?size=160` : '',
    bio: u.bio || '',
    badge: sellerBadge(sales, rating, created),
    verified: Boolean(u.is_verified),
    rating,
    sales,
    productCount: Number(u.product_count) || 0,
    followers: 0,
    joinedAt: created ? created.toISOString().slice(0, 10) : '',
    location: u.location || '',
    website: /^https?:\/\//i.test(u.website_url || '') ? u.website_url : '',
    reviewCount: Number(u.review_count) || 0,
    gradient: gradientFor(u.id),
  }
}

/** True when a user's storefront may be shown publicly. */
function isPublicSeller(u: any): boolean {
  return u.role === 'seller' && u.account_status === 'active' && u.seller_status === 'approved'
}

export async function getSellerById(id: string): Promise<Seller | null> {
  try {
    const res = await query(`${SELLER_SELECT} WHERE u.id = $1`, [id])
    if (res.rowCount === 0) return null
    const u = res.rows[0]
    return { ...mapSeller(u), hasStorefront: isPublicSeller(u) }
  } catch (err) {
    console.error('getSellerById failed:', (err as Error).message)
    return null
  }
}

export type StorefrontReview = Review & { productId: string; productTitle: string }

export type Storefront = {
  seller: Seller
  products: Repo[]
  reviews: StorefrontReview[]
  ratingDist: { stars: number; pct: number }[]
  categories: string[]
}

/**
 * Everything the public seller storefront needs. Returns null for unknown ids,
 * non-sellers, and sellers who are pending/suspended/banned, so those 404.
 */
export async function getStorefront(id: string): Promise<Storefront | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  try {
    const sellerRes = await query(`${SELLER_SELECT} WHERE u.id = $1`, [id])
    if (sellerRes.rowCount === 0 || !isPublicSeller(sellerRes.rows[0])) return null
    const seller = mapSeller(sellerRes.rows[0])

    const [productsRes, reviewsRes, distRes] = await Promise.all([
      query(
        `${LIST_SELECT} WHERE p.seller_id = $1 AND p.status = 'approved'
         ORDER BY p.featured DESC, ord.sales DESC NULLS LAST, p.created_at DESC`,
        [id]
      ),
      query(
        `SELECT r.id, r.rating, r.comment, r.verified, r.helpful, r.created_at,
                u.full_name AS author, p.id AS product_id, p.title AS product_title
         FROM reviews r
         JOIN products p ON r.product_id = p.id
         JOIN users u ON r.user_id = u.id
         WHERE p.seller_id = $1 AND p.status = 'approved'
         ORDER BY r.created_at DESC LIMIT 6`,
        [id]
      ),
      query(
        `SELECT r.rating, COUNT(*)::int AS n
         FROM reviews r JOIN products p ON r.product_id = p.id
         WHERE p.seller_id = $1 AND p.status = 'approved'
         GROUP BY r.rating`,
        [id]
      ),
    ])

    const products = productsRes.rows.map(mapRow)
    const reviews = reviewsRes.rows.map((r: any): StorefrontReview => ({
      id: r.id,
      author: r.author || 'Buyer',
      avatar: '',
      rating: Number(r.rating) || 0,
      title: '',
      body: r.comment || '',
      date: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      helpful: Number(r.helpful) || 0,
      verified: Boolean(r.verified),
      productId: r.product_id,
      productTitle: r.product_title,
    }))

    const total = distRes.rows.reduce((acc: number, r: any) => acc + Number(r.n), 0)
    const ratingDist = [5, 4, 3, 2, 1].map((stars) => {
      const n = Number(distRes.rows.find((r: any) => Number(r.rating) === stars)?.n) || 0
      return { stars, pct: total ? Math.round((n / total) * 100) : 0 }
    })

    const categories = Array.from(new Set(products.map((p) => p.category)))
    return { seller, products, reviews, ratingDist, categories }
  } catch (err) {
    console.error('getStorefront failed:', (err as Error).message)
    return null
  }
}

/** Public sellers for the top-sellers directory, ranked by completed sales. */
export async function listPublicSellers(limit = 48): Promise<Seller[]> {
  try {
    const res = await query(
      `SELECT * FROM (${SELLER_SELECT}
         WHERE u.role = 'seller' AND u.account_status = 'active' AND u.seller_status = 'approved') s
       WHERE s.product_count > 0
       ORDER BY s.sales DESC, s.rating DESC NULLS LAST, s.product_count DESC
       LIMIT $1`,
      [limit]
    )
    return res.rows.map(mapSeller)
  } catch (err) {
    console.error('listPublicSellers failed:', (err as Error).message)
    return []
  }
}
