import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/admin/ProductForm'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Quay lại</Link>
          <h1 className="text-xl font-bold text-gray-800">Sửa sản phẩm</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <ProductForm initialData={{ name: product.name, imageUrl: product.imageUrl, price: product.price.toString(), affiliateUrl: product.affiliateUrl, category: product.category, description: product.description ?? '', isVisible: product.isVisible }} productId={id} />
      </div>
    </div>
  )
}
