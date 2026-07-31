/**
 * Navigation + footer information architecture.
 * Single source of truth for the navbar mega-menu and the footer.
 */

export type NavLink = { label: string; href: string; description?: string; icon?: string; badge?: string }
export type NavColumn = { title: string; items: NavLink[] }
export type MegaMenu = { label: string; columns: NavColumn[]; featured?: NavLink }

export const megaMenus: MegaMenu[] = [
  {
    label: 'Marketplace',
    featured: {
      label: 'Explore the marketplace',
      href: '/products',
      description: '12,400+ production-ready projects, repos, and templates from verified creators.',
      icon: 'Sparkles',
    },
    columns: [
      {
        title: 'Discover',
        items: [
          { label: 'Browse all', href: '/products', description: 'The full catalog', icon: 'LayoutGrid' },
          { label: 'Trending', href: '/products?sort=trending', description: 'Hot this week', icon: 'Flame' },
          { label: 'New arrivals', href: '/products?sort=new', description: 'Fresh listings', icon: 'Sparkles' },
          { label: 'Featured', href: '/products?featured=true', description: 'Editor picks', icon: 'Star' },
          { label: 'Top sellers', href: '/top-sellers', description: 'Best creators', icon: 'Trophy' },
          { label: 'Premium', href: '/products?tier=premium', description: 'Best-in-class', icon: 'Crown' },
        ],
      },
      {
        title: 'Categories',
        items: [
          { label: 'Websites', href: '/templates', icon: 'LayoutTemplate' },
          { label: 'Web Apps & SaaS', href: '/apps', icon: 'Layers' },
          { label: 'AI Projects', href: '/ai-projects', icon: 'Bot' },
          { label: 'E-commerce', href: '/ecommerce', icon: 'ShoppingBag' },
          { label: 'Mobile Apps', href: '/mobile-apps', icon: 'Smartphone' },
          { label: 'Components & UI Kits', href: '/components', icon: 'Component' },
          { label: 'Browser Extensions', href: '/browser-extensions', icon: 'Puzzle' },
          { label: 'Scripts & Developer Tools', href: '/developer-tools', icon: 'Terminal' },
        ],
      },
    ],
  },
  {
    label: 'Technologies',
    columns: [
      {
        title: 'Frontend',
        items: [
          { label: 'React', href: '/products?tech=React', icon: 'Atom' },
          { label: 'Next.js', href: '/products?tech=Next.js', icon: 'Triangle' },
          { label: 'Vue', href: '/products?tech=Vue', icon: 'Component' },
          { label: 'Svelte', href: '/products?tech=Svelte', icon: 'Flame' },
        ],
      },
      {
        title: 'Backend',
        items: [
          { label: 'Node.js', href: '/products?tech=Node.js', icon: 'Hexagon' },
          { label: 'Python', href: '/products?tech=Python', icon: 'Code2' },
          { label: 'Django', href: '/products?tech=Django', icon: 'Server' },
          { label: 'Laravel', href: '/products?tech=Laravel', icon: 'Server' },
        ],
      },
      {
        title: 'Mobile & CMS',
        items: [
          { label: 'Flutter', href: '/products?tech=Flutter', icon: 'Smartphone' },
          { label: 'React Native', href: '/products?tech=React+Native', icon: 'Smartphone' },
          { label: 'WordPress', href: '/products?tech=WordPress', icon: 'Globe' },
          { label: 'Shopify', href: '/products?tech=Shopify', icon: 'ShoppingBag' },
        ],
      },
    ],
  },
  {
    label: 'Resources',
    columns: [
      {
        title: 'Learn',
        items: [
          { label: 'Documentation', href: '/docs', description: 'Guides & references', icon: 'BookOpen' },
          { label: 'API', href: '/api-docs', description: 'Build with our API', icon: 'Terminal' },
          { label: 'Blog', href: '/blog', description: 'News & tutorials', icon: 'Newspaper' },
          { label: 'Best AI Coding Tools', href: '/best-ai-coding-tools', description: 'Compare ChatGPT, Claude & more', icon: 'Sparkles' },
          { label: 'Changelog', href: '/changelog', description: "What's new", icon: 'GitCommitHorizontal' },
        ],
      },
      {
        title: 'Connect',
        items: [
          { label: 'Community', href: '/community', description: 'Join the conversation', icon: 'Users' },
          { label: 'Support', href: '/support', description: 'Get help fast', icon: 'LifeBuoy' },
          { label: 'Roadmap', href: '/roadmap', description: "Where we're headed", icon: 'Map' },
          { label: 'Status', href: '/status', description: 'System health', icon: 'Activity' },
        ],
      },
    ],
  },
  {
    label: 'Company',
    columns: [
      {
        title: 'Company',
        items: [
          { label: 'About', href: '/about', icon: 'Info' },
          { label: 'Careers', href: '/careers', icon: 'Briefcase', badge: 'Hiring' },
          { label: 'Enterprise', href: '/enterprise', icon: 'Building2' },
          { label: 'Contact', href: '/contact', icon: 'Mail' },
        ],
      },
      {
        title: 'Programs',
        items: [
          { label: 'Partners', href: '/partners', icon: 'Handshake' },
          { label: 'Affiliates', href: '/affiliates', icon: 'Share2' },
          { label: 'Become a seller', href: '/auth/register', icon: 'Store' },
          { label: 'Press', href: '/press', icon: 'Megaphone' },
        ],
      },
    ],
  },
]

export const simpleNavLinks: NavLink[] = [{ label: 'Pricing', href: '/pricing' }]

/* -------------------------------- Footer -------------------------------- */

export const footerColumns: NavColumn[] = [
  {
    title: 'Marketplace',
    items: [
      { label: 'Browse all', href: '/products' },
      { label: 'Trending', href: '/products?sort=trending' },
      { label: 'New arrivals', href: '/products?sort=new' },
      { label: 'Featured', href: '/products?featured=true' },
      { label: 'Top sellers', href: '/top-sellers' },
      { label: 'Become a seller', href: '/auth/register' },
    ],
  },
  {
    title: 'Categories',
    items: [
      { label: 'Website templates', href: '/templates' },
      { label: 'Web apps & SaaS', href: '/apps' },
      { label: 'AI projects', href: '/ai-projects' },
      { label: 'E-commerce', href: '/ecommerce' },
      { label: 'Mobile apps', href: '/mobile-apps' },
      { label: 'Components & UI kits', href: '/components' },
      { label: 'Browser extensions', href: '/browser-extensions' },
      { label: 'Developer tools', href: '/developer-tools' },
    ],
  },
  {
    title: 'Product',
    items: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Enterprise', href: '/enterprise' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'API', href: '/api-docs' },
      { label: 'Documentation', href: '/docs' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press', href: '/press' },
      { label: 'Partners', href: '/partners' },
      { label: 'Affiliates', href: '/affiliates' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Help Center', href: '/support' },
      { label: 'Community', href: '/community' },
      { label: 'Best AI coding tools', href: '/best-ai-coding-tools' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Status', href: '/status' },
      { label: 'Contact', href: '/contact' },
      { label: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'License', href: '/license' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'DMCA', href: '/dmca' },
    ],
  },
]

export const footerLegalBar: NavLink[] = [
  { label: 'Security', href: '/security' },
  { label: 'Trust Center', href: '/trust' },
  { label: 'GDPR', href: '/gdpr' },
  { label: 'Accessibility', href: '/accessibility' },
]

export const socialLinks: NavLink[] = [
  { label: 'GitHub', href: 'https://github.com', icon: 'Github' },
  { label: 'X', href: 'https://x.com', icon: 'Twitter' },
  { label: 'Discord', href: 'https://discord.com', icon: 'MessageCircle' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'Linkedin' },
  { label: 'YouTube', href: 'https://youtube.com', icon: 'Youtube' },
]
