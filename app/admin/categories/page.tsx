import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CategoryManager } from '@/components/admin/CategoryManager'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'desc' } })
  const serialized = JSON.parse(JSON.stringify(categories))
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Quay lại</Link>
          <h1 className="text-xl font-bold text-gray-800">Trang danh mục</h1>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <CategoryManager categories={serialized} />
      </div>
    </div>
  )
}
