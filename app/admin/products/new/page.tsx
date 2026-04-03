import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Quay lại</Link>
          <h1 className="text-xl font-bold text-gray-800">Thêm sản phẩm mới</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8"><ProductForm /></div>
    </div>
  )
}
