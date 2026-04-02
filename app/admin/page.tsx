import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductTable } from '@/components/admin/ProductTable'
import { LogoutButton } from '@/components/admin/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
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
            <Link href="/admin/products/new" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium">+ Thêm sản phẩm</Link>
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
