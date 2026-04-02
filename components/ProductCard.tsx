import Link from 'next/link'

interface Product { id: string; name: string; imageUrl: string; price: number; category: string }

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/go/${product.id}`} className="group block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      </div>
      <div className="p-3">
        <span className="inline-block text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full mb-1">{product.category}</span>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[2.5rem]">{product.name}</h3>
        <p className="text-orange-500 font-bold text-base">₫{product.price.toLocaleString('vi-VN')}</p>
      </div>
    </Link>
  )
}
