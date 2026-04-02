# Mini Shopee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Shopee-like affiliate mini web app with public product grid, click tracking, and admin dashboard.

**Architecture:** Single Next.js 14 App Router monorepo — public site, admin dashboard, and REST API in one Vercel deployment. Prisma ORM connects to Supabase PostgreSQL. Admin auth via HMAC-signed HttpOnly cookie, verified in middleware.

**Tech Stack:** Next.js 14, TypeScript, TailwindCSS, Prisma, Supabase (PostgreSQL), Node.js `crypto` (no external auth libs)

---

## File Map

| File | Responsibility |
|------|---------------|
| `prisma/schema.prisma` | Product model definition |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/auth.ts` | HMAC cookie sign/verify + session check |
| `middleware.ts` | Protect `/admin/*` routes via cookie |
| `app/layout.tsx` | Root HTML layout + metadata |
| `app/page.tsx` | Public homepage — server component, fetches products |
| `app/go/[id]/route.ts` | Redirect tracker — increment clickCount + 302 redirect |
| `app/api/auth/login/route.ts` | POST login — verify creds, set signed cookie |
| `app/api/auth/logout/route.ts` | POST logout — clear cookie |
| `app/api/products/route.ts` | GET all products + POST create (auth required) |
| `app/api/products/[id]/route.ts` | PUT update + DELETE product (auth required) |
| `app/admin/login/page.tsx` | Admin login form (client component) |
| `app/admin/page.tsx` | Admin dashboard — server component, product table |
| `app/admin/products/new/page.tsx` | Create product page |
| `app/admin/products/[id]/edit/page.tsx` | Edit product page — server component, pre-fills form |
| `components/ProductCard.tsx` | Single product card (image, name, price, category) |
| `components/ProductGrid.tsx` | Client component — search + category filter + grid |
| `components/admin/LogoutButton.tsx` | Client component — calls logout API + redirects |
| `components/admin/ProductTable.tsx` | Client component — table with edit/delete actions |
| `components/admin/ProductForm.tsx` | Client component — shared create/edit form |
| `next.config.js` | Disable image optimization warning for external URLs |
| `.env.example` | Template for required environment variables |

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: all project files via CLI

- [ ] **Step 1: Scaffold Next.js 14 app with TypeScript + Tailwind**

```bash
cd /Users/longtruong
npx create-next-app@14 mini_shopee --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

When prompted:
- Would you like to use ESLint? → Yes
- Would you like to customize the default import alias? → No (use `@/*`)

- [ ] **Step 2: Install Prisma + Jest dependencies**

```bash
cd /Users/longtruong/mini_shopee
npm install prisma @prisma/client
npm install --save-dev jest @types/jest ts-jest jest-environment-node
```

- [ ] **Step 3: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected output: `✔ Your Prisma schema was created at prisma/schema.prisma`

- [ ] **Step 4: Create Jest config**

Create `jest.config.js`:

```js
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Server running on http://localhost:3000. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js 14 project with Prisma and Jest"
```

---

## Task 2: Prisma Schema + DB Client

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Write schema.prisma**

Replace entire content of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Product {
  id           String   @id @default(cuid())
  name         String
  imageUrl     String
  price        Float
  affiliateUrl String
  category     String
  clickCount   Int      @default(0)
  createdAt    DateTime @default(now())
}
```

Note: Supabase requires both `DATABASE_URL` (pooled, for Prisma queries) and `DIRECT_URL` (direct connection, for migrations). You'll fill these in `.env.local` from the Supabase dashboard → Project Settings → Database → Connection string.

- [ ] **Step 2: Write lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: Create .env.local from example (do this before pushing schema)**

Create `.env.local`:

```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="changeme123"
COOKIE_SECRET="a-random-32-char-secret-change-me!!"
```

Get the actual connection strings from: Supabase dashboard → your project → Project Settings → Database → Connection string → Transaction mode (for DATABASE_URL) and Session mode (for DIRECT_URL).

- [ ] **Step 4: Push schema to Supabase**

```bash
npx prisma db push
```

Expected output: `✔ Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 6: Commit**

```bash
git add prisma/ lib/prisma.ts
git commit -m "feat: add Prisma schema and client singleton"
```

---

## Task 3: Auth Utilities (TDD)

**Files:**
- Create: `lib/auth.ts`
- Create: `__tests__/lib/auth.test.ts`

- [ ] **Step 1: Create test directory and write failing tests**

```bash
mkdir -p __tests__/lib
```

Create `__tests__/lib/auth.test.ts`:

```typescript
process.env.COOKIE_SECRET = 'test-secret-32-chars-long-minimum!!'

import { signValue, unsignValue, isValidSession } from '@/lib/auth'

describe('signValue', () => {
  it('returns a string with a dot separator', () => {
    const signed = signValue('hello')
    expect(signed).toContain('.')
    expect(signed.startsWith('hello.')).toBe(true)
  })
})

describe('unsignValue', () => {
  it('returns original value for a correctly signed string', () => {
    const signed = signValue('authenticated')
    expect(unsignValue(signed)).toBe('authenticated')
  })

  it('returns null for a tampered signature', () => {
    const signed = signValue('authenticated')
    const tampered = signed.slice(0, -3) + 'xxx'
    expect(unsignValue(tampered)).toBeNull()
  })

  it('returns null for a string with no dot', () => {
    expect(unsignValue('noseparator')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(unsignValue('')).toBeNull()
  })
})

describe('isValidSession', () => {
  it('returns true for a valid admin_session cookie', () => {
    const signed = signValue('authenticated')
    const cookieHeader = `admin_session=${encodeURIComponent(signed)}`
    expect(isValidSession(cookieHeader)).toBe(true)
  })

  it('returns false when cookie header is null', () => {
    expect(isValidSession(null)).toBe(false)
  })

  it('returns false when admin_session cookie is missing', () => {
    expect(isValidSession('other_cookie=value')).toBe(false)
  })

  it('returns false when admin_session cookie has invalid signature', () => {
    expect(isValidSession('admin_session=tampered.badhash')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/auth.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/auth'`

- [ ] **Step 3: Implement lib/auth.ts**

```typescript
import crypto from 'crypto'

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET
  if (!secret) throw new Error('COOKIE_SECRET environment variable is not set')
  return secret
}

export function signValue(value: string): string {
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('hex')
  return `${value}.${sig}`
}

export function unsignValue(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null

  const value = signed.substring(0, lastDot)
  const sig = signed.substring(lastDot + 1)
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('hex')

  if (sig.length !== expected.length) return null
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  return value
}

export function isValidSession(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false

  const cookies: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    const key = part.substring(0, eqIdx).trim()
    const val = part.substring(eqIdx + 1).trim()
    cookies[key] = val
  }

  const signed = cookies['admin_session']
  if (!signed) return false

  return unsignValue(decodeURIComponent(signed)) === 'authenticated'
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/auth.test.ts --no-coverage
```

Expected: PASS — 8 tests passed

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts __tests__/ jest.config.js
git commit -m "feat: add HMAC cookie auth utilities with tests"
```

---

## Task 4: Middleware (Admin Route Protection)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write middleware.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isValidSession } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const cookieHeader = request.headers.get('cookie')
  if (!isValidSession(cookieHeader)) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: Manually verify middleware works**

Start the dev server: `npm run dev`

Visit http://localhost:3000/admin — you should be redirected to http://localhost:3000/admin/login

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware to protect /admin/* routes"
```

---

## Task 5: Auth API Routes

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p app/api/auth/login app/api/auth/logout
```

- [ ] **Step 2: Write login route**

Create `app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { signValue } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  if (
    !username ||
    !password ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const signed = signValue('authenticated')
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}
```

- [ ] **Step 3: Write logout route**

Create `app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('admin_session')
  return response
}
```

- [ ] **Step 4: Test login with curl**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme123"}' \
  -i | head -20
```

Expected: HTTP 200 with `Set-Cookie: admin_session=...`

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}' \
  -i | head -5
```

Expected: HTTP 401 `{"error":"Invalid credentials"}`

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/
git commit -m "feat: add login and logout API routes"
```

---

## Task 6: Products API Routes

**Files:**
- Create: `app/api/products/route.ts`
- Create: `app/api/products/[id]/route.ts`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p app/api/products/\[id\]
```

- [ ] **Step 2: Write GET + POST route**

Create `app/api/products/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  if (!isValidSession(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { name, imageUrl, price, affiliateUrl, category } = body

  if (!name || !imageUrl || price === undefined || !affiliateUrl || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name: String(name),
      imageUrl: String(imageUrl),
      price: parseFloat(String(price)),
      affiliateUrl: String(affiliateUrl),
      category: String(category),
    },
  })

  return NextResponse.json(product, { status: 201 })
}
```

- [ ] **Step 3: Write PUT + DELETE route**

Create `app/api/products/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isValidSession(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { name, imageUrl, price, affiliateUrl, category } = body

  if (!name || !imageUrl || price === undefined || !affiliateUrl || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: String(name),
      imageUrl: String(imageUrl),
      price: parseFloat(String(price)),
      affiliateUrl: String(affiliateUrl),
      category: String(category),
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isValidSession(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.product.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Test GET products**

```bash
curl -s http://localhost:3000/api/products | head -5
```

Expected: `[]` (empty array, DB is empty)

- [ ] **Step 5: Commit**

```bash
git add app/api/products/
git commit -m "feat: add products CRUD API routes"
```

---

## Task 7: Redirect Tracking Route

**Files:**
- Create: `app/go/[id]/route.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "app/go/[id]"
```

- [ ] **Step 2: Write redirect route**

Create `app/go/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  await prisma.product.update({
    where: { id: params.id },
    data: { clickCount: { increment: 1 } },
  })

  return NextResponse.redirect(product.affiliateUrl, { status: 302 })
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/go/"
git commit -m "feat: add redirect tracking route with clickCount increment"
```

---

## Task 8: Public Components

**Files:**
- Create: `components/ProductCard.tsx`
- Create: `components/ProductGrid.tsx`

- [ ] **Step 1: Create components directory**

```bash
mkdir -p components
```

- [ ] **Step 2: Write ProductCard**

Create `components/ProductCard.tsx`:

```typescript
import Link from 'next/link'

interface Product {
  id: string
  name: string
  imageUrl: string
  price: number
  category: string
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/go/${product.id}`}
      className="group block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-3">
        <span className="inline-block text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full mb-1">
          {product.category}
        </span>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-orange-500 font-bold text-base">
          ₫{product.price.toLocaleString('vi-VN')}
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Write ProductGrid**

Create `components/ProductGrid.tsx`:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { ProductCard } from './ProductCard'

interface Product {
  id: string
  name: string
  imageUrl: string
  price: number
  category: string
  affiliateUrl: string
  clickCount: number
  createdAt: string
}

export function ProductGrid({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category))).sort()
    return ['Tất cả', ...cats]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesCategory =
        activeCategory === 'Tất cả' || p.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, activeCategory])

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-sm"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product count */}
      <p className="text-sm text-gray-400 mb-4">
        {filtered.length} sản phẩm
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>Không tìm thấy sản phẩm phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ProductCard.tsx components/ProductGrid.tsx
git commit -m "feat: add ProductCard and ProductGrid components"
```

---

## Task 9: App Layout + Homepage

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update app/layout.tsx**

Replace entire content of `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'Mini Shopee — Khuyến mãi hàng ngày',
  description: 'Tổng hợp sản phẩm affiliate giá tốt nhất',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Update app/globals.css**

Replace entire content of `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
}
```

- [ ] **Step 3: Write homepage**

Replace entire content of `app/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductGrid'

export const revalidate = 0

export default async function HomePage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Serialize dates for client component
  const serialized = JSON.parse(JSON.stringify(products))

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Mini Shopee</h1>
            <p className="text-orange-100 text-xs">Khuyến mãi tốt nhất mỗi ngày</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <ProductGrid products={serialized} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verify homepage renders**

```bash
npm run dev
```

Visit http://localhost:3000 — should show the header and empty product grid with search + "Tất cả" category tab.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css app/page.tsx
git commit -m "feat: add homepage with product grid, search, and category filter"
```

---

## Task 10: Admin Components

**Files:**
- Create: `components/admin/LogoutButton.tsx`
- Create: `components/admin/ProductTable.tsx`
- Create: `components/admin/ProductForm.tsx`

- [ ] **Step 1: Create admin components directory**

```bash
mkdir -p components/admin
```

- [ ] **Step 2: Write LogoutButton**

Create `components/admin/LogoutButton.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
    >
      Đăng xuất
    </button>
  )
}
```

- [ ] **Step 3: Write ProductTable**

Create `components/admin/ProductTable.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  category: string
  price: number
  clickCount: number
  imageUrl: string
}

export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter()

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return

    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Xóa thất bại. Thử lại!')
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
        <p className="text-4xl mb-3">📦</p>
        <p>Chưa có sản phẩm nào.</p>
        <Link
          href="/admin/products/new"
          className="inline-block mt-4 text-orange-500 hover:underline text-sm"
        >
          Thêm sản phẩm đầu tiên →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded flex-shrink-0 bg-gray-100"
                    />
                    <span className="text-sm font-medium text-gray-800 line-clamp-1 max-w-[200px]">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  ₫{product.price.toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {product.clickCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm text-blue-500 hover:text-blue-700 font-medium"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write ProductForm**

Create `components/admin/ProductForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  name: string
  imageUrl: string
  price: string
  affiliateUrl: string
  category: string
}

interface ProductFormProps {
  initialData?: FormData
  productId?: string
}

const EMPTY_FORM: FormData = {
  name: '',
  imageUrl: '',
  price: '',
  affiliateUrl: '',
  category: '',
}

export function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initialData ?? EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = productId ? `/api/products/${productId}` : '/api/products'
    const method = productId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Có lỗi xảy ra. Thử lại!')
      setLoading(false)
    }
  }

  const fields: Array<{
    name: keyof FormData
    label: string
    type: string
    placeholder: string
  }> = [
    {
      name: 'name',
      label: 'Tên sản phẩm',
      type: 'text',
      placeholder: 'iPhone 15 Pro Max 256GB',
    },
    {
      name: 'imageUrl',
      label: 'URL hình ảnh',
      type: 'url',
      placeholder: 'https://example.com/image.jpg',
    },
    {
      name: 'price',
      label: 'Giá (VND)',
      type: 'number',
      placeholder: '29990000',
    },
    {
      name: 'affiliateUrl',
      label: 'Affiliate URL',
      type: 'url',
      placeholder: 'https://shopee.vn/product-link',
    },
    {
      name: 'category',
      label: 'Danh mục',
      type: 'text',
      placeholder: 'Điện thoại',
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {field.label}
          </label>
          <input
            id={field.name}
            type={field.type}
            name={field.name}
            value={form[field.name]}
            onChange={handleChange}
            placeholder={field.placeholder}
            required
            min={field.type === 'number' ? '0' : undefined}
            step={field.type === 'number' ? 'any' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-sm"
          />
        </div>
      ))}

      {/* Image preview */}
      {form.imageUrl && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Preview:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.imageUrl}
            alt="preview"
            className="w-24 h-24 object-cover rounded border border-gray-200"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {loading
            ? 'Đang lưu...'
            : productId
            ? 'Cập nhật sản phẩm'
            : 'Tạo sản phẩm'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
        >
          Hủy
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/
git commit -m "feat: add admin components (LogoutButton, ProductTable, ProductForm)"
```

---

## Task 11: Admin Pages

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/edit/page.tsx`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p app/admin/login
mkdir -p app/admin/products/new
mkdir -p "app/admin/products/[id]/edit"
```

- [ ] **Step 2: Write login page**

Create `app/admin/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Sai tài khoản hoặc mật khẩu')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🛒</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Admin Login</h1>
          <p className="text-sm text-gray-400 mt-1">Mini Shopee Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write admin dashboard page**

Create `app/admin/page.tsx`:

```typescript
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductTable } from '@/components/admin/ProductTable'
import { LogoutButton } from '@/components/admin/LogoutButton'

export const revalidate = 0

export default async function AdminPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const serialized = JSON.parse(JSON.stringify(products))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-xs text-gray-400">{products.length} sản phẩm</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products/new"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              + Thêm sản phẩm
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <ProductTable products={serialized} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write new product page**

Create `app/admin/products/new/page.tsx`:

```typescript
import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Quay lại
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Thêm sản phẩm mới</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <ProductForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write edit product page**

Create `app/admin/products/[id]/edit/page.tsx`:

```typescript
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/admin/ProductForm'

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) notFound()

  const initialData = {
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price.toString(),
    affiliateUrl: product.affiliateUrl,
    category: product.category,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Quay lại
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Sửa sản phẩm</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <ProductForm initialData={initialData} productId={product.id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Test full admin flow**

With dev server running:
1. Visit http://localhost:3000/admin → should redirect to `/admin/login`
2. Login with credentials from `.env.local`
3. Click "+ Thêm sản phẩm", fill form, submit
4. Verify product appears in table
5. Click "Sửa", change a field, save
6. Click "Xóa", confirm deletion
7. Visit http://localhost:3000 — product should appear in public grid
8. Click a product card → should redirect to affiliate URL + click count increments

- [ ] **Step 7: Commit**

```bash
git add app/admin/
git commit -m "feat: add admin login, dashboard, and product CRUD pages"
```

---

## Task 12: Config + .env.example + Build Verification

**Files:**
- Create: `next.config.js`
- Create: `.env.example`

- [ ] **Step 1: Write next.config.js**

Replace content of `next.config.js` (or create if it doesn't exist):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // External images: use plain <img> tags throughout, so no domain config needed.
  // If you switch to next/image, add remotePatterns here.
}

module.exports = nextConfig
```

- [ ] **Step 2: Write .env.example**

Create `.env.example`:

```
# Supabase PostgreSQL — get from: Project Settings → Database → Connection string
# Transaction mode (for app queries via Prisma)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session mode (for Prisma migrations / db push)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Admin credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="changeme123"

# Cookie signing secret — must be at least 32 characters, random string
COOKIE_SECRET="replace-with-a-random-32-char-secret!!"
```

- [ ] **Step 3: Ensure .gitignore ignores .env.local**

Verify `.gitignore` contains `.env*.local`. If not, add it:

```
.env*.local
```

- [ ] **Step 4: Run production build to catch TypeScript errors**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no TypeScript or ESLint errors.

If there are errors, fix them before continuing.

- [ ] **Step 5: Run tests one final time**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 6: Final commit**

```bash
git add next.config.js .env.example .gitignore
git commit -m "chore: add next.config, .env.example, verify build passes"
```

---

## Vercel Deployment Checklist

After pushing to GitHub:

1. Import repo in Vercel dashboard
2. Set environment variables in Vercel → Settings → Environment Variables:
   - `DATABASE_URL` (Supabase pooled URL)
   - `DIRECT_URL` (Supabase direct URL)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `COOKIE_SECRET`
3. Deploy
4. Visit `https://your-app.vercel.app/admin` to verify auth works in production
