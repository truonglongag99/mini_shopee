import Link from 'next/link'

interface Product { id: string; name: string; imageUrl: string; price: number; category: string }

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link prefetch={false} href={`/go/${product.id}`} className="group block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[0.5rem]">{product.name}</h3>
        <p className="text-orange-500 font-bold text-base mb-3">₫{product.price.toLocaleString('vi-VN')}</p>
        <span className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-1.5 rounded-lg transition-colors">Mua ngay</span>
      </div>
    </Link>
  )
}
