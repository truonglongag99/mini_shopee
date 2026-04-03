'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product { id: string; name: string; category: string; price: number; clickCount: number; imageUrl: string; _count: { scripts: number } }

export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [generating, setGenerating] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else alert('Xóa thất bại. Thử lại!')
  }

  async function handleGenerate(id: string) {
    setGenerating(id)
    const res = await fetch(`/api/products/${id}/generate-script`, { method: 'POST' })
    if (res.ok) router.push('/admin/scripts')
    else alert('Tạo kịch bản thất bại. Thử lại!')
    setGenerating(null)
  }

  if (products.length === 0) return (
    <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
      <p className="text-4xl mb-3">📦</p><p>Chưa có sản phẩm nào.</p>
      <Link href="/admin/products/new" className="inline-block mt-4 text-orange-500 hover:underline text-sm">Thêm sản phẩm đầu tiên →</Link>
    </div>
  )

  return (
    <>
      {/* Mobile: card layout */}
      <div className="md:hidden space-y-3">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded bg-gray-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{product.category}</span>
                  <span className="text-xs text-gray-500">{product.clickCount} clicks</span>
                  {product._count.scripts > 0 && (
                    <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">{product._count.scripts} kịch bản</span>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 shrink-0">₫{product.price.toLocaleString('vi-VN')}</p>
            </div>
            <div className="flex gap-2 border-t pt-3">
              <button onClick={() => handleGenerate(product.id)} disabled={generating === product.id} className="flex-1 text-center text-xs text-orange-500 font-medium py-1.5 rounded-lg border border-orange-200 hover:bg-orange-50 disabled:opacity-50">
                {generating === product.id ? 'Đang tạo...' : product._count.scripts > 0 ? 'Tạo thêm kịch bản' : 'Tạo kịch bản'}
              </button>
              <Link href={`/admin/products/${product.id}/edit`} className="flex-1 text-center text-xs text-blue-500 font-medium py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50">Sửa</Link>
              <button onClick={() => handleDelete(product.id, product.name)} className="flex-1 text-center text-xs text-red-500 font-medium py-1.5 rounded-lg border border-red-200 hover:bg-red-50">Xóa</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Sản phẩm', 'Danh mục', 'Giá', 'Clicks', 'Hành động'].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                    <div>
                      <span className="text-sm font-medium text-gray-800 line-clamp-1 max-w-[200px]">{product.name}</span>
                      {product._count.scripts > 0 && (
                        <span className="block text-xs text-purple-500 mt-0.5">{product._count.scripts} kịch bản</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{product.category}</span></td>
                <td className="px-4 py-3 text-sm text-gray-700">₫{product.price.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{product.clickCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleGenerate(product.id)} disabled={generating === product.id} className="text-sm text-orange-500 hover:text-orange-700 font-medium disabled:opacity-50">{generating === product.id ? 'Đang tạo...' : product._count.scripts > 0 ? 'Tạo thêm' : 'Tạo kịch bản'}</button>
                    <Link href={`/admin/products/${product.id}/edit`} className="text-sm text-blue-500 hover:text-blue-700 font-medium">Sửa</Link>
                    <button onClick={() => handleDelete(product.id, product.name)} className="text-sm text-red-500 hover:text-red-700 font-medium">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
