import { ProductGrid } from '@/components/ProductGrid'

export const dynamic = 'force-dynamic'

async function getProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/products`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function Home() {
  const products = await getProducts()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white px-4 py-3 sticky top-0 z-10 shadow">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight">🛍️ Mini Shopee</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <ProductGrid products={products} />
      </main>
    </div>
  )
}
