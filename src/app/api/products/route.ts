import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
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
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
  }

  // Get user role and ensure they can add products
  const userRes = await query('SELECT role FROM users WHERE id = $1', [userId])
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Unauthorized. User not found.' }, { status: 404 })
  }

  const userRole = userRes.rows[0].role
  if (userRole !== 'seller') {
    // Proactively upgrade buyer to seller so they aren't blocked
    await query("UPDATE users SET role = 'seller' WHERE id = $1", [userId])
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

    if (!title || !description || !category || !humanModLevel || !licenseType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Handle Image Uploads
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

    const res = await query(
      `INSERT INTO products (
        seller_id, title, description, price, category, 
        ai_tools, tech_stack, human_mod_level, screenshots, 
        preview_url, license_type, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
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
      ]
    )

    return NextResponse.json({ ok: true, id: res.rows[0].id })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json({ error: 'Failed to create product. Check if fields are correct.' }, { status: 500 })
  }
}
