#!/usr/bin/env node
// One-off seeder: inserts 10 real, free/open-source GitHub repos as approved
// marketplace products, attached to the demo seller account (seller@gmail.com).
// Safe to re-run — skips repos that are already in the DB (by github_repo_name).

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const { Pool } = require('pg')

const SELLER_EMAIL = 'ssam70207@gmail.com'

const REPOS = [
  {
    title: 'React',
    description: 'A declarative, component-based JavaScript library for building user interfaces, maintained by Meta and the open-source community.',
    features: ['Component-based architecture', 'Virtual DOM diffing', 'Hooks API', 'Huge ecosystem'],
    category: 'Components',
    aiTools: ['Other'],
    techStack: ['React', 'JavaScript'],
    licenseType: 'MIT',
    tags: ['react', 'ui', 'frontend', 'library'],
    githubRepoName: 'facebook/react',
    githubDefaultBranch: 'main',
    language: 'JavaScript',
    stars: 230000, forks: 47500, watchers: 6800, commits: 18500, contributors: 1650,
    version: '19.0.0',
    previewUrl: 'https://react.dev',
    featured: true,
  },
  {
    title: 'Next.js',
    description: 'The React framework for production — hybrid static & server rendering, file-system routing, and full-stack app development.',
    features: ['App Router', 'Server components', 'API routes', 'Image & font optimization'],
    category: 'Templates',
    aiTools: ['Other'],
    techStack: ['Next.js', 'React'],
    licenseType: 'MIT',
    tags: ['nextjs', 'react', 'framework', 'ssr'],
    githubRepoName: 'vercel/next.js',
    githubDefaultBranch: 'canary',
    language: 'TypeScript',
    stars: 130000, forks: 27700, watchers: 1400, commits: 45000, contributors: 3300,
    version: '15.1.0',
    previewUrl: 'https://nextjs.org',
    featured: true,
  },
  {
    title: 'Tailwind CSS',
    description: 'A utility-first CSS framework for rapidly building custom user interfaces without leaving your HTML.',
    features: ['Utility-first classes', 'JIT compiler', 'Dark mode support', 'Fully customizable'],
    category: 'Components',
    aiTools: ['Other'],
    techStack: ['Tailwind'],
    licenseType: 'MIT',
    tags: ['css', 'tailwind', 'styling', 'design-system'],
    githubRepoName: 'tailwindlabs/tailwindcss',
    githubDefaultBranch: 'main',
    language: 'JavaScript',
    stars: 86000, forks: 4400, watchers: 780, commits: 12000, contributors: 640,
    version: '3.4.14',
    previewUrl: 'https://tailwindcss.com',
    featured: false,
  },
  {
    title: 'Vue.js',
    description: 'An approachable, performant, and versatile JavaScript framework for building web user interfaces.',
    features: ['Reactive data binding', 'Single-file components', 'Composition API', 'Small footprint'],
    category: 'Templates',
    aiTools: ['Other'],
    techStack: ['Vue'],
    licenseType: 'MIT',
    tags: ['vue', 'frontend', 'framework', 'spa'],
    githubRepoName: 'vuejs/vue',
    githubDefaultBranch: 'main',
    language: 'JavaScript',
    stars: 208000, forks: 33800, watchers: 6100, commits: 3900, contributors: 490,
    version: '2.7.16',
    previewUrl: 'https://vuejs.org',
    featured: false,
  },
  {
    title: 'Express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js — the backbone of countless production APIs.',
    features: ['Middleware pipeline', 'Routing', 'Template engine support', 'Minimal core'],
    category: 'Scripts & Tools',
    aiTools: ['Other'],
    techStack: ['Node.js'],
    licenseType: 'MIT',
    tags: ['nodejs', 'backend', 'api', 'server'],
    githubRepoName: 'expressjs/express',
    githubDefaultBranch: 'master',
    language: 'JavaScript',
    stars: 66000, forks: 11000, watchers: 1600, commits: 6000, contributors: 300,
    version: '4.21.1',
    previewUrl: 'https://expressjs.com',
    featured: false,
  },
  {
    title: 'Django',
    description: 'A high-level Python web framework that encourages rapid development and clean, pragmatic design.',
    features: ['Batteries-included ORM', 'Admin panel', 'Auth system', 'Security by default'],
    category: 'SaaS Boilerplates',
    aiTools: ['Other'],
    techStack: ['Python', 'Django'],
    licenseType: 'MIT',
    tags: ['python', 'django', 'backend', 'web-framework'],
    githubRepoName: 'django/django',
    githubDefaultBranch: 'main',
    language: 'Python',
    stars: 83000, forks: 32000, watchers: 2200, commits: 32000, contributors: 2900,
    version: '5.1.3',
    previewUrl: 'https://www.djangoproject.com',
    featured: false,
  },
  {
    title: 'PyTorch',
    description: 'An open-source machine learning framework that accelerates the path from research prototyping to production deployment.',
    features: ['Dynamic computation graphs', 'GPU acceleration', 'TorchScript', 'Rich ecosystem (torchvision, etc.)'],
    category: 'AI Projects',
    aiTools: ['Other'],
    techStack: ['Python'],
    licenseType: 'MIT',
    tags: ['ai', 'machine-learning', 'deep-learning', 'python'],
    githubRepoName: 'pytorch/pytorch',
    githubDefaultBranch: 'main',
    language: 'Python',
    stars: 90000, forks: 24500, watchers: 1700, commits: 62000, contributors: 3800,
    version: '2.5.1',
    previewUrl: 'https://pytorch.org',
    featured: true,
  },
  {
    title: 'TensorFlow',
    description: 'An end-to-end open-source platform for machine learning, from research experimentation to large-scale production deployment.',
    features: ['Keras high-level API', 'Distributed training', 'TensorBoard visualization', 'Cross-platform deployment'],
    category: 'AI Projects',
    aiTools: ['Other'],
    techStack: ['Python'],
    licenseType: 'MIT',
    tags: ['ai', 'tensorflow', 'machine-learning', 'python'],
    githubRepoName: 'tensorflow/tensorflow',
    githubDefaultBranch: 'master',
    language: 'Python',
    stars: 188000, forks: 74500, watchers: 7700, commits: 145000, contributors: 4400,
    version: '2.18.0',
    previewUrl: 'https://www.tensorflow.org',
    featured: false,
  },
  {
    title: 'Visual Studio Code',
    description: 'A free, lightweight, extensible source-code editor with built-in debugging, Git integration, and a massive extension marketplace.',
    features: ['IntelliSense', 'Integrated terminal', 'Extension marketplace', 'Remote development'],
    category: 'Scripts & Tools',
    aiTools: ['Copilot'],
    techStack: ['TypeScript', 'Node.js'],
    licenseType: 'MIT',
    tags: ['editor', 'ide', 'developer-tools'],
    githubRepoName: 'microsoft/vscode',
    githubDefaultBranch: 'main',
    language: 'TypeScript',
    stars: 171000, forks: 30500, watchers: 3300, commits: 175000, contributors: 1900,
    version: '1.95.0',
    previewUrl: 'https://code.visualstudio.com',
    featured: true,
  },
  {
    title: 'NestJS',
    description: 'A progressive Node.js framework for building efficient, reliable, and scalable server-side applications with TypeScript.',
    features: ['Dependency injection', 'Modular architecture', 'Built-in testing utilities', 'GraphQL & microservices support'],
    category: 'SaaS Boilerplates',
    aiTools: ['Other'],
    techStack: ['Node.js', 'TypeScript'],
    licenseType: 'MIT',
    tags: ['nestjs', 'nodejs', 'backend', 'typescript'],
    githubRepoName: 'nestjs/nest',
    githubDefaultBranch: 'master',
    language: 'TypeScript',
    stars: 70000, forks: 7700, watchers: 1200, commits: 8100, contributors: 320,
    version: '10.4.6',
    previewUrl: 'https://nestjs.com',
    featured: false,
  },
]

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set (check .env.local).')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    const sellerRes = await client.query('SELECT id FROM users WHERE email = $1', [SELLER_EMAIL])
    if (sellerRes.rowCount === 0) {
      throw new Error(`Seller account ${SELLER_EMAIL} not found — cannot attach seeded products.`)
    }
    const sellerId = sellerRes.rows[0].id

    let inserted = 0
    let skipped = 0

    for (const repo of REPOS) {
      const existing = await client.query(
        'SELECT 1 FROM products WHERE github_repo_name = $1',
        [repo.githubRepoName]
      )
      if (existing.rowCount > 0) {
        console.log(`Skipping ${repo.githubRepoName} (already exists)`)
        skipped++
        continue
      }

      await client.query(
        `INSERT INTO products (
          seller_id, title, description, price, category,
          ai_tools, tech_stack, human_mod_level, screenshots,
          preview_url, license_type, status, tags,
          github_repo_name, github_default_branch,
          language, stars, forks, watchers, commits, contributors,
          version, features, featured
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, 'approved', $12,
          $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23
        )`,
        [
          sellerId,
          repo.title,
          repo.description,
          0.00,
          repo.category,
          repo.aiTools,
          repo.techStack,
          'Heavily Modified',
          [],
          repo.previewUrl,
          repo.licenseType,
          repo.tags,
          repo.githubRepoName,
          repo.githubDefaultBranch,
          repo.language,
          repo.stars,
          repo.forks,
          repo.watchers,
          repo.commits,
          repo.contributors,
          repo.version,
          repo.features,
          repo.featured,
        ]
      )
      console.log(`Inserted ${repo.githubRepoName}`)
      inserted++
    }

    console.log(`Done. Inserted ${inserted}, skipped ${skipped}.`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
