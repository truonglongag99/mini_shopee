'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Scene { character: string; line: string; action: string }
interface Script {
  id: string
  title: string
  setting: string
  characters: string[]
  scenes: Scene[]
  cta: string
  status: string
  createdAt: string
  product: { name: string; imageUrl: string; category: string }
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft:    { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt',  className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối',   className: 'bg-red-100 text-red-700' },
}

export function ScriptList({ scripts: initial }: { scripts: Script[] }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setLoading(id)
    await fetch(`/api/scripts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
    setLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa kịch bản này?')) return
    setLoading(id)
    await fetch(`/api/scripts/${id}`, { method: 'DELETE' })
    router.refresh()
    setLoading(null)
  }

  if (initial.length === 0) return (
    <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
      <p className="text-4xl mb-3">🎬</p>
      <p>Chưa có kịch bản nào. Vào sản phẩm để tạo kịch bản.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {initial.map(s => (
        <div key={s.id} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.product.imageUrl} alt={s.product.name} className="w-12 h-12 object-cover rounded bg-gray-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.product.name} · {new Date(s.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_LABEL[s.status]?.className}`}>
              {STATUS_LABEL[s.status]?.label}
            </span>
            <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="text-xs text-gray-500 hover:text-gray-700 shrink-0">
              {expanded === s.id ? 'Thu gọn ▲' : 'Xem ▼'}
            </button>
          </div>

          {expanded === s.id && (
            <div className="border-t px-5 py-4 space-y-4 bg-gray-50">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bối cảnh</p>
                <p className="text-sm text-gray-700">{s.setting}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Nhân vật: {s.characters.join(', ')}</p>
                <div className="space-y-2">
                  {s.scenes.map((scene, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs font-bold text-orange-500 shrink-0 w-16 truncate">{scene.character}</span>
                      <div>
                        <p className="text-sm text-gray-800">"{scene.line}"</p>
                        <p className="text-xs text-gray-400 italic">{scene.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">CTA</p>
                <p className="text-sm text-orange-600 font-medium">{s.cta}</p>
              </div>
              <div className="flex gap-2 pt-1">
                {s.status !== 'approved' && (
                  <button disabled={loading === s.id} onClick={() => updateStatus(s.id, 'approved')} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50">Duyệt</button>
                )}
                {s.status !== 'rejected' && (
                  <button disabled={loading === s.id} onClick={() => updateStatus(s.id, 'rejected')} className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-50">Từ chối</button>
                )}
                {s.status !== 'draft' && (
                  <button disabled={loading === s.id} onClick={() => updateStatus(s.id, 'draft')} className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-200 disabled:opacity-50">Draft lại</button>
                )}
                <button disabled={loading === s.id} onClick={() => handleDelete(s.id)} className="ml-auto text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">Xóa</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
