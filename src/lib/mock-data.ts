import { Product, User, Review, Order, DashboardStats } from '@/types'

export const mockUsers: User[] = [
  {
    id: '1', name: 'Alex Chen', email: 'alex@example.com',
    avatar: '/avatars/1.jpg', role: 'seller', memberSince: '2024-01-15',
    rating: 4.9, totalSales: 1243, badges: ['Top Seller', 'Verified'],
  },
  {
    id: '2', name: 'Sarah Kim', email: 'sarah@example.com',
    avatar: '/avatars/2.jpg', role: 'seller', memberSince: '2024-03-20',
    rating: 4.7, totalSales: 856, badges: ['Power Author'],
  },
  {
    id: '3', name: 'James Miller', email: 'james@example.com',
    avatar: '/avatars/3.jpg', role: 'seller', memberSince: '2024-06-10',
    rating: 4.5, totalSales: 312, badges: ['Rising Star'],
  },
  {
    id: '4', name: 'Emma Davis', email: 'emma@example.com',
    avatar: '/avatars/4.jpg', role: 'buyer', memberSince: '2024-08-01',
    rating: undefined, totalSales: undefined,
  },
]

export const mockProducts: Product[] = [
  {
    id: '1', title: 'SaaS Dashboard Pro',
    description: 'A comprehensive SaaS analytics dashboard built with Next.js and Tailwind CSS. Features real-time charts, user management, billing integration, and a beautiful dark mode design. Includes 50+ pre-built components and 10 page templates.',
    price: 49, category: 'Dashboard', aiTools: ['Claude', 'v0'],
    techStack: ['Next.js', 'React', 'Tailwind CSS'],
    humanModLevel: 'Lightly Edited', screenshots: ['/screenshots/saas-1.jpg', '/screenshots/saas-2.jpg', '/screenshots/saas-3.jpg'],
    previewUrl: 'https://example.com/preview/saas-dashboard',
    seller: mockUsers[0], rating: 4.8, reviewCount: 128, salesCount: 843,
    licenseType: 'Commercial', status: 'approved', featured: true,
    createdAt: '2024-11-15T10:00:00Z', updatedAt: '2025-01-20T14:30:00Z',
    tags: ['dashboard', 'analytics', 'saas', 'admin', 'charts'],
  },
  {
    id: '2', title: 'E-Commerce Starter Kit',
    description: 'Complete e-commerce solution with product catalog, shopping cart, checkout flow, and admin panel. Built entirely with AI assistance using modern web technologies.',
    price: 79, category: 'E-commerce', aiTools: ['ChatGPT', 'Cursor'],
    techStack: ['Next.js', 'React', 'Tailwind CSS'],
    humanModLevel: 'Heavily Modified', screenshots: ['/screenshots/ecom-1.jpg', '/screenshots/ecom-2.jpg'],
    previewUrl: 'https://example.com/preview/ecommerce',
    seller: mockUsers[1], rating: 4.6, reviewCount: 95, salesCount: 621,
    licenseType: 'Extended Commercial', status: 'approved', featured: true,
    createdAt: '2024-12-01T08:00:00Z', updatedAt: '2025-02-15T09:00:00Z',
    tags: ['ecommerce', 'shop', 'store', 'cart', 'payments'],
  },
  {
    id: '3', title: 'Portfolio Template — Minimal',
    description: 'Clean, minimal portfolio template perfect for designers and developers. Features smooth animations, project showcase grid, and contact form.',
    price: 19, category: 'Portfolio', aiTools: ['v0'],
    techStack: ['Next.js', 'Tailwind CSS'],
    humanModLevel: 'Pure AI', screenshots: ['/screenshots/portfolio-1.jpg'],
    seller: mockUsers[2], rating: 4.4, reviewCount: 67, salesCount: 445,
    licenseType: 'Personal', status: 'approved', featured: false,
    createdAt: '2025-01-10T12:00:00Z', updatedAt: '2025-01-10T12:00:00Z',
    tags: ['portfolio', 'minimal', 'personal', 'designer'],
  },
  {
    id: '4', title: 'AI Chat Interface',
    description: 'A sleek ChatGPT-style chat interface with streaming responses, conversation history, and markdown rendering. Ready to connect to any LLM API.',
    price: 39, category: 'Full-Stack App', aiTools: ['Claude', 'Bolt'],
    techStack: ['React', 'Next.js', 'Tailwind CSS'],
    humanModLevel: 'AI-Assisted', screenshots: ['/screenshots/chat-1.jpg', '/screenshots/chat-2.jpg'],
    previewUrl: 'https://example.com/preview/ai-chat',
    seller: mockUsers[0], rating: 4.9, reviewCount: 203, salesCount: 1102,
    licenseType: 'Commercial', status: 'approved', featured: true,
    createdAt: '2024-10-20T15:00:00Z', updatedAt: '2025-03-01T11:00:00Z',
    tags: ['chat', 'ai', 'llm', 'chatbot', 'streaming'],
  },
  {
    id: '5', title: 'Landing Page Builder',
    description: 'Drag-and-drop landing page builder with 20+ section templates. Export clean HTML/CSS or React components.',
    price: 59, category: 'Landing Page', aiTools: ['Lovable', 'ChatGPT'],
    techStack: ['React', 'Tailwind CSS'],
    humanModLevel: 'Heavily Modified', screenshots: ['/screenshots/landing-1.jpg'],
    seller: mockUsers[1], rating: 4.3, reviewCount: 41, salesCount: 287,
    licenseType: 'Commercial', status: 'approved', featured: false,
    createdAt: '2025-02-01T09:00:00Z', updatedAt: '2025-02-20T16:00:00Z',
    tags: ['landing', 'builder', 'drag-drop', 'marketing'],
  },
  {
    id: '6', title: 'Blog Platform — Headless CMS',
    description: 'Modern blog platform with headless CMS integration, MDX support, SEO optimization, and RSS feed generation.',
    price: 29, category: 'Blog', aiTools: ['Cursor', 'Copilot'],
    techStack: ['Next.js', 'React', 'Tailwind CSS'],
    humanModLevel: 'Lightly Edited', screenshots: ['/screenshots/blog-1.jpg', '/screenshots/blog-2.jpg'],
    seller: mockUsers[2], rating: 4.5, reviewCount: 78, salesCount: 534,
    licenseType: 'Personal', status: 'approved', featured: false,
    createdAt: '2024-11-28T07:00:00Z', updatedAt: '2025-01-15T10:00:00Z',
    tags: ['blog', 'cms', 'mdx', 'seo', 'content'],
  },
  {
    id: '7', title: 'Mobile Fitness Tracker',
    description: 'Cross-platform fitness tracking app with workout plans, progress charts, and social features. Built with React Native.',
    price: 89, category: 'Mobile App', aiTools: ['ChatGPT', 'Replit'],
    techStack: ['React Native', 'Tailwind CSS'],
    humanModLevel: 'AI-Assisted', screenshots: ['/screenshots/fitness-1.jpg'],
    seller: mockUsers[0], rating: 4.7, reviewCount: 56, salesCount: 198,
    licenseType: 'Extended Commercial', status: 'approved', featured: true,
    createdAt: '2025-01-05T14:00:00Z', updatedAt: '2025-03-10T08:00:00Z',
    tags: ['mobile', 'fitness', 'health', 'tracker', 'react-native'],
  },
  {
    id: '8', title: 'Component Library — Glassmorphism',
    description: '80+ glassmorphism-styled UI components for React. Includes buttons, cards, modals, forms, tables, and more.',
    price: 0, category: 'Component Library', aiTools: ['v0', 'Claude'],
    techStack: ['React', 'Tailwind CSS'],
    humanModLevel: 'Pure AI', screenshots: ['/screenshots/glass-1.jpg', '/screenshots/glass-2.jpg'],
    seller: mockUsers[1], rating: 4.2, reviewCount: 234, salesCount: 3421,
    licenseType: 'Personal', status: 'approved', featured: false,
    createdAt: '2024-09-15T11:00:00Z', updatedAt: '2024-12-01T13:00:00Z',
    tags: ['components', 'ui', 'glassmorphism', 'library', 'free'],
  },
  {
    id: '9', title: 'Website Template — Agency',
    description: 'Stunning agency website template with team showcase, case studies, testimonials, and contact sections. Fully responsive.',
    price: 35, category: 'Website Template', aiTools: ['Bolt', 'Windsurf'],
    techStack: ['HTML/CSS', 'Tailwind CSS'],
    humanModLevel: 'Lightly Edited', screenshots: ['/screenshots/agency-1.jpg'],
    seller: mockUsers[2], rating: 4.6, reviewCount: 89, salesCount: 612,
    licenseType: 'Commercial', status: 'approved', featured: false,
    createdAt: '2024-12-20T10:00:00Z', updatedAt: '2025-02-10T15:00:00Z',
    tags: ['agency', 'business', 'corporate', 'template'],
  },
]

export const mockReviews: Review[] = [
  {
    id: '1', productId: '1', user: mockUsers[3],
    rating: 5, codeQuality: 5, design: 5, documentation: 4, valueForMoney: 5,
    comment: 'Incredible dashboard template! The code quality is top-notch and it was super easy to customize. The dark mode looks amazing.',
    verified: true, helpful: 23, createdAt: '2025-01-25T10:00:00Z',
    sellerResponse: 'Thank you so much for the kind review! Glad you enjoyed it.',
  },
  {
    id: '2', productId: '1', user: mockUsers[1],
    rating: 4, codeQuality: 4, design: 5, documentation: 3, valueForMoney: 4,
    comment: 'Great design and components. Documentation could be more detailed but overall a solid product.',
    verified: true, helpful: 12, createdAt: '2025-02-10T14:00:00Z',
  },
  {
    id: '3', productId: '4', user: mockUsers[3],
    rating: 5, codeQuality: 5, design: 5, documentation: 5, valueForMoney: 5,
    comment: 'Best chat interface I have found. The streaming implementation is flawless and the UI is beautiful.',
    verified: true, helpful: 45, createdAt: '2025-02-28T09:00:00Z',
  },
]

export const mockOrders: Order[] = [
  {
    id: 'ORD-001', productId: '1', product: mockProducts[0], buyerId: '4',
    amount: 49, licenseType: 'Commercial', licenseKey: 'ABCD-EFGH-IJKL-MNOP',
    status: 'completed', createdAt: '2025-01-25T10:00:00Z',
  },
  {
    id: 'ORD-002', productId: '4', product: mockProducts[3], buyerId: '4',
    amount: 39, licenseType: 'Commercial', licenseKey: 'QRST-UVWX-YZ12-3456',
    status: 'completed', createdAt: '2025-02-28T09:00:00Z',
  },
  {
    id: 'ORD-003', productId: '8', product: mockProducts[7], buyerId: '4',
    amount: 0, licenseType: 'Personal', licenseKey: '7890-ABCD-EFGH-IJKL',
    status: 'completed', createdAt: '2025-03-05T12:00:00Z',
  },
]

export const mockDashboardStats: DashboardStats = {
  totalRevenue: 284750,
  totalSales: 8432,
  totalProducts: 1247,
  totalUsers: 15680,
  revenueChange: 12.5,
  salesChange: 8.3,
}

export const aiToolColors: Record<string, string> = {
  'ChatGPT': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Claude': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'v0': 'bg-white/20 text-white border-white/30',
  'Bolt': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Lovable': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Cursor': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Windsurf': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Replit': 'bg-orange-600/20 text-orange-300 border-orange-600/30',
  'Copilot': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}
