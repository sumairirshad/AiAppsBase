import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { uploadDeliverable } from '@/lib/sftp'
import fs from 'fs'
import path from 'path'

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
  } else if (role === 'seller' && ['rejected', 'suspended', 'banned'].includes(sellerStatus)) {
    return NextResponse.json(
      { error: `Your seller account is ${sellerStatus} and cannot list new products. Contact support.` },
      { status: 403 }
    )
  } else if (role !== 'seller' && role !== 'admin') {
    return NextResponse.json({ error: 'Only sellers and admins can add products' }, { status: 403 })
  }

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

    const screenshots: string[] = []
    const files = formData.getAll('screenshotFiles') as File[]

    const uploadDir = path.join(process.cwd(), 'public', 'Uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    for (const file of files) {
      if (file.size === 0) continue

      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`
      const filePath = path.join(uploadDir, fileName)

      fs.writeFileSync(filePath, buffer)
      screenshots.push(`/Uploads/${fileName}`)
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

      const lowerName = deliverableFile.name.toLowerCase()
      if (!lowerName.endsWith('.zip') && !lowerName.endsWith('.rar')) {
        return NextResponse.json(
          { error: 'The deliverable file must be a .zip or .rar archive' },
          { status: 400 }
        )
      }

      const productId = randomUUID()
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

      const res = await query(
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
      )

      return NextResponse.json({ ok: true, id: res.rows[0].id })
    }

    const res = await query(
      `INSERT INTO products (
        seller_id, title, description, price, category,
        ai_tools, tech_stack, human_mod_level, screenshots,
        preview_url, license_type, tags, github_repo_name, github_default_branch
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
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
      ]
    )

    return NextResponse.json({ ok: true, id: res.rows[0].id })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
