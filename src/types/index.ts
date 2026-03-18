export type AITool =
  | 'ChatGPT' | 'Claude' | 'v0' | 'Bolt' | 'Lovable'
  | 'Cursor' | 'Windsurf' | 'Replit' | 'Copilot' | 'Other'

export type Category =
  | 'Website Template' | 'Landing Page' | 'Dashboard' | 'E-commerce'
  | 'SaaS' | 'Portfolio' | 'Blog' | 'Mobile App' | 'Component Library' | 'Full-Stack App'

export type TechStack =
  | 'React' | 'Next.js' | 'Vue' | 'Svelte' | 'HTML/CSS'
  | 'React Native' | 'Flutter' | 'Swift' | 'Kotlin' | 'Tailwind CSS'

export type LicenseType = 'Personal' | 'Commercial' | 'Extended Commercial'

export type HumanModLevel = 'Pure AI' | 'Lightly Edited' | 'Heavily Modified' | 'AI-Assisted'

export type ProductStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type UserRole = 'buyer' | 'seller' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
  memberSince: string
  rating?: number
  totalSales?: number
  badges?: string[]
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  category: Category
  aiTools: AITool[]
  techStack: TechStack[]
  humanModLevel: HumanModLevel
  screenshots: string[]
  previewUrl?: string
  seller: User
  rating: number
  reviewCount: number
  salesCount: number
  licenseType: LicenseType
  status: ProductStatus
  featured: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface Review {
  id: string
  productId: string
  user: User
  rating: number
  codeQuality: number
  design: number
  documentation: number
  valueForMoney: number
  comment: string
  verified: boolean
  helpful: number
  createdAt: string
  sellerResponse?: string
}

export interface Order {
  id: string
  productId: string
  product: Product
  buyerId: string
  amount: number
  licenseType: LicenseType
  licenseKey: string
  status: 'completed' | 'refunded' | 'disputed'
  createdAt: string
}

export interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalProducts: number
  totalUsers: number
  revenueChange: number
  salesChange: number
}
