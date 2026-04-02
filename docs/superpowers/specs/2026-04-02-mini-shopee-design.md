# Mini Shopee Affiliate App — Design Spec
Date: 2026-04-02

## Overview

A Shopee-like affiliate mini web app with a public product grid and an admin dashboard. Admins manage products; public users browse and click through to affiliate links. Each click is tracked in the database.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **ORM:** Prisma
- **Database:** PostgreSQL via Supabase
- **Auth:** Signed HttpOnly cookie (no external auth library)
- **Deploy:** Vercel

---

## Architecture

Single Next.js monorepo — public site, admin dashboard, and REST API all in one project. One Vercel deployment.

---

## Folder Structure

```
mini_shopee/
├── app/
│   ├── page.tsx                       # Public homepage (product grid)
│   ├── go/[id]/route.ts               # Redirect tracker (302 + clickCount++)
│   ├── admin/
│   │   ├── login/page.tsx             # Login form
│   │   ├── page.tsx                   # Dashboard (product table)
│   │   └── products/
│   │       ├── new/page.tsx           # Create product form
│   │       └── [id]/edit/page.tsx     # Edit product form
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts         # POST: set signed cookie
│       │   └── logout/route.ts        # POST: clear cookie
│       └── products/
│           ├── route.ts               # GET, POST
│           └── [id]/route.ts          # PUT, DELETE
├── components/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── admin/
│       ├── ProductTable.tsx
│       └── ProductForm.tsx
├── lib/
│   ├── prisma.ts                      # Prisma client singleton
│   └── auth.ts                        # Cookie sign/verify helpers
├── middleware.ts                       # Protect /admin/* routes
├── prisma/
│   └── schema.prisma
└── .env.example
```

---

## Data Model

```prisma
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

---

## Authentication

- **Mechanism:** HttpOnly signed cookie (`admin_session`)
- **Signing:** `crypto.createHmac('sha256', COOKIE_SECRET)` — no external dependencies
- **Login:** `POST /api/auth/login` compares against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars; sets cookie with 24h expiry
- **Logout:** `POST /api/auth/logout` clears the cookie
- **Protection:** `middleware.ts` verifies cookie on all `/admin/*` routes; redirects to `/admin/login` if invalid or missing
- **API protection:** All mutating API routes (`POST /api/products`, `PUT`, `DELETE`) verify the same cookie

---

## Environment Variables

```
DATABASE_URL=         # Supabase PostgreSQL connection string
ADMIN_USERNAME=       # Admin login username
ADMIN_PASSWORD=       # Admin login password
COOKIE_SECRET=        # Secret for HMAC cookie signing (min 32 chars)
```

---

## Public Site

### Homepage (`/`)
- Server component — fetches products directly via Prisma
- Responsive grid: 2 cols (mobile) → 3 cols (tablet) → 4 cols (desktop)
- Client-side search bar filtering by product name
- Category filter tabs derived from distinct categories in DB
- Each `ProductCard`: image, name, price, category badge → links to `/go/[id]`

### Redirect Route (`/go/[id]`)
- Route Handler (`app/go/[id]/route.ts`)
- Finds product by id → increments `clickCount` → returns 302 redirect to `affiliateUrl`
- If product not found → redirects to homepage (`/`)

---

## Admin Dashboard

### `/admin/login`
- Username + password form
- Calls `POST /api/auth/login`
- On success → redirects to `/admin`

### `/admin` (Dashboard)
- Product table: Name, Category, Price, Clicks, Actions
- Actions: Edit (→ `/admin/products/[id]/edit`) | Delete (confirmation prompt → `DELETE /api/products/[id]`)

### `/admin/products/new`
- Form fields: Name, Image URL, Price, Affiliate URL, Category
- Calls `POST /api/products`
- On success → redirects to `/admin`

### `/admin/products/[id]/edit`
- Same form pre-filled with existing product data
- Calls `PUT /api/products/[id]`
- On success → redirects to `/admin`

---

## API Routes

| Method | Route | Description | Auth required |
|--------|-------|-------------|---------------|
| GET | `/api/products` | List all products (sorted by createdAt desc) | No |
| POST | `/api/products` | Create product | Yes |
| PUT | `/api/products/[id]` | Update product | Yes |
| DELETE | `/api/products/[id]` | Delete product, returns 204 | Yes |

---

## Bonus Features

- **Search:** Client-side filter on homepage by product name
- **Category filter:** Tabs on homepage derived from distinct DB categories

---

## Setup Instructions (short)

1. `npx create-next-app@latest mini_shopee --typescript --tailwind --app`
2. `npm install prisma @prisma/client`
3. Copy `.env.example` → `.env.local`, fill in Supabase `DATABASE_URL` and other vars
4. `npx prisma db push`
5. `npm run dev`
6. Deploy to Vercel: set env vars in Vercel dashboard
