'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product { id: string; name: string; category: string; price: number; clickCount: number; imageUrl: string }

export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter()
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else alert('Xóa thất bại. Thử lại!')
  }
  if (products.length === 0) return (
    <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
      <p className="text-4xl mb-3">📦</p><p>Chưa có sản phẩm nào.</p>
      <Link href="/admin/products/new" className="inline-block mt-4 text-orange-500 hover:underline text-sm">Thêm sản phẩm đầu tiên →</Link>
    </div>
  )
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Sản phẩm','Danh mục','Giá','Clicks','Hành động'].map((h,i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i===4?'text-right':'text-left'}`}>{h}</th>
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
                    <span className="text-sm font-medium text-gray-800 line-clamp-1 max-w-[200px]">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{product.category}</span></td>
                <td className="px-4 py-3 text-sm text-gray-700">₫{product.price.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{product.clickCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-sm text-blue-500 hover:text-blue-700 font-medium">Sửa</Link>
                    <button onClick={() => handleDelete(product.id, product.name)} className="text-sm text-red-500 hover:text-red-700 font-medium">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
