#!/usr/bin/env node
// Full marketplace catalog reset & reseed.
//
// What this does:
//   1. Consolidates seller accounts down to a single canonical seller
//      (keeps `seller@gmail.com` if present, otherwise the oldest seller
//      account; demotes any other seller-role accounts to 'buyer'; creates
//      the canonical seller if none exists yet).
//   2. Wipes every product and everything that references a product
//      (reviews, wishlists, cart items, checkout sessions, orders).
//   3. Reinserts a curated catalog of real, free, actively-maintained
//      open-source GitHub repos as approved listings, organized under the
//      Main Category -> Subcategory taxonomy defined in
//      src/lib/marketplace-config.ts, all owned by the canonical seller.
//
// Safe to re-run: it always starts from a clean slate.

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const CANONICAL_SELLER_EMAIL = 'seller@gmail.com'

/* -------------------------------------------------------------------------- */
/* Catalog: Main Category -> Subcategory -> real open-source GitHub repos.    */
/* Names below must match src/lib/marketplace-config.ts CATEGORIES exactly.   */
/* -------------------------------------------------------------------------- */

const CATALOG = [
  {
    category: 'Websites',
    subcategory: 'Landing Pages & Marketing',
    repos: [
      {
        title: 'Open React Template', githubRepoName: 'cruip/open-react-template', githubDefaultBranch: 'main',
        description: 'A free React / Next.js landing page template built with Tailwind CSS, designed to showcase open-source projects, SaaS products, and online services.',
        features: ['Animated hero section', 'Feature grid & testimonials', 'Tailwind CSS v4', 'Next.js App Router'],
        techStack: ['Next.js', 'React', 'Tailwind'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['landing-page', 'saas', 'marketing'], stars: 4800, forks: 2300, watchers: 60, commits: 480, contributors: 20, version: '2.0.0',
        previewUrl: 'https://open.cruip.com', featured: true,
      },
      {
        title: 'AstroWind', githubRepoName: 'onwidget/astrowind', githubDefaultBranch: 'main',
        description: 'A production-ready, high-performance company/marketing website template built with Astro and Tailwind CSS, with a full blog system built in.',
        features: ['Astro islands architecture', 'Tailwind CSS styling', 'Built-in blog with RSS', 'Perfect Lighthouse scores'],
        techStack: ['Tailwind'], language: 'Astro', licenseType: 'MIT',
        tags: ['landing-page', 'marketing', 'astro'], stars: 5600, forks: 1300, watchers: 55, commits: 950, contributors: 45, version: '1.0.0',
        previewUrl: 'https://astrowind.vercel.app', featured: false,
      },
      {
        title: 'Simple Light Landing Page', githubRepoName: 'cruip/tailwind-landing-page-template', githubDefaultBranch: 'main',
        description: 'A free landing page template built on top of Tailwind CSS and fully coded in React / Next.js, one of the most forked SaaS landing templates on GitHub.',
        features: ['Fully responsive sections', 'Pricing & FAQ blocks', 'Newsletter signup', 'Dark-mode ready'],
        techStack: ['Next.js', 'React', 'Tailwind'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['landing-page', 'tailwind', 'saas'], stars: 3200, forks: 1900, watchers: 45, commits: 260, contributors: 12, version: '1.2.0',
        previewUrl: 'https://simplelight.cruip.com', featured: false,
      },
      {
        title: 'Tailwind Toolbox Landing Page', githubRepoName: 'tailwindtoolbox/Landing-Page', githubDefaultBranch: 'master',
        description: 'A generic, easy-to-customize Tailwind CSS starter landing page template covering hero, features, pricing, and contact sections.',
        features: ['Ready-made marketing sections', 'Pure Tailwind CSS', 'No build step required', 'Easy to theme'],
        techStack: ['Tailwind'], language: 'HTML', licenseType: 'MIT',
        tags: ['landing-page', 'tailwind', 'starter'], stars: 1100, forks: 780, watchers: 20, commits: 90, contributors: 8, version: '1.0.0',
        previewUrl: 'https://tailwindtoolbox.com/templates/landing-page', featured: false,
      },
    ],
  },
  {
    category: 'Websites',
    subcategory: 'Portfolio Templates',
    repos: [
      {
        title: 'vCard Personal Portfolio', githubRepoName: 'codewithsadee/vcard-personal-portfolio', githubDefaultBranch: 'main',
        description: 'A fully responsive personal portfolio website template built with plain HTML, CSS, and JavaScript — no framework required.',
        features: ['Resume/CV section', 'Portfolio filtering', 'Testimonials modal', 'Contact form'],
        techStack: ['HTML/CSS'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['portfolio', 'personal-website', 'html-css'], stars: 8000, forks: 6200, watchers: 90, commits: 60, contributors: 6, version: '1.0.0',
        previewUrl: 'https://vcard.codewithsadee.com', featured: true,
      },
      {
        title: 'DevPortfolio', githubRepoName: 'ryanfitzgerald/devportfolio', githubDefaultBranch: 'master',
        description: 'A React developer portfolio template that pulls your bio, skills, projects, and blog posts from a simple JSON config file.',
        features: ['JSON-driven content', 'Projects & skills sections', 'Blog integration', 'One-command deploy'],
        techStack: ['React'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['portfolio', 'react', 'developer'], stars: 2400, forks: 1500, watchers: 35, commits: 210, contributors: 30, version: '2.0.0',
        previewUrl: 'https://ryanfitzgerald.github.io/devportfolio', featured: false,
      },
      {
        title: 'React Portfolio Template', githubRepoName: 'chetanverma16/react-portfolio-template', githubDefaultBranch: 'main',
        description: 'A clean, modern developer portfolio template built with React and Tailwind CSS, with light/dark theming and smooth scroll animations.',
        features: ['React + Tailwind CSS', 'Light/dark theme toggle', 'Framer Motion animations', 'Fully responsive'],
        techStack: ['React', 'Tailwind'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['portfolio', 'react', 'tailwind'], stars: 1800, forks: 1600, watchers: 25, commits: 180, contributors: 25, version: '1.5.0',
        previewUrl: 'https://chetanverma.com', featured: false,
      },
      {
        title: 'Developer Portfolio (Soumyajit)', githubRepoName: 'soumyajit4419/Portfolio', githubDefaultBranch: 'master',
        description: 'A popular React portfolio website template featuring an animated home screen, GitHub-connected project cards, and a built-in blog section.',
        features: ['Animated hero screen', 'GitHub project cards', 'Built-in blog', 'Easy content config'],
        techStack: ['React'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['portfolio', 'react', 'developer'], stars: 6600, forks: 3600, watchers: 70, commits: 320, contributors: 40, version: '3.0.0',
        previewUrl: 'https://soumyajit.tech', featured: false,
      },
      {
        title: 'Simplefolio', githubRepoName: 'cobiwave/simplefolio', githubDefaultBranch: 'master',
        description: 'A minimalist, single-page React portfolio template focused on fast load times and clean typography.',
        features: ['Single-page layout', 'Minimal, fast-loading UI', 'Smooth-scroll navigation', 'Mobile-first design'],
        techStack: ['React'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['portfolio', 'minimal', 'react'], stars: 1500, forks: 950, watchers: 18, commits: 90, contributors: 10, version: '1.0.0',
        previewUrl: 'https://cobiwave.github.io/simplefolio', featured: false,
      },
    ],
  },
  {
    category: 'Websites',
    subcategory: 'Blog & Content Sites',
    repos: [
      {
        title: 'AstroPaper', githubRepoName: 'satnaing/astro-paper', githubDefaultBranch: 'main',
        description: 'A minimal, accessible, SEO-friendly Astro blog theme with type-safe markdown, fuzzy search, and dynamic OG image generation.',
        features: ['Type-safe content collections', 'Built-in fuzzy search', 'Dynamic OG images', 'Light/dark mode'],
        techStack: ['Tailwind'], language: 'Astro', licenseType: 'MIT',
        tags: ['blog', 'astro', 'seo'], stars: 6500, forks: 1900, watchers: 40, commits: 700, contributors: 90, version: '4.0.0',
        previewUrl: 'https://astro-paper.pages.dev', featured: false,
      },
      {
        title: 'Tailwind Next.js Starter Blog', githubRepoName: 'timlrx/tailwind-nextjs-starter-blog', githubDefaultBranch: 'main',
        description: 'A feature-rich Next.js + Tailwind CSS blog starter with MDX support, code syntax highlighting, RSS feed, and SEO built in.',
        features: ['MDX-powered posts', 'Code syntax highlighting', 'Auto-generated RSS & sitemap', 'Reading-time & tags'],
        techStack: ['Next.js', 'Tailwind'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['blog', 'nextjs', 'mdx'], stars: 9600, forks: 3300, watchers: 65, commits: 650, contributors: 110, version: '2.0.0',
        previewUrl: 'https://tailwind-nextjs-starter-blog.vercel.app', featured: true,
      },
      {
        title: 'Ghost', githubRepoName: 'TryGhost/Ghost', githubDefaultBranch: 'main',
        description: 'A professional, open-source publishing platform built on a modern Node.js stack — powers independent blogs, newsletters, and membership sites.',
        features: ['Built-in newsletter & memberships', 'Native SEO & AMP', 'Headless content API', 'Rich admin editor'],
        techStack: ['Node.js'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['blog', 'cms', 'publishing'], stars: 48000, forks: 10400, watchers: 1500, commits: 30000, contributors: 700, version: '5.90.0',
        previewUrl: 'https://ghost.org', featured: false,
      },
      {
        title: 'Zola', githubRepoName: 'getzola/zola', githubDefaultBranch: 'master',
        description: 'A fast, single-binary static site generator with everything (Sass compilation, syntax highlighting, search index) built in — no plugins needed.',
        features: ['Single static binary', 'Built-in Sass & search index', 'Fast incremental builds', 'Content taxonomies'],
        techStack: [], language: 'Rust', licenseType: 'MIT',
        tags: ['blog', 'static-site-generator', 'rust'], stars: 15800, forks: 950, watchers: 130, commits: 3400, contributors: 350, version: '0.19.0',
        previewUrl: 'https://www.getzola.org', featured: false,
      },
    ],
  },
  {
    category: 'Web Apps & SaaS',
    subcategory: 'SaaS Boilerplates',
    repos: [
      {
        title: 'SaaS Boilerplate', githubRepoName: 'ixartz/SaaS-Boilerplate', githubDefaultBranch: 'main',
        description: 'A production-grade Next.js SaaS starter with multi-tenancy, role-based access control, Stripe billing, and Clerk authentication with passkeys & MFA.',
        features: ['Multi-tenant organizations', 'Stripe subscription billing', 'Clerk auth w/ passkeys & MFA', 'Shadcn UI + i18n'],
        techStack: ['Next.js', 'Stripe', 'PostgreSQL'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['saas', 'boilerplate', 'multi-tenant'], stars: 7100, forks: 1900, watchers: 55, commits: 900, contributors: 60, version: '3.0.0',
        previewUrl: 'https://saas.creativedesignsguru.com', featured: true,
      },
      {
        title: 'Next.js SaaS Starter', githubRepoName: 'nextjs/saas-starter', githubDefaultBranch: 'main',
        description: 'The official Vercel/Next.js SaaS starter kit — a clean, minimal template with Stripe subscription billing and a Postgres-backed dashboard.',
        features: ['Stripe Checkout & billing portal', 'Team & role management', 'Postgres + Drizzle ORM', 'App Router'],
        techStack: ['Next.js', 'Stripe', 'PostgreSQL'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['saas', 'boilerplate', 'stripe'], stars: 8200, forks: 3400, watchers: 70, commits: 260, contributors: 40, version: '1.0.0',
        previewUrl: 'https://next-saas-start.vercel.app', featured: false,
      },
      {
        title: 'SaaS Starter Kit', githubRepoName: 'boxyhq/saas-starter-kit', githubDefaultBranch: 'main',
        description: 'An enterprise-ready Next.js SaaS starter kit with SAML SSO, SCIM directory sync, audit logs, and team management out of the box.',
        features: ['SAML SSO & SCIM sync', 'Audit logs', 'Team & member management', 'Webhooks'],
        techStack: ['Next.js', 'PostgreSQL'], language: 'TypeScript', licenseType: 'Apache-2.0',
        tags: ['saas', 'enterprise', 'sso'], stars: 4200, forks: 1500, watchers: 40, commits: 2400, contributors: 55, version: '2.0.0',
        previewUrl: 'https://saas-starter-kit.boxyhq.com', featured: false,
      },
      {
        title: 'Cal.com', githubRepoName: 'calcom/cal.com', githubDefaultBranch: 'main',
        description: 'A real, production-grade open-source scheduling/SaaS platform (the open-source Calendly alternative) — a great reference for a fully-built Next.js SaaS product.',
        features: ['Team scheduling & booking pages', 'Calendar integrations', 'Workflow automation', 'White-label ready'],
        techStack: ['Next.js', 'PostgreSQL', 'Prisma'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['saas', 'scheduling', 'production-app'], stars: 34000, forks: 9500, watchers: 220, commits: 22000, contributors: 900, version: '4.5.0',
        previewUrl: 'https://cal.com', featured: false,
      },
    ],
  },
  {
    category: 'Web Apps & SaaS',
    subcategory: 'Admin Dashboards',
    repos: [
      {
        title: 'Next.js Shadcn Dashboard Starter', githubRepoName: 'Kiranism/next-shadcn-dashboard-starter', githubDefaultBranch: 'main',
        description: 'The most popular open-source Next.js admin dashboard, combining shadcn/ui components with Tailwind CSS — includes data tables, kanban board, and charts.',
        features: ['TanStack tables w/ server pagination', 'Kanban board', 'Shadcn charts', 'Faceted search filters'],
        techStack: ['Next.js', 'Tailwind'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['dashboard', 'admin', 'shadcn'], stars: 6100, forks: 1400, watchers: 45, commits: 550, contributors: 60, version: '2.0.0',
        previewUrl: 'https://next-shadcn-dashboard-starter.vercel.app', featured: true,
      },
      {
        title: 'TailAdmin', githubRepoName: 'TailAdmin/free-nextjs-admin-dashboard', githubDefaultBranch: 'main',
        description: 'A free, open-source Next.js + Tailwind CSS admin dashboard template with 500+ UI elements and multiple dashboard variations.',
        features: ['500+ dashboard UI elements', 'Multiple dashboard variants', 'Collapsible sidebar & chat UI', 'Advanced charts'],
        techStack: ['Next.js', 'Tailwind'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['dashboard', 'admin', 'tailwind'], stars: 3800, forks: 1600, watchers: 35, commits: 480, contributors: 25, version: '2.0.0',
        previewUrl: 'https://nextjs-demo.tailadmin.com', featured: false,
      },
      {
        title: 'Horizon UI Next.js Dashboard', githubRepoName: 'horizon-ui/horizon-ui-chakra-nextjs', githubDefaultBranch: 'main',
        description: 'An open-source Next.js admin dashboard template built with Chakra UI, featuring a clean modern aesthetic and modular widgets.',
        features: ['Chakra UI components', 'Modular dashboard widgets', 'Dark mode', 'Responsive layout'],
        techStack: ['Next.js', 'React'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['dashboard', 'admin', 'chakra-ui'], stars: 2100, forks: 900, watchers: 25, commits: 300, contributors: 20, version: '1.2.0',
        previewUrl: 'https://horizon-ui.com/horizon-ui-chakra-nextjs', featured: false,
      },
      {
        title: 'AdminLTE', githubRepoName: 'ColorlibHQ/AdminLTE', githubDefaultBranch: 'master',
        description: 'The most-starred open-source admin dashboard template on GitHub — a fully responsive Bootstrap 5 admin panel with dozens of ready-made pages and widgets.',
        features: ['Bootstrap 5 based', 'Dozens of ready pages', 'Chart & widget library', 'RTL support'],
        techStack: [], language: 'JavaScript', licenseType: 'MIT',
        tags: ['dashboard', 'admin', 'bootstrap'], stars: 45000, forks: 18000, watchers: 900, commits: 2100, contributors: 400, version: '3.2.0',
        previewUrl: 'https://adminlte.io', featured: false,
      },
    ],
  },
  {
    category: 'AI Projects',
    subcategory: 'LLM Apps & Agents',
    repos: [
      {
        title: 'LangChain', githubRepoName: 'langchain-ai/langchain', githubDefaultBranch: 'master',
        description: 'The most widely used framework for building LLM-powered applications — chains, agents, retrieval, and integrations with virtually every model provider.',
        features: ['Composable chains & agents', 'RAG & retrieval tooling', 'Hundreds of integrations', 'LangGraph & LangSmith ecosystem'],
        techStack: ['Python'], language: 'Python', licenseType: 'MIT',
        tags: ['ai', 'llm', 'agents', 'rag'], stars: 105000, forks: 17000, watchers: 900, commits: 20000, contributors: 3400, version: '0.3.0',
        previewUrl: 'https://python.langchain.com', featured: true,
      },
      {
        title: 'CrewAI', githubRepoName: 'crewAIInc/crewAI', githubDefaultBranch: 'main',
        description: 'A lean, standalone multi-agent orchestration framework for building role-playing, autonomous AI agent teams — no LangChain dependency required.',
        features: ['Role-based agent crews', 'Sequential & hierarchical processes', 'Tool integrations', 'Flows for structured automations'],
        techStack: ['Python'], language: 'Python', licenseType: 'MIT',
        tags: ['ai', 'agents', 'multi-agent'], stars: 33000, forks: 4400, watchers: 300, commits: 3200, contributors: 250, version: '0.100.0',
        previewUrl: 'https://crewai.com', featured: false,
      },
      {
        title: 'Dify', githubRepoName: 'langgenius/dify', githubDefaultBranch: 'main',
        description: 'An open-source, low-code platform for building and operating production-grade LLM applications and AI agents with a visual workflow builder.',
        features: ['Visual agent/workflow builder', 'RAG pipeline built in', 'Model-agnostic', 'Self-hostable'],
        techStack: ['Python', 'Next.js'], language: 'TypeScript', licenseType: 'Apache-2.0',
        tags: ['ai', 'llm', 'low-code'], stars: 95000, forks: 14000, watchers: 700, commits: 9500, contributors: 550, version: '1.0.0',
        previewUrl: 'https://dify.ai', featured: false,
      },
      {
        title: 'LlamaIndex', githubRepoName: 'run-llama/llama_index', githubDefaultBranch: 'main',
        description: 'The leading data framework for connecting custom data sources to large language models — purpose-built for retrieval-augmented generation.',
        features: ['Data connectors for 100+ sources', 'Advanced RAG pipelines', 'Agentic workflows', 'Vector store integrations'],
        techStack: ['Python'], language: 'Python', licenseType: 'MIT',
        tags: ['ai', 'llm', 'rag'], stars: 40000, forks: 5700, watchers: 300, commits: 8000, contributors: 800, version: '0.12.0',
        previewUrl: 'https://www.llamaindex.ai', featured: false,
      },
      {
        title: 'AutoGen', githubRepoName: 'microsoft/autogen', githubDefaultBranch: 'main',
        description: "Microsoft's open-source framework for building multi-agent AI applications that can act autonomously or collaborate with humans.",
        features: ['Multi-agent conversation framework', 'Human-in-the-loop workflows', 'AutoGen Studio no-code UI', 'Code execution agents'],
        techStack: ['Python'], language: 'Python', licenseType: 'MIT',
        tags: ['ai', 'agents', 'multi-agent'], stars: 45000, forks: 6800, watchers: 400, commits: 3400, contributors: 380, version: '0.4.0',
        previewUrl: 'https://microsoft.github.io/autogen', featured: false,
      },
    ],
  },
  {
    category: 'AI Projects',
    subcategory: 'ML & Deep Learning Frameworks',
    repos: [
      {
        title: 'PyTorch', githubRepoName: 'pytorch/pytorch', githubDefaultBranch: 'main',
        description: 'An open-source machine learning framework that accelerates the path from research prototyping to production deployment, maintained by Meta and the PyTorch Foundation.',
        features: ['Dynamic computation graphs', 'GPU/TPU acceleration', 'TorchScript & torch.compile', 'Massive ecosystem'],
        techStack: ['Python'], language: 'Python', licenseType: 'BSD-3-Clause',
        tags: ['ai', 'machine-learning', 'deep-learning'], stars: 92000, forks: 25000, watchers: 1700, commits: 65000, contributors: 4000, version: '2.6.0',
        previewUrl: 'https://pytorch.org', featured: true,
      },
      {
        title: 'TensorFlow', githubRepoName: 'tensorflow/tensorflow', githubDefaultBranch: 'master',
        description: 'An end-to-end open-source platform for machine learning, from research experimentation to large-scale production deployment.',
        features: ['Keras high-level API', 'Distributed training', 'TensorBoard visualization', 'Cross-platform deployment'],
        techStack: ['Python'], language: 'Python', licenseType: 'Apache-2.0',
        tags: ['ai', 'tensorflow', 'machine-learning'], stars: 190000, forks: 75000, watchers: 7700, commits: 150000, contributors: 4500, version: '2.19.0',
        previewUrl: 'https://www.tensorflow.org', featured: false,
      },
      {
        title: 'Transformers', githubRepoName: 'huggingface/transformers', githubDefaultBranch: 'main',
        description: "Hugging Face's library of state-of-the-art pretrained models for text, vision, audio, and multimodal tasks, with simple pipelines for inference and fine-tuning.",
        features: ['100,000+ pretrained models', 'Unified pipeline API', 'PyTorch/TF/JAX interop', 'Fine-tuning & training utilities'],
        techStack: ['Python'], language: 'Python', licenseType: 'Apache-2.0',
        tags: ['ai', 'nlp', 'machine-learning'], stars: 145000, forks: 29000, watchers: 1200, commits: 17000, contributors: 3000, version: '4.48.0',
        previewUrl: 'https://huggingface.co/docs/transformers', featured: false,
      },
      {
        title: 'scikit-learn', githubRepoName: 'scikit-learn/scikit-learn', githubDefaultBranch: 'main',
        description: 'The most widely used Python library for classical machine learning — simple, consistent APIs for classification, regression, clustering, and preprocessing.',
        features: ['Consistent estimator API', 'Model selection & pipelines', 'Extensive preprocessing tools', 'Excellent documentation'],
        techStack: ['Python'], language: 'Python', licenseType: 'BSD-3-Clause',
        tags: ['ai', 'machine-learning', 'data-science'], stars: 61000, forks: 25000, watchers: 2200, commits: 30000, contributors: 3200, version: '1.6.0',
        previewUrl: 'https://scikit-learn.org', featured: false,
      },
      {
        title: 'Keras', githubRepoName: 'keras-team/keras', githubDefaultBranch: 'master',
        description: 'A deep learning API for Python, designed for human beings — runs on top of TensorFlow, JAX, or PyTorch with a consistent, easy-to-learn API.',
        features: ['Multi-backend (TF/JAX/PyTorch)', 'High-level, readable API', 'Built-in layers & optimizers', 'Great for rapid prototyping'],
        techStack: ['Python'], language: 'Python', licenseType: 'Apache-2.0',
        tags: ['ai', 'deep-learning', 'keras'], stars: 62000, forks: 19500, watchers: 1900, commits: 12000, contributors: 1300, version: '3.7.0',
        previewUrl: 'https://keras.io', featured: false,
      },
    ],
  },
  {
    category: 'E-commerce',
    subcategory: 'Storefronts',
    repos: [
      {
        title: 'Next.js Commerce', githubRepoName: 'vercel/commerce', githubDefaultBranch: 'main',
        description: "Vercel's official high-performance, server-rendered Next.js storefront template, pluggable into Shopify, BigCommerce, and other commerce backends.",
        features: ['App Router + React Server Components', 'Cart & checkout flows', 'Pluggable commerce backend', 'Edge-ready performance'],
        techStack: ['Next.js', 'React'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ecommerce', 'storefront', 'nextjs'], stars: 12000, forks: 4400, watchers: 130, commits: 1200, contributors: 130, version: '2.0.0',
        previewUrl: 'https://demo.vercel.store', featured: true,
      },
      {
        title: 'Vue Storefront', githubRepoName: 'vuestorefront/vue-storefront', githubDefaultBranch: 'develop',
        description: 'A headless, PWA-ready e-commerce storefront frontend that connects to any commerce backend (Shopify, Magento, Commercetools, and more).',
        features: ['Headless PWA architecture', 'Framework-agnostic connectors', 'Offline-first shopping cart', 'SEO-optimized SSR'],
        techStack: ['Vue', 'Node.js'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ecommerce', 'storefront', 'pwa'], stars: 10800, forks: 2400, watchers: 140, commits: 15000, contributors: 250, version: '2.0.0',
        previewUrl: 'https://vuestorefront.io', featured: false,
      },
      {
        title: 'Reaction Commerce', githubRepoName: 'reactioncommerce/reaction', githubDefaultBranch: 'trunk',
        description: 'A real-time, headless commerce platform built with Node.js and GraphQL, designed for high-growth B2B and B2C storefronts.',
        features: ['GraphQL API-first architecture', 'Real-time inventory & pricing', 'Multi-currency & multi-shop', 'Pluggable microservices'],
        techStack: ['Node.js', 'GraphQL', 'MongoDB'], language: 'JavaScript', licenseType: 'GPL-3.0',
        tags: ['ecommerce', 'storefront', 'graphql'], stars: 12500, forks: 1900, watchers: 400, commits: 21000, contributors: 200, version: '4.0.0',
        previewUrl: 'https://reactioncommerce.com', featured: false,
      },
      {
        title: 'Spree Commerce', githubRepoName: 'spree/spree', githubDefaultBranch: 'main',
        description: 'A complete, open-source e-commerce platform and storefront built on Ruby on Rails, powering thousands of stores worldwide.',
        features: ['Full storefront + admin', 'REST & GraphQL APIs', 'Extensible via extensions', 'Multi-currency support'],
        techStack: ['Node.js'], language: 'Ruby', licenseType: 'BSD-3-Clause',
        tags: ['ecommerce', 'storefront', 'ruby-on-rails'], stars: 12200, forks: 4400, watchers: 400, commits: 24000, contributors: 700, version: '4.8.0',
        previewUrl: 'https://spreecommerce.org', featured: false,
      },
    ],
  },
  {
    category: 'E-commerce',
    subcategory: 'Headless Commerce Backends',
    repos: [
      {
        title: 'Medusa', githubRepoName: 'medusajs/medusa', githubDefaultBranch: 'develop',
        description: 'A fast-growing, open-source headless commerce engine built on Node.js — fully customizable for D2C brands, B2B platforms, and marketplaces.',
        features: ['Modular commerce modules', 'Admin dashboard included', 'Plugin & workflow SDK', 'Composable architecture'],
        techStack: ['Node.js', 'PostgreSQL'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ecommerce', 'headless', 'nodejs'], stars: 30000, forks: 2500, watchers: 220, commits: 14000, contributors: 400, version: '2.4.0',
        previewUrl: 'https://medusajs.com', featured: true,
      },
      {
        title: 'Vendure', githubRepoName: 'vendure-ecommerce/vendure', githubDefaultBranch: 'master',
        description: 'A modern, TypeScript-based headless commerce framework with a GraphQL API, built for developers who need full control over their store logic.',
        features: ['GraphQL Admin & Shop APIs', 'Plugin architecture', 'Multi-channel & multi-vendor', 'Built-in order/fulfillment workflows'],
        techStack: ['Node.js', 'GraphQL', 'PostgreSQL'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ecommerce', 'headless', 'graphql'], stars: 5200, forks: 950, watchers: 65, commits: 8500, contributors: 130, version: '3.1.0',
        previewUrl: 'https://vendure.io', featured: false,
      },
      {
        title: 'Saleor', githubRepoName: 'saleor/saleor', githubDefaultBranch: 'main',
        description: 'A GraphQL-first, headless commerce platform built on Python/Django, designed for high-performance, composable storefronts at scale.',
        features: ['GraphQL-first API', 'Composable checkout SDK', 'Multi-channel & multi-currency', 'Webhooks & apps marketplace'],
        techStack: ['Python', 'Django', 'GraphQL'], language: 'Python', licenseType: 'BSD-3-Clause',
        tags: ['ecommerce', 'headless', 'graphql'], stars: 21000, forks: 5500, watchers: 350, commits: 24000, contributors: 350, version: '3.20.0',
        previewUrl: 'https://saleor.io', featured: false,
      },
      {
        title: 'Bagisto', githubRepoName: 'bagisto/bagisto', githubDefaultBranch: 'master',
        description: 'A free, open-source Laravel-based e-commerce platform offering a full multi-channel, multi-vendor commerce backend out of the box.',
        features: ['Multi-vendor marketplace mode', 'Admin & storefront included', 'Multi-currency & multi-locale', 'REST APIs'],
        techStack: ['Laravel'], language: 'PHP', licenseType: 'MIT',
        tags: ['ecommerce', 'headless', 'laravel'], stars: 12800, forks: 4400, watchers: 350, commits: 13000, contributors: 350, version: '2.3.0',
        previewUrl: 'https://bagisto.com', featured: false,
      },
    ],
  },
  {
    category: 'Mobile Apps',
    subcategory: 'Cross-Platform (React Native / Flutter)',
    repos: [
      {
        title: 'Ignite', githubRepoName: 'infinitered/ignite', githubDefaultBranch: 'master',
        description: "Infinite Red's battle-tested React Native app boilerplate and CLI generator — the most popular way to bootstrap a production React Native app.",
        features: ['CLI project generator', 'MobX-State-Tree or Zustand', 'Navigation & theming presets', 'Component/model generators'],
        techStack: ['React Native'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['mobile', 'react-native', 'boilerplate'], stars: 18000, forks: 1600, watchers: 220, commits: 5200, contributors: 180, version: '10.0.0',
        previewUrl: 'https://ignitecookbook.com', featured: true,
      },
      {
        title: 'Obytes React Native Template', githubRepoName: 'obytes/react-native-template-obytes', githubDefaultBranch: 'main',
        description: 'A production-ready React Native + Expo starter template featuring TypeScript, TailwindCSS, React Query, and CI/CD via EAS out of the box.',
        features: ['Expo + expo-router', 'NativeWind (Tailwind for RN)', 'React Query & React Hook Form', 'EAS + GitHub Actions CI/CD'],
        techStack: ['React Native', 'Tailwind'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['mobile', 'react-native', 'expo'], stars: 4200, forks: 700, watchers: 45, commits: 1400, contributors: 60, version: '4.0.0',
        previewUrl: 'https://starter.obytes.com', featured: false,
      },
      {
        title: 'Flutter Samples', githubRepoName: 'flutter/samples', githubDefaultBranch: 'main',
        description: "Google's official collection of open-source Flutter sample apps, demonstrating best practices for state management, navigation, and platform integration.",
        features: ['Official Google-maintained', 'Multiple architecture patterns', 'Cross-platform (iOS/Android/web/desktop)', 'Continuously updated for new Flutter releases'],
        techStack: ['Flutter'], language: 'Dart', licenseType: 'BSD-3-Clause',
        tags: ['mobile', 'flutter', 'cross-platform'], stars: 15500, forks: 10800, watchers: 500, commits: 4800, contributors: 300, version: '1.0.0',
        previewUrl: 'https://flutter.github.io/samples', featured: false,
      },
      {
        title: 'Flutter Boilerplate Project', githubRepoName: 'zubairehman/flutter-boilerplate-project', githubDefaultBranch: 'master',
        description: 'A Flutter starter project implementing clean architecture with BLoC state management, ready for scaling into a production app.',
        features: ['Clean architecture layers', 'BLoC state management', 'Localization & theming', 'Dependency injection setup'],
        techStack: ['Flutter'], language: 'Dart', licenseType: 'MIT',
        tags: ['mobile', 'flutter', 'clean-architecture'], stars: 5100, forks: 1300, watchers: 90, commits: 260, contributors: 25, version: '2.0.0',
        previewUrl: 'https://github.com/zubairehman/flutter-boilerplate-project', featured: false,
      },
    ],
  },
  {
    category: 'Mobile Apps',
    subcategory: 'Native iOS & Android',
    repos: [
      {
        title: 'Now in Android', githubRepoName: 'android/nowinandroid', githubDefaultBranch: 'main',
        description: "Google's official, fully-featured Android app built entirely with Kotlin and Jetpack Compose, demonstrating modern Android architecture best practices.",
        features: ['100% Jetpack Compose UI', 'Modern app architecture', 'Kotlin coroutines & Flow', 'Extensive test coverage'],
        techStack: [], language: 'Kotlin', licenseType: 'Apache-2.0',
        tags: ['mobile', 'android', 'jetpack-compose'], stars: 18500, forks: 2500, watchers: 350, commits: 3600, contributors: 90, version: '1.0.0',
        previewUrl: 'https://github.com/android/nowinandroid', featured: true,
      },
      {
        title: 'Android Architecture Blueprints', githubRepoName: 'android/architecture-samples', githubDefaultBranch: 'main',
        description: "Google's official collection of Android app architecture samples, showing the same to-do app implemented with different architectural approaches.",
        features: ['MVVM reference architecture', 'Jetpack Compose + Hilt', 'Testable, modular code', 'Official Google guidance'],
        techStack: [], language: 'Kotlin', licenseType: 'Apache-2.0',
        tags: ['mobile', 'android', 'architecture'], stars: 45000, forks: 15500, watchers: 1900, commits: 3800, contributors: 130, version: '1.0.0',
        previewUrl: 'https://github.com/android/architecture-samples', featured: false,
      },
      {
        title: 'Google I/O App (iosched)', githubRepoName: 'google/iosched', githubDefaultBranch: 'main',
        description: "The official, open-source Android app for Google's I/O developer conference — a real, production-scale Compose app maintained by Google.",
        features: ['Real production Compose app', 'Offline-first data sync', 'Firebase integration', 'Adaptive layouts'],
        techStack: [], language: 'Kotlin', licenseType: 'Apache-2.0',
        tags: ['mobile', 'android', 'production-app'], stars: 20500, forks: 6800, watchers: 750, commits: 6300, contributors: 90, version: '1.0.0',
        previewUrl: 'https://github.com/google/iosched', featured: false,
      },
      {
        title: 'Food Truck (SwiftUI Sample)', githubRepoName: 'apple/sample-food-truck', githubDefaultBranch: 'main',
        description: "Apple's official SwiftUI sample app demonstrating modern iOS/iPadOS/macOS app architecture with widgets, App Intents, and Swift Charts.",
        features: ['Multiplatform SwiftUI (iOS/iPadOS/macOS)', 'WidgetKit & App Intents', 'Swift Charts integration', 'Official Apple sample code'],
        techStack: [], language: 'Swift', licenseType: 'MIT',
        tags: ['mobile', 'ios', 'swiftui'], stars: 3400, forks: 620, watchers: 90, commits: 40, contributors: 8, version: '1.0.0',
        previewUrl: 'https://developer.apple.com/documentation/swiftui/food_truck', featured: false,
      },
    ],
  },
  {
    category: 'Components & UI Kits',
    subcategory: 'Component Libraries',
    repos: [
      {
        title: 'shadcn/ui', githubRepoName: 'shadcn-ui/ui', githubDefaultBranch: 'main',
        description: 'The most-starred React component library of its kind — beautifully designed, accessible components built on Radix UI and Tailwind CSS, distributed as copy-paste code.',
        features: ['Copy-paste component distribution', 'Radix UI accessibility primitives', 'Fully themeable with Tailwind', 'CLI for adding components'],
        techStack: ['React', 'Tailwind'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ui', 'components', 'design-system'], stars: 85000, forks: 5800, watchers: 400, commits: 3200, contributors: 500, version: '2.3.0',
        previewUrl: 'https://ui.shadcn.com', featured: true,
      },
      {
        title: 'Radix Primitives', githubRepoName: 'radix-ui/primitives', githubDefaultBranch: 'main',
        description: 'Unstyled, accessible UI primitives for building high-quality React design systems and component libraries — the foundation beneath shadcn/ui.',
        features: ['WAI-ARIA compliant primitives', 'Fully unstyled & composable', 'Keyboard navigation built in', 'Used by thousands of design systems'],
        techStack: ['React'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ui', 'components', 'accessibility'], stars: 16500, forks: 970, watchers: 90, commits: 3400, contributors: 200, version: '1.1.0',
        previewUrl: 'https://www.radix-ui.com', featured: false,
      },
      {
        title: 'Material UI', githubRepoName: 'mui/material-ui', githubDefaultBranch: 'master',
        description: "The world's most popular React UI component library, implementing Google's Material Design with a huge ecosystem of components and templates.",
        features: ['1,000+ ready components', 'Theming & design tokens', 'Data grid & date pickers', 'Server-side rendering support'],
        techStack: ['React'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ui', 'components', 'material-design'], stars: 96000, forks: 32000, watchers: 1800, commits: 32000, contributors: 3300, version: '6.3.0',
        previewUrl: 'https://mui.com', featured: false,
      },
      {
        title: 'Ant Design', githubRepoName: 'ant-design/ant-design', githubDefaultBranch: 'master',
        description: 'An enterprise-grade React UI component library from Alibaba, purpose-built for data-heavy admin and business applications.',
        features: ['80+ enterprise components', 'Built-in internationalization', 'Design tokens & theming', 'Rich form & table components'],
        techStack: ['React'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ui', 'components', 'enterprise'], stars: 93000, forks: 50000, watchers: 1300, commits: 9500, contributors: 2000, version: '5.23.0',
        previewUrl: 'https://ant.design', featured: false,
      },
    ],
  },
  {
    category: 'Components & UI Kits',
    subcategory: 'Design Systems & Blocks',
    repos: [
      {
        title: 'Tailwind CSS', githubRepoName: 'tailwindlabs/tailwindcss', githubDefaultBranch: 'main',
        description: 'The utility-first CSS framework that underpins most modern design systems — build custom designs without ever leaving your HTML.',
        features: ['Utility-first classes', 'JIT compiler engine', 'Fully customizable design tokens', 'First-class dark mode support'],
        techStack: ['Tailwind'], language: 'JavaScript', licenseType: 'MIT',
        tags: ['css', 'design-system', 'tailwind'], stars: 86000, forks: 4500, watchers: 780, commits: 12500, contributors: 700, version: '4.0.0',
        previewUrl: 'https://tailwindcss.com', featured: false,
      },
      {
        title: 'HyperUI', githubRepoName: 'markmead/hyperui', githubDefaultBranch: 'main',
        description: 'The largest free collection of Tailwind CSS component blocks — 500+ copy-paste marketing, ecommerce, and application UI sections.',
        features: ['500+ copy-paste blocks', 'Marketing & application sections', 'No dependencies, pure Tailwind', 'Dark mode variants included'],
        techStack: ['Tailwind'], language: 'HTML', licenseType: 'MIT',
        tags: ['ui', 'design-system', 'tailwind-blocks'], stars: 12000, forks: 750, watchers: 90, commits: 2200, contributors: 60, version: '1.0.0',
        previewUrl: 'https://www.hyperui.dev', featured: false,
      },
      {
        title: 'Magic UI', githubRepoName: 'magicuidesign/magicui', githubDefaultBranch: 'main',
        description: 'The most widely used animation layer in the shadcn/ui ecosystem — 150+ animated, interactive components for modern marketing sites.',
        features: ['150+ animated components', 'Built on shadcn/ui + Framer Motion', 'Copy-paste, fully customizable', 'Marketing-site focused blocks'],
        techStack: ['React', 'Tailwind'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['ui', 'design-system', 'animation'], stars: 15000, forks: 1500, watchers: 90, commits: 1800, contributors: 90, version: '1.0.0',
        previewUrl: 'https://magicui.design', featured: false,
      },
      {
        title: 'Tremor', githubRepoName: 'tremorlabs/tremor', githubDefaultBranch: 'main',
        description: 'A React component library and design system purpose-built for dashboards, analytics UIs, and data visualization.',
        features: ['Chart & KPI components', 'Built on Tailwind + Radix', 'Dashboard-focused design tokens', 'Copy-paste blocks & full library modes'],
        techStack: ['React', 'Tailwind'], language: 'TypeScript', licenseType: 'Apache-2.0',
        tags: ['ui', 'design-system', 'dashboards'], stars: 15500, forks: 750, watchers: 80, commits: 1300, contributors: 90, version: '3.18.0',
        previewUrl: 'https://tremor.so', featured: false,
      },
    ],
  },
  {
    category: 'Browser Extensions',
    subcategory: 'Extension Boilerplates & Frameworks',
    repos: [
      {
        title: 'Plasmo', githubRepoName: 'PlasmoHQ/plasmo', githubDefaultBranch: 'main',
        description: 'The leading open-source framework for building production-grade browser extensions with React, TypeScript, and zero-config bundling.',
        features: ['Zero-config MV3 bundling', 'Hot module reload for extensions', 'Cross-browser build targets', 'First-class React & TypeScript support'],
        techStack: ['React'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['browser-extension', 'framework', 'manifest-v3'], stars: 11500, forks: 620, watchers: 70, commits: 2400, contributors: 90, version: '0.90.0',
        previewUrl: 'https://www.plasmo.com', featured: true,
      },
      {
        title: 'Chrome Extension Boilerplate (React)', githubRepoName: 'lxieyang/chrome-extension-boilerplate-react', githubDefaultBranch: 'master',
        description: 'A widely used Chrome extension boilerplate built with React 18, Webpack 5, and Manifest V3 — popup, options page, and content scripts included.',
        features: ['Manifest V3', 'React 18 + Webpack 5', 'Popup, options & content scripts', 'Hot reload during development'],
        techStack: ['React'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['browser-extension', 'boilerplate', 'react'], stars: 6600, forks: 1200, watchers: 60, commits: 220, contributors: 40, version: '2.0.0',
        previewUrl: 'https://github.com/lxieyang/chrome-extension-boilerplate-react', featured: false,
      },
      {
        title: 'WXT', githubRepoName: 'wxt-dev/wxt', githubDefaultBranch: 'main',
        description: 'A next-generation, Vite-powered framework for building web extensions that work across Chrome, Firefox, Edge, and Safari from one codebase.',
        features: ['Vite-based dev server & HMR', 'Cross-browser from one codebase', 'Auto-generated manifest', 'Framework-agnostic (React/Vue/Svelte)'],
        techStack: [], language: 'TypeScript', licenseType: 'MIT',
        tags: ['browser-extension', 'framework', 'vite'], stars: 6200, forks: 320, watchers: 40, commits: 1600, contributors: 90, version: '0.20.0',
        previewUrl: 'https://wxt.dev', featured: false,
      },
      {
        title: 'Chrome Extension TypeScript Starter', githubRepoName: 'chibat/chrome-extension-typescript-starter', githubDefaultBranch: 'master',
        description: 'A minimal, well-maintained TypeScript starter for Chrome extensions with Webpack bundling and Jest testing configured out of the box.',
        features: ['TypeScript + Webpack setup', 'Jest testing configured', 'Manifest V3 ready', 'Minimal, easy to extend'],
        techStack: [], language: 'TypeScript', licenseType: 'MIT',
        tags: ['browser-extension', 'boilerplate', 'typescript'], stars: 1900, forks: 480, watchers: 30, commits: 150, contributors: 20, version: '1.0.0',
        previewUrl: 'https://github.com/chibat/chrome-extension-typescript-starter', featured: false,
      },
    ],
  },
  {
    category: 'Browser Extensions',
    subcategory: 'Real-World Extensions',
    repos: [
      {
        title: 'Refined GitHub', githubRepoName: 'refined-github/refined-github', githubDefaultBranch: 'main',
        description: 'A hugely popular browser extension that simplifies the GitHub interface and adds useful, highly-requested features on top of it.',
        features: ['200+ opt-in GitHub features', 'Works on Chrome, Firefox & Safari', 'Actively maintained by the community', 'Zero telemetry'],
        techStack: [], language: 'TypeScript', licenseType: 'MIT',
        tags: ['browser-extension', 'github', 'productivity'], stars: 26000, forks: 1600, watchers: 250, commits: 6500, contributors: 400, version: '25.0.0',
        previewUrl: 'https://github.com/refined-github/refined-github', featured: true,
      },
      {
        title: 'MetaMask Extension', githubRepoName: 'MetaMask/metamask-extension', githubDefaultBranch: 'main',
        description: 'The most widely used open-source crypto wallet browser extension, providing a secure interface to Ethereum and EVM-compatible blockchains.',
        features: ['Secure key management', 'Multi-chain wallet support', 'dApp browser integration', 'Hardware wallet support'],
        techStack: [], language: 'JavaScript', licenseType: 'MIT',
        tags: ['browser-extension', 'wallet', 'web3'], stars: 12500, forks: 5100, watchers: 400, commits: 33000, contributors: 700, version: '12.9.0',
        previewUrl: 'https://metamask.io', featured: false,
      },
      {
        title: 'Vue Devtools', githubRepoName: 'vuejs/devtools', githubDefaultBranch: 'main',
        description: 'The official browser devtools extension for debugging Vue.js applications — component tree inspection, timeline, and state management debugging.',
        features: ['Component tree inspector', 'Vuex/Pinia state inspector', 'Timeline & performance tracking', 'Works with Vue 2 & 3'],
        techStack: ['Vue'], language: 'TypeScript', licenseType: 'MIT',
        tags: ['browser-extension', 'devtools', 'vue'], stars: 9000, forks: 1200, watchers: 90, commits: 3400, contributors: 200, version: '7.6.0',
        previewUrl: 'https://devtools.vuejs.org', featured: false,
      },
      {
        title: 'SingleFile', githubRepoName: 'gildas-lormeau/SingleFile', githubDefaultBranch: 'master',
        description: 'A popular browser extension (and CLI) that saves a complete, faithful copy of a web page as a single self-contained HTML file.',
        features: ['Saves full page as one HTML file', 'Works offline, no server needed', 'CLI & extension versions', 'Handles shadow DOM & lazy content'],
        techStack: [], language: 'JavaScript', licenseType: 'GPL-3.0',
        tags: ['browser-extension', 'productivity', 'archiving'], stars: 19500, forks: 1400, watchers: 180, commits: 2400, contributors: 60, version: '2.0.0',
        previewUrl: 'https://github.com/gildas-lormeau/SingleFile', featured: false,
      },
    ],
  },
  {
    category: 'Scripts & Developer Tools',
    subcategory: 'CLI Tools',
    repos: [
      {
        title: 'bat', githubRepoName: 'sharkdp/bat', githubDefaultBranch: 'master',
        description: 'A `cat` clone with syntax highlighting, Git integration, and automatic paging — a drop-in replacement for everyday terminal file viewing.',
        features: ['Syntax highlighting for 150+ languages', 'Git modification markers', 'Automatic paging', 'Line numbers & non-printable chars'],
        techStack: [], language: 'Rust', licenseType: 'MIT',
        tags: ['cli', 'terminal', 'productivity'], stars: 51000, forks: 1100, watchers: 220, commits: 2400, contributors: 350, version: '0.25.0',
        previewUrl: 'https://github.com/sharkdp/bat', featured: false,
      },
      {
        title: 'fzf', githubRepoName: 'junegunn/fzf', githubDefaultBranch: 'master',
        description: 'A general-purpose, blazing-fast command-line fuzzy finder used to interactively search files, history, processes, and more.',
        features: ['Interactive fuzzy search UI', 'Shell integrations (bash/zsh/fish)', 'Vim/Neovim plugin support', 'Preview window support'],
        techStack: [], language: 'Go', licenseType: 'MIT',
        tags: ['cli', 'terminal', 'productivity'], stars: 68000, forks: 2000, watchers: 400, commits: 2200, contributors: 250, version: '0.57.0',
        previewUrl: 'https://github.com/junegunn/fzf', featured: true,
      },
      {
        title: 'lazygit', githubRepoName: 'jesseduffield/lazygit', githubDefaultBranch: 'master',
        description: 'A simple, fast terminal UI for Git commands — stage hunks, rebase interactively, and manage branches without leaving the keyboard.',
        features: ['Interactive staging & rebase', 'Branch & stash management', 'Fully keyboard-driven', 'Custom command bindings'],
        techStack: ['Go'], language: 'Go', licenseType: 'MIT',
        tags: ['cli', 'git', 'terminal'], stars: 55000, forks: 1600, watchers: 250, commits: 3100, contributors: 250, version: '0.45.0',
        previewUrl: 'https://github.com/jesseduffield/lazygit', featured: false,
      },
      {
        title: 'ripgrep', githubRepoName: 'BurntSushi/ripgrep', githubDefaultBranch: 'master',
        description: 'An extremely fast, recursive line-oriented search tool that respects your `.gitignore` — the search backend behind many popular editors.',
        features: ['Blazing fast recursive search', 'Respects .gitignore by default', 'Unicode & regex support', 'Used inside VS Code & other editors'],
        techStack: [], language: 'Rust', licenseType: 'MIT',
        tags: ['cli', 'search', 'productivity'], stars: 49500, forks: 1900, watchers: 250, commits: 1400, contributors: 280, version: '14.1.0',
        previewUrl: 'https://github.com/BurntSushi/ripgrep', featured: false,
      },
      {
        title: 'Gum', githubRepoName: 'charmbracelet/gum', githubDefaultBranch: 'main',
        description: 'A tool for adding glamorous, interactive prompts, spinners, and menus to shell scripts — makes Bash scripts feel like real apps.',
        features: ['Interactive prompts & menus', 'Spinners & progress bars', 'Composable with any shell script', 'Beautiful default styling'],
        techStack: ['Go'], language: 'Go', licenseType: 'MIT',
        tags: ['cli', 'shell-scripting', 'terminal-ui'], stars: 17000, forks: 340, watchers: 90, commits: 700, contributors: 90, version: '0.15.0',
        previewUrl: 'https://github.com/charmbracelet/gum', featured: false,
      },
    ],
  },
  {
    category: 'Scripts & Developer Tools',
    subcategory: 'Automation & DevOps Scripts',
    repos: [
      {
        title: 'Ansible', githubRepoName: 'ansible/ansible', githubDefaultBranch: 'devel',
        description: 'A radically simple, agentless IT automation engine for configuration management, application deployment, and orchestration at scale.',
        features: ['Agentless, SSH-based', 'Idempotent YAML playbooks', 'Huge module ecosystem', 'Push-based orchestration'],
        techStack: ['Python'], language: 'Python', licenseType: 'GPL-3.0',
        tags: ['devops', 'automation', 'infrastructure'], stars: 65000, forks: 24000, watchers: 2000, commits: 60000, contributors: 6500, version: '11.1.0',
        previewUrl: 'https://www.ansible.com', featured: true,
      },
      {
        title: 'OpenTofu', githubRepoName: 'opentofu/opentofu', githubDefaultBranch: 'main',
        description: 'The community-driven, truly open-source fork of Terraform for defining and provisioning infrastructure as code, backed by the Linux Foundation.',
        features: ['Declarative infrastructure as code', 'Provider ecosystem compatible with Terraform', 'State management & plan/apply workflow', 'Community-governed under the Linux Foundation'],
        techStack: [], language: 'Go', licenseType: 'MPL-2.0',
        tags: ['devops', 'infrastructure-as-code', 'automation'], stars: 24000, forks: 950, watchers: 160, commits: 4200, contributors: 500, version: '1.9.0',
        previewUrl: 'https://opentofu.org', featured: false,
      },
      {
        title: 'Argo CD', githubRepoName: 'argoproj/argo-cd', githubDefaultBranch: 'master',
        description: 'A declarative, GitOps continuous delivery tool for Kubernetes that keeps your live cluster state in sync with a Git repository.',
        features: ['GitOps sync from Git repos', 'Kubernetes-native', 'Web UI & CLI for deployments', 'Multi-cluster management'],
        techStack: [], language: 'Go', licenseType: 'Apache-2.0',
        tags: ['devops', 'kubernetes', 'gitops'], stars: 19000, forks: 6100, watchers: 350, commits: 8600, contributors: 700, version: '2.14.0',
        previewUrl: 'https://argo-cd.readthedocs.io', featured: false,
      },
      {
        title: 'Apache Airflow', githubRepoName: 'apache/airflow', githubDefaultBranch: 'main',
        description: 'A platform to programmatically author, schedule, and monitor data pipelines and automation workflows as directed acyclic graphs (DAGs).',
        features: ['Python-defined DAGs', 'Rich scheduling & retry logic', 'Web UI for monitoring pipelines', 'Huge library of provider integrations'],
        techStack: ['Python'], language: 'Python', licenseType: 'Apache-2.0',
        tags: ['devops', 'automation', 'data-pipelines'], stars: 38000, forks: 15000, watchers: 750, commits: 25000, contributors: 3000, version: '2.10.0',
        previewUrl: 'https://airflow.apache.org', featured: false,
      },
      {
        title: 'Prefect', githubRepoName: 'prefecthq/prefect', githubDefaultBranch: 'main',
        description: 'A modern Python workflow orchestration tool for building, scheduling, and monitoring resilient data and automation pipelines.',
        features: ['Python-native workflow definitions', 'Dynamic, DAG-free workflows', 'Built-in retries & caching', 'Self-hosted or managed cloud UI'],
        techStack: ['Python'], language: 'Python', licenseType: 'Apache-2.0',
        tags: ['devops', 'automation', 'workflow-orchestration'], stars: 18500, forks: 1600, watchers: 150, commits: 12000, contributors: 350, version: '3.1.0',
        previewUrl: 'https://www.prefect.io', featured: false,
      },
    ],
  },
]

async function ensureCanonicalSeller(client) {
  const sellersRes = await client.query(
    `SELECT id, email, created_at FROM users WHERE role = 'seller' ORDER BY created_at ASC`
  )

  if (sellersRes.rowCount === 0) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10)
    const created = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'seller', TRUE) RETURNING id`,
      ['Demo Seller', CANONICAL_SELLER_EMAIL, passwordHash]
    )
    console.log(`No seller account existed — created ${CANONICAL_SELLER_EMAIL}.`)
    return created.rows[0].id
  }

  const canonical =
    sellersRes.rows.find((u) => u.email === CANONICAL_SELLER_EMAIL) || sellersRes.rows[0]

  const others = sellersRes.rows.filter((u) => u.id !== canonical.id)
  if (others.length > 0) {
    await client.query(
      `UPDATE users SET role = 'buyer' WHERE id = ANY($1::uuid[])`,
      [others.map((u) => u.id)]
    )
    console.log(`Consolidated ${others.length} extra seller account(s) down to buyer role.`)
  }

  console.log(`Canonical seller: ${canonical.email} (${canonical.id})`)
  return canonical.id
}

async function wipeCatalog(client) {
  const counts = {}
  for (const table of ['reviews', 'wishlists', 'cart_items', 'checkout_sessions', 'orders', 'products']) {
    const res = await client.query(`DELETE FROM ${table}`)
    counts[table] = res.rowCount
  }
  console.log('Wiped existing catalog:', counts)
}

async function insertCatalog(client, sellerId) {
  let inserted = 0
  for (const group of CATALOG) {
    for (const repo of group.repos) {
      await client.query(
        `INSERT INTO products (
          seller_id, title, description, price, category, subcategory,
          ai_tools, tech_stack, human_mod_level, screenshots,
          preview_url, license_type, status, tags,
          github_repo_name, github_default_branch,
          language, stars, forks, watchers, commits, contributors,
          version, features, featured
        ) VALUES (
          $1, $2, $3, 0.00, $4, $5,
          $6, $7, 'Heavily Modified', '{}',
          $8, $9, 'approved', $10,
          $11, $12,
          $13, $14, $15, $16, $17, $18,
          $19, $20, $21
        )`,
        [
          sellerId,
          repo.title,
          repo.description,
          group.category,
          group.subcategory,
          ['Other'],
          repo.techStack,
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
          Boolean(repo.featured),
        ]
      )
      inserted++
    }
  }
  console.log(`Inserted ${inserted} products across ${CATALOG.length} subcategories.`)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set (check .env.local).')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const sellerId = await ensureCanonicalSeller(client)
    await wipeCatalog(client)
    await insertCatalog(client, sellerId)
    await client.query('COMMIT')
    console.log('Catalog reseed complete.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed, rolled back:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
