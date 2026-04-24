# System Overview

This is a Mini Shopee affiliate web app.

## Core Purpose
- Display products (affiliate links)
- Track clicks
- Provide admin dashboard to manage products

---

## Architecture

Monorepo using Next.js 14 (App Router):

- Public site (product listing)
- Admin dashboard
- REST API

All deployed on Vercel.

---

## Core Components

### 1. Product System
- Stored in PostgreSQL (Supabase)
- Managed via Prisma ORM
- Fields:
  - name
  - imageUrl
  - price
  - affiliateUrl
  - category
  - clickCount

---

### 2. Click Tracking Flow

1. User clicks product
2. Request goes to `/go/[id]`
3. Server:
   - find product
   - increment `clickCount`
   - redirect to `affiliateUrl`

---

### 3. Admin Auth System

- Simple HMAC cookie-based auth
- No external auth provider

Flow:
1. Login API verifies username/password
2. Server signs cookie (`admin_session`)
3. Middleware checks cookie for `/admin/*`

---

### 4. API Layer

- `/api/products`
  - GET: public
  - POST: admin only

- `/api/products/[id]`
  - PUT / DELETE: admin only

---

### 5. Frontend Structure

- Public:
  - ProductGrid (search + filter)
  - ProductCard

- Admin:
  - ProductTable
  - ProductForm

---

## Data Flow (IMPORTANT)

User → ProductGrid → click product  
→ `/go/[id]`  
→ DB update clickCount  
→ redirect to affiliate link  

Admin → login → cookie set  
→ access dashboard  
→ CRUD products  

---

## Known Risks

- Race condition on clickCount increment
- No rate limiting
- No validation for affiliate URLs
- Auth is basic (not scalable)

---

## Goal for AI

When analyzing code:
- Always relate to this architecture
- Focus on data flow and side effects
- Detect issues like duplicate actions, race conditions, or security problems