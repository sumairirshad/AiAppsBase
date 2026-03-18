# 🚀 AI App Portal — Master Build Prompt

> **Suggested Names:** SynthStore · Forged.ai · PromptCraft Market · AIForge · BuildStack · Creatd.ai · AppAlchemy

---

## Project Overview

Build a **full-featured marketplace for AI-generated websites, web apps, and mobile apps** — think "Envato/ThemeForest, but exclusively for products built by AI." Sellers list products they've created using AI tools (ChatGPT, Claude, v0, Bolt, Lovable, Cursor, etc.), and buyers browse, preview, filter, and purchase them. The platform must include a **public-facing storefront** and a **private admin/internal portal**.

---

## 1. PUBLIC MARKETPLACE (Buyer Experience)

### 1.1 Homepage
- Hero section with animated showcase of featured AI-built apps
- Trending / New / Top-Rated product carousels
- Category quick-links (Websites, Web Apps, Mobile Apps, Components, Templates, Full SaaS)
- Search bar with instant suggestions and autocomplete
- "Built with [AI Tool]" filter badges prominently visible
- Trust signals: total products sold, active sellers, satisfaction rate

### 1.2 Product Listing / Browse Page
- Grid/List view toggle
- **Filters (left sidebar or top bar):**
  - Category: Website Template, Landing Page, Dashboard, E-commerce, SaaS, Portfolio, Blog, Mobile App (iOS/Android/Cross-platform), Component Library, Full-Stack App
  - AI Tool Used: ChatGPT, Claude, v0 by Vercel, Bolt.new, Lovable, Cursor, Windsurf, Replit Agent, GitHub Copilot, Other
  - Tech Stack: React, Next.js, Vue, Svelte, HTML/CSS, React Native, Flutter, Swift, Kotlin
  - Price Range: Free, $1–$10, $10–$50, $50–$100, $100+
  - Rating: 1–5 stars
  - License Type: Personal, Commercial, Extended Commercial
  - Date Added: Last 24h, Last Week, Last Month
  - Compatibility: Responsive, Dark Mode, RTL Support, Accessibility (WCAG)
- Sort by: Newest, Best Selling, Price Low→High, Price High→Low, Top Rated, Most Downloaded
- Pagination or infinite scroll

### 1.3 Product Detail Page
- Product title, seller info (avatar, name, rating, member since)
- **AI Badge:** Prominently shows which AI tool(s) were used to build it, with the AI tool's logo/icon
- Price, license options, "Add to Cart" / "Buy Now" buttons
- **Live Preview (for web products):**
  - Embedded iframe preview with device-frame toggle (Desktop / Tablet / Mobile)
  - "Open Full Preview" button → launches in new tab
- **Screenshot Gallery (for mobile apps & all products):**
  - High-res image carousel with lightbox zoom
  - Device mockup frames (iPhone, Android, iPad)
- Description (rich text with markdown support)
- Feature list / highlights
- Tech stack tags
- File structure / what's included breakdown
- Version history / changelog
- **AI Transparency Section:**
  - AI tool(s) used
  - Percentage of AI-generated vs. human-edited code (self-reported)
  - Prompt methodology (optional seller disclosure)
- Reviews & Ratings (with verified purchase badge)
- Q&A section (buyer asks, seller answers)
- Related / Similar products
- Seller's other products

### 1.4 Live Preview System (Web Products)
- Sandboxed iframe rendering of the actual product
- Device frame switcher: Desktop (1440px) / Laptop (1024px) / Tablet (768px) / Mobile (375px)
- Interaction enabled — user can click around, scroll, test the product
- "Report broken preview" button
- Loading state with skeleton screen while preview renders

### 1.5 User Accounts (Buyer Side — Envato-style)
- Registration / Login (Email, Google, GitHub OAuth)
- Dashboard:
  - Purchase history with download links
  - Saved / Wishlist items
  - Active licenses & license keys
  - Support tickets
  - Review management (edit/delete own reviews)
- Profile page (public): username, avatar, member since, reviews written
- Notification center (purchase confirmations, seller replies, product updates)
- Download manager: re-download purchased items, access updated versions

---

## 2. SELLER EXPERIENCE

### 2.1 Seller Registration & Verification
- Application to become a seller (portfolio review or auto-approve)
- Identity verification (optional tier for "Verified Seller" badge)
- Seller agreement / terms acceptance

### 2.2 Seller Dashboard
- Earnings overview: total revenue, this month, pending payouts, available balance
- Sales analytics: units sold, revenue chart (daily/weekly/monthly), conversion rate, page views
- Product management:
  - Add New Product (multi-step form):
    1. **Basic Info:** Title, description, category, tags
    2. **AI Disclosure:** Which AI tool(s) used, AI contribution level
    3. **Tech Details:** Tech stack, framework, dependencies, browser/device compatibility
    4. **Media:** Upload screenshots, demo video (optional), set preview URL for live preview
    5. **Files:** Upload product ZIP, define file structure
    6. **Pricing:** Set price, choose license tiers (Regular / Extended), free option
    7. **Review & Submit** → goes to admin review queue
  - Edit / Update existing products (new version upload triggers buyer notification)
  - Pause / Unpublish products
- Review management: respond to buyer reviews
- Q&A management: answer buyer questions
- Payout settings: PayPal, Stripe, bank transfer
- Seller profile customization: bio, avatar, social links, portfolio URL

### 2.3 Seller Storefront
- Custom seller page: banner, bio, product grid
- Seller rating aggregate
- "Follow this seller" button for buyers
- Seller badges: Top Seller, Verified, Power Author, Rising Star

---

## 3. INTERNAL ADMIN PORTAL

### 3.1 Dashboard
- Platform KPIs: GMV, total users, active sellers, new signups, revenue (platform commission)
- Real-time activity feed: new submissions, purchases, reviews, support tickets
- Charts: revenue trends, user growth, category distribution, top AI tools used

### 3.2 Product Management
- Submission review queue with approve / reject / request changes workflow
- Bulk actions: feature, unfeature, suspend, remove
- Content moderation: flagged products, reported previews
- Quality scoring system (code quality, preview functionality, asset completeness)

### 3.3 User Management
- User list with search, filter (buyers, sellers, admins), and role management
- User detail view: activity log, purchase history, products, earnings, support history
- Ban / Suspend / Warn actions with reason logging
- Seller tier management (manual promotion/demotion)

### 3.4 Financial Management
- Transaction ledger: all purchases with buyer, seller, product, amount, commission, date
- Commission settings: global rate, per-category rates, seller-tier rates
- Payout management: pending payouts, payout history, manual payout trigger
- Refund processing with dispute workflow
- Tax reporting / 1099 generation

### 3.5 Content & Marketing
- Featured products / collections curation
- Banner / homepage carousel management
- Email campaign triggers (new product alerts, sale events, welcome series)
- Coupon / promo code system (percentage off, fixed amount, free product)
- SEO management: meta tags, sitemap, structured data controls

### 3.6 Platform Settings
- Category / tag taxonomy management
- AI tool registry (add new AI tools as they emerge, with logos)
- License template management
- Commission structure configuration
- Email template editor
- Review moderation rules (auto-approve threshold, spam detection)

### 3.7 Analytics & Reports
- Revenue reports (by period, category, seller, AI tool)
- User funnel: signup → browse → purchase conversion
- Product performance: views, conversion, refund rate
- AI tool popularity trends (which AI tools generate the most products/revenue)
- Exportable reports (CSV, PDF)

### 3.8 Support System
- Ticket management (buyer complaints, seller disputes, refund requests)
- Canned responses library
- Escalation workflow
- SLA tracking

---

## 4. CROSS-CUTTING FEATURES

### 4.1 Search & Discovery
- Full-text search across product titles, descriptions, tags
- AI-powered search suggestions ("apps like Notion built with Claude")
- Tag-based browsing
- "Similar to this" recommendations (collaborative filtering)
- Recently viewed products

### 4.2 AI Transparency System
- Every product displays a standardized "AI Build Card":
  - Primary AI tool used (with logo)
  - Secondary tools (if any)
  - Human modification level: Pure AI / Lightly Edited / Heavily Modified / AI-Assisted
  - Framework auto-detected from uploaded code (if possible)
- Filterable and sortable by AI tool across the marketplace
- AI tool comparison page: "Products built with ChatGPT vs. Claude vs. v0"

### 4.3 Review & Rating System
- 5-star rating with sub-categories: Code Quality, Design, Documentation, Value for Money
- Written reviews with verified purchase badge
- Helpful vote system
- Seller response capability
- Review moderation (spam, abuse detection)

### 4.4 Licensing & Delivery
- License tiers: Regular (single project), Extended (multiple projects / SaaS use)
- License key generation and validation
- Instant digital delivery (ZIP download after purchase)
- Version updates: buyers get notified and can re-download

### 4.5 Notifications
- In-app notification center
- Email notifications (configurable per user):
  - Purchase confirmation
  - New review on your product
  - Product update available
  - Seller answer to your question
  - Payout processed
  - Admin actions (product approved/rejected)

### 4.6 Responsive Design
- Fully responsive across all breakpoints
- Mobile-optimized browse and purchase flow
- Touch-friendly preview system

---

## 5. TECH STACK RECOMMENDATION

| Layer | Suggestion |
|---|---|
| Frontend | Next.js 14+ (App Router) with TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand or React Query |
| Auth | NextAuth.js / Clerk |
| Database | PostgreSQL (via Supabase or PlanetScale) |
| ORM | Prisma or Drizzle |
| Storage | AWS S3 / Cloudflare R2 (product files, screenshots) |
| Payments | Stripe Connect (marketplace payouts) |
| Search | Meilisearch or Algolia |
| Preview | Sandboxed iframe with CSP headers |
| Admin | Custom React dashboard or Refine.dev |
| Email | Resend or SendGrid |
| CDN | Cloudflare |
| Hosting | Vercel or AWS |

---

## 6. DESIGN DIRECTION

- **Aesthetic:** Dark-mode-first, premium, modern — inspired by Gumroad meets Envato meets Vercel's design language
- **Typography:** Clean geometric sans-serif (e.g., Satoshi, General Sans, Cabinet Grotesk)
- **Color:** Deep charcoal/navy base, vibrant accent (electric blue, neon green, or warm amber), with AI tool brand colors used contextually on badges
- **Cards:** Glassmorphism or subtle depth with hover-lift animations
- **Micro-interactions:** Smooth transitions, skeleton loaders, toast notifications, preview zoom effects
- **AI Badge Design:** Pill-shaped badges with AI tool logo + name, color-coded per tool

---

## 7. MVP PRIORITY ORDER

1. ✅ Auth system (buyer + seller accounts)
2. ✅ Product upload flow with AI disclosure
3. ✅ Product listing with filters and search
4. ✅ Product detail page with screenshot gallery
5. ✅ Live preview system (iframe-based)
6. ✅ Shopping cart + Stripe checkout
7. ✅ Buyer dashboard (purchases, downloads)
8. ✅ Seller dashboard (products, earnings)
9. ✅ Admin portal (submissions, users, finances)
10. ✅ Reviews and ratings
11. 🔜 Advanced search + recommendations
12. 🔜 Email notifications
13. 🔜 Analytics deep-dive
