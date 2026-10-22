import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { uploadDeliverable } from '@/lib/sftp'
import { isAllowedDeliverableUpload } from '@/lib/upload-safety'
import {
  ImageUploadError, MAX_PRODUCT_IMAGES, deleteProductImageDir, readValidatedImage, writeProductImages,
} from '@/lib/product-images'
import { syncProductGithubStats } from '@/lib/github-stats'
import { verifyGithubRepoAccess } from '@/lib/github-snapshot'
import { decryptToken } from '@/lib/token-crypto'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await query(
      'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return NextResponse.json({ products: res.rows })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
  }

  const userRes = await query('SELECT role, seller_status, account_status FROM users WHERE id = $1', [userId])
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { role, seller_status: sellerStatus, account_status: accountStatus } = userRes.rows[0]
  if (accountStatus !== 'active') {
    return NextResponse.json({ error: 'Your account cannot list products right now. Contact support.' }, { status: 403 })
  }

  if (role === 'buyer') {
    await query("UPDATE users SET role = 'seller', seller_status = 'pending' WHERE id = $1", [userId])
    return NextResponse.json(
      { error: 'Your seller application has been submitted and is pending review. You can list products once approved.' },
      { status: 403 }
    )
  } else if (role === 'seller' && sellerStatus === 'pending') {
    // Without this, a pending seller could list products immediately —
    // the seller approval gate existed in name only.
    return NextResponse.json(
      { error: 'Your seller account is still pending review and cannot list products yet.' },
      { status: 403 }
    )
  } else if (role === 'seller' && ['rejected', 'suspended', 'banned'].includes(sellerStatus)) {
    return NextResponse.json(
      { error: `Your seller account is ${sellerStatus} and cannot list new products. Contact support.` },
      { status: 403 }
    )
  } else if (role !== 'seller' && role !== 'admin') {
    return NextResponse.json({ error: 'Only sellers and admins can add products' }, { status: 403 })
  }

  // Declared ahead of the try block so the outer catch (which logs the
  // real failure) can still report which product/request it happened for.
  const productId = randomUUID()
  const uploadCorrelationId = randomUUID()

  try {
    const formData = await req.formData()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string) || 0
    const category = formData.get('category') as string
    const aiTools = JSON.parse(formData.get('aiTools') as string || '[]')
    const techStack = JSON.parse(formData.get('techStack') as string || '[]')
    const humanModLevel = formData.get('humanModLevel') as string
    const previewUrl = formData.get('previewUrl') as string
    const licenseType = formData.get('licenseType') as string
    const tags = JSON.parse(formData.get('tags') as string || '[]')
    const githubRepoName = (formData.get('githubRepoName') as string) || null
    const githubDefaultBranch = (formData.get('githubDefaultBranch') as string) || null

    if (!title || !description || !category || !humanModLevel || !licenseType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fail fast for a GitHub-sourced listing if the seller's connection
    // can't actually reach the chosen repo/branch — this also detects the
    // repo's real current visibility (public vs private) rather than
    // trusting whatever the repo-picker last showed. The full archive isn't
    // fetched/stored yet here (that only happens once the listing is
    // actually approved and purchasable, in the admin approval route) —
    // this is just enough to give the seller immediate feedback instead of
    // discovering a misconfigured repo only after admin review.
    let githubRepoPrivate: boolean | null = null
    if (githubRepoName && githubDefaultBranch) {
      const userTokenRes = await query<{ github_access_token: string | null }>(
        'SELECT github_access_token FROM users WHERE id = $1',
        [userId]
      )
      const accessToken = decryptToken(userTokenRes.rows[0]?.github_access_token ?? null)
      const verification = await verifyGithubRepoAccess(accessToken, githubRepoName, githubDefaultBranch)
      if (!verification.ok) {
        return NextResponse.json({ error: verification.reason }, { status: 400 })
      }
      githubRepoPrivate = verification.private
    }

    // Validate every image (type, size, real content) before storing anything.
    const imageFiles = formData.getAll('screenshotFiles').filter((f): f is File => typeof f !== 'string' && f.size > 0)
    if (imageFiles.length > MAX_PRODUCT_IMAGES) {
      return NextResponse.json({ error: `You can upload at most ${MAX_PRODUCT_IMAGES} images` }, { status: 400 })
    }
    const validatedImages: { buf: Buffer; name: string }[] = []
    for (const file of imageFiles) {
      try {
        validatedImages.push({ buf: await readValidatedImage(file), name: file.name })
      } catch (err) {
        if (err instanceof ImageUploadError) return NextResponse.json({ error: err.message }, { status: 400 })
        throw err
      }
    }

    // Writes the images and inserts the product; if the insert fails, the
    // product's image folder is removed so nothing is left behind.
    //
    // All of a product's images go up over one shared SFTP connection (see
    // writeProductImages / uploadProductImages) rather than one connection
    // per image — reconnecting repeatedly for one request was what
    // triggered real connection drops against at least one SFTP server
    // we've seen this run against.
    const storeImagesAndInsert = async (insert: (screenshots: string[]) => Promise<string>) => {
      try {
        const screenshots = await writeProductImages(validatedImages, userId, productId, uploadCorrelationId)
        return await insert(screenshots)
      } catch (err) {
        console.error('[products/create] image upload or insert failed, removing partial image folder:', {
          correlationId: uploadCorrelationId,
          userId,
          productId,
          imagesRequested: validatedImages.length,
        }, err)
        await deleteProductImageDir(userId, productId)
        throw err
      }
    }

    // Manual-mode products (no GitHub repo) must ship an actual deliverable
    // file — otherwise a buyer who purchases it would have nothing to download.
    let deliverableRemotePath: string | null = null
    let deliverableOriginalName: string | null = null
    let deliverableSizeBytes: number | null = null

    if (!githubRepoName) {
      const deliverableFile = formData.get('deliverableFile') as File | null

      if (!deliverableFile || deliverableFile.size === 0) {
        return NextResponse.json(
          { error: 'Please upload a .zip or .rar deliverable file' },
          { status: 400 }
        )
      }

      if (!isAllowedDeliverableUpload(deliverableFile.name)) {
        return NextResponse.json(
          { error: 'The deliverable file must be a .zip or .rar archive' },
          { status: 400 }
        )
      }

      // A listing with no screenshot falls back to the site logo on every
      // card and product page — require at least one so new listings never
      // ship looking broken.
      if (validatedImages.length === 0) {
        return NextResponse.json(
          { error: 'Please upload at least one screenshot' },
          { status: 400 }
        )
      }

      const buffer = Buffer.from(await deliverableFile.arrayBuffer())

      try {
        const { remotePath } = await uploadDeliverable(buffer, productId, deliverableFile.name)
        deliverableRemotePath = remotePath
        deliverableOriginalName = deliverableFile.name
        deliverableSizeBytes = deliverableFile.size
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[products/create] SFTP upload failed:', message, err)
        return NextResponse.json(
          { error: `Could not reach file storage server: ${message}` },
          { status: 502 }
        )
      }

      const id = await storeImagesAndInsert(async (screenshots) => (await query(
        `INSERT INTO products (
          id, seller_id, title, description, price, category,
          ai_tools, tech_stack, human_mod_level, screenshots,
          preview_url, license_type, tags, github_repo_name, github_default_branch,
          deliverable_remote_path, deliverable_original_name, deliverable_size_bytes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
        [
          productId,
          userId,
          title,
          description,
          price,
          category,
          aiTools,
          techStack,
          humanModLevel,
          screenshots,
          previewUrl || null,
          licenseType,
          tags,
          githubRepoName,
          githubDefaultBranch,
          deliverableRemotePath,
          deliverableOriginalName,
          deliverableSizeBytes,
        ]
      )).rows[0].id)

      return NextResponse.json({ ok: true, id })
    }

    const id = await storeImagesAndInsert(async (screenshots) => (await query(
      `INSERT INTO products (
        id, seller_id, title, description, price, category,
        ai_tools, tech_stack, human_mod_level, screenshots,
        preview_url, license_type, tags, github_repo_name, github_default_branch,
        github_repo_private, github_snapshot_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
      [
        productId,
        userId,
        title,
        description,
        price,
        category,
        aiTools,
        techStack,
        humanModLevel,
        // GitHub-sourced listings have no screenshot step; GitHub generates a
        // social-preview image for every public repo at this stable URL, so
        // use it instead of falling back to the site logo on every card.
        screenshots.length > 0 ? screenshots : [`https://opengraph.githubassets.com/1/${githubRepoName}`],
        previewUrl || null,
        licenseType,
        tags,
        githubRepoName,
        githubDefaultBranch,
        githubRepoPrivate,
        // Nothing has been snapshotted yet — the archive is fetched and
        // stored once the listing is approved, not at creation time.
        'pending',
      ]
    )).rows[0].id)

    // Best-effort: seed real stats immediately instead of leaving them at
    // their zero defaults until the seller manually refreshes.
    await syncProductGithubStats(id, userId, githubRepoName, githubDefaultBranch)

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[products/create] failed:', {
      correlationId: uploadCorrelationId,
      userId,
      productId,
      errorName: error.name,
      errorMessage: error.message,
    }, error)
    // The real cause is always logged above; only its message (never a
    // stack trace, never SFTP/DB credentials) is ever handed to the client,
    // and only outside production, so a local dev session can see why a
    // product failed to create instead of just "Failed to create product".
    const detail = process.env.NODE_ENV !== 'production' ? error.message : undefined
    return NextResponse.json({ error: 'Failed to create product', ...(detail ? { detail } : {}) }, { status: 500 })
  }
}
