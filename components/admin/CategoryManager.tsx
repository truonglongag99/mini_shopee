'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string; slug: string; keywords: string }

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', slug: '', keywords: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; slug: string; keywords: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setForm({ name: '', slug: '', keywords: '' }); router.refresh() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Có lỗi xảy ra') }
    setLoading(false)
  }

  function startEdit(c: Category) {
    setEditing(c.id)
    setEditForm({ name: c.name, slug: c.slug, keywords: c.keywords })
  }

  async function saveEdit(id: string) {
    if (!editForm) return
    setSaving(true)
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) { setEditing(null); setEditForm(null); router.refresh() }
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa "${name}"?`)) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Thêm trang danh mục mới</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên hiển thị</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Sản phẩm cho vẹt" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Slug (dùng trong URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 shrink-0">/</span>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="san-pham-vet" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            </div>
            {form.slug && <p className="text-xs text-gray-400 mt-1">URL: ada-shopee.vercel.app/{form.slug}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Keywords (cách nhau bằng dấu phẩy)</label>
            <input value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} placeholder="vẹt, chim, thú cưng, bird" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            <p className="text-xs text-gray-400 mt-1">Sản phẩm có tên hoặc category chứa keyword sẽ hiện ở trang này</p>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <button type="submit" disabled={loading} className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium">
            {loading ? 'Đang tạo...' : 'Tạo trang'}
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {initial.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">Chưa có trang danh mục nào.</div>
        )}
        {initial.map(c => (
          <div key={c.id} className="bg-white rounded-lg shadow overflow-hidden">
            {editing === c.id && editForm ? (
              <div className="px-4 py-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên hiển thị</label>
                  <input value={editForm.name} onChange={e => setEditForm(p => p && ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 shrink-0">/</span>
                    <input value={editForm.slug} onChange={e => setEditForm(p => p && ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Keywords</label>
                  <input value={editForm.keywords} onChange={e => setEditForm(p => p && ({ ...p, keywords: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                </div>
                <div className="flex gap-2">
                  <button disabled={saving} onClick={() => saveEdit(c.id)} className="bg-orange-500 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button onClick={() => { setEditing(null); setEditForm(null) }} className="bg-gray-200 text-gray-700 text-xs px-4 py-1.5 rounded-lg hover:bg-gray-300">Hủy</button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                  <p className="text-xs text-orange-500">/{c.slug}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Keywords: {c.keywords}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(c)} className="text-xs text-blue-500 hover:text-blue-700">Sửa</button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="text-xs text-red-500 hover:text-red-700">Xóa</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
