 import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/ProductGrid'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) notFound()

  const keywords = category.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)

  const allProducts = await prisma.product.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: 'desc' },
  })

  const products = allProducts.filter(p =>
    keywords.some(k =>
      p.name.toLowerCase().includes(k) ||
      p.category.toLowerCase().includes(k)
    )
  )

  const serialized = JSON.parse(JSON.stringify(products))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white px-4 py-3 sticky top-0 z-10 shadow">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight">🛍️ {category.name}</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <ProductGrid products={serialized} />
      </main>
    </div>
  )
}
