import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductGrid'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const products = await prisma.product.findMany({ where: { isVisible: true }, orderBy: { createdAt: 'desc' } })
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white px-4 py-3 sticky top-0 z-10 shadow">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight"><Link href="/">🛍️ Ada Shop</Link></h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <ProductGrid products={products} />
      </main>
    </div>
  )
}
