'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData { name: string; imageUrl: string; price: string; affiliateUrl: string; category: string; description: string; isVisible: boolean }
const EMPTY: FormData = { name: '', imageUrl: '', price: '', affiliateUrl: '', category: '', description: '', isVisible: true }
const FIELDS: Array<{name: keyof Omit<FormData, 'description' | 'isVisible'>; label: string; type: string; placeholder: string}> = [
  { name: 'name', label: 'Tên sản phẩm', type: 'text', placeholder: 'iPhone 15 Pro Max' },
  { name: 'imageUrl', label: 'URL hình ảnh', type: 'url', placeholder: 'https://example.com/image.jpg' },
  { name: 'price', label: 'Giá (VND)', type: 'number', placeholder: '29990000' },
  { name: 'affiliateUrl', label: 'Affiliate URL', type: 'url', placeholder: 'https://s.shopee.vn/...' },
  { name: 'category', label: 'Danh mục', type: 'text', placeholder: 'Điện thoại' },
]

export function ProductForm({ initialData, productId }: { initialData?: FormData; productId?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initialData ?? EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [shopeeUrl, setShopeeUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  async function handleParseShopee() {
    if (!shopeeUrl) return
    setParsing(true)
    setParseError('')
    const res = await fetch('/api/products/parse-shopee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: shopeeUrl }),
    })
    const data = await res.json()
    if (!res.ok) {
      setParseError((data.error ?? 'Không parse được URL') + (data.resolvedUrl ? ` (${data.resolvedUrl})` : ''))
    } else {
      setForm(p => ({
        ...p,
        name: data.name || p.name,
        imageUrl: data.imageUrl || p.imageUrl,
        price: data.price ? String(Math.round(data.price)) : p.price,
        category: data.category || p.category,
        affiliateUrl: shopeeUrl, // giữ nguyên link affiliate gốc
      }))
    }
    setParsing(false)
  }

  async function handleGenerateDescription() {
    if (!form.description) return
    setGeneratingDesc(true)
    const res = await fetch('/api/products/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, category: form.category, rawContent: form.description }),
    })
    if (res.ok) {
      const { description } = await res.json()
      setForm(p => ({ ...p, description }))
    }
    setGeneratingDesc(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const res = await fetch(productId ? `/api/products/${productId}` : '/api/products', {
      method: productId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    })
    if (res.ok) { router.push('/admin') }
    else if (res.status === 401) { router.push('/admin/login') }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Có lỗi xảy ra'); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {/* Shopee URL auto-parse */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-orange-700 uppercase">Tự động điền từ link Shopee</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={shopeeUrl}
            onChange={e => setShopeeUrl(e.target.value)}
            placeholder="Paste link affiliate Shopee (s.shopee.vn/...) vào đây"
            className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white"
          />
          <button
            type="button"
            onClick={handleParseShopee}
            disabled={parsing || !shopeeUrl}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
          >
            {parsing ? 'Đang lấy...' : 'Lấy thông tin'}
          </button>
        </div>
        {parseError && <p className="text-xs text-red-500">{parseError}</p>}
      </div>

      {FIELDS.map(f => (
        <div key={f.name}>
          <label htmlFor={f.name} className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <input id={f.name} type={f.type} name={f.name} value={form[f.name] as string} onChange={e => setForm(p => ({...p, [e.target.name]: e.target.value}))} placeholder={f.placeholder} required min={f.type==='number'?'0':undefined} step={f.type==='number'?'any':undefined} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400 text-sm" />
        </div>
      ))}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả sản phẩm</label>
          <button type="button" onClick={handleGenerateDescription} disabled={generatingDesc || !form.description} className="text-xs text-orange-500 hover:text-orange-700 font-medium disabled:opacity-40">
            {generatingDesc ? 'Đang tạo...' : 'Tạo mô tả từ nội dung ↑'}
          </button>
        </div>
        <textarea id="description" name="description" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Nhập nội dung thô rồi nhấn 'Tạo mô tả', hoặc tự điền..." rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400 text-sm resize-none" />
      </div>
      {form.imageUrl && (
        <div><p className="text-xs text-gray-500 mb-1">Preview:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.imageUrl} alt="preview" className="w-24 h-24 object-cover rounded border" onError={e => {(e.target as HTMLImageElement).style.display='none'}} /></div>
      )}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setForm(p => ({...p, isVisible: !p.isVisible}))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isVisible ? 'bg-orange-500' : 'bg-gray-300'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className="text-sm text-gray-700">{form.isVisible ? 'Hiển thị' : 'Ẩn'}</span>
      </div>
      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium">{loading ? 'Đang lưu...' : productId ? 'Cập nhật' : 'Tạo sản phẩm'}</button>
        <button type="button" onClick={() => router.push('/admin')} className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm">Hủy</button>
      </div>
    </form>
  )
}
