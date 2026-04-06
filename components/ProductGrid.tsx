'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from './ProductCard'

interface Product { id: string; name: string; imageUrl: string; price: number; category: string; affiliateUrl: string; clickCount: number; createdAt: Date | string }

export function ProductGrid({ products, backToHome }: { products: Product[]; backToHome?: boolean }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const categories = useMemo(() => ['Tất cả', ...Array.from(new Set(products.map(p => p.category))).sort()], [products])
  const filtered = useMemo(() => products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (activeCategory === 'Tất cả' || p.category === activeCategory)
  ), [products, search, activeCategory])

  function handleCategoryClick(cat: string) {
    if (cat === 'Tất cả' && backToHome) {
      router.push('/')
      return
    }
    setActiveCategory(cat)
  }

  return (
    <div>
      <div className="mb-4">
        <input type="text" placeholder="Tìm kiếm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-sm" />
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => handleCategoryClick(cat)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
        ))}
      </div>
      <p className="text-sm text-gray-400 mb-4">{filtered.length} sản phẩm</p>
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><p className="text-4xl mb-3">🔍</p><p>Không tìm thấy sản phẩm phù hợp.</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  )
}
