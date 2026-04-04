'use client'
import { useState, useEffect } from 'react'
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
  videoStatus: string
  videoUrl: string | null
  imagePrompt: string | null
  shortCaption: string | null
  longCaption: string | null
  hashtags: string[]
  generatedImageUrl: string | null
  createdAt: string
  product: { name: string; imageUrl: string; category: string }
}

interface EditForm {
  title: string
  setting: string
  characters: string
  cta: string
  scenes: Scene[]
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft:    { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt',  className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Từ chối',   className: 'bg-red-100 text-red-700' },
}

const FILTERS = [
  { value: 'all',      label: 'Tất cả' },
  { value: 'draft',    label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
]

export function ScriptList({ scripts: initial }: { scripts: Script[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [_generatingVideo, _setGeneratingVideo] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState<string | null>(null)

  const scripts = filter === 'all' ? initial : initial.filter(s => s.status === filter)

  const hasPending = initial.some(s => s.videoStatus === 'pending')
  useEffect(() => {
    if (!hasPending) return
    const interval = setInterval(() => router.refresh(), 10000)
    return () => clearInterval(interval)
  }, [hasPending, router])

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

  function startEdit(s: Script) {
    setEditing(s.id)
    setEditForm({
      title: s.title,
      setting: s.setting,
      characters: s.characters.join(', '),
      cta: s.cta,
      scenes: s.scenes.map(sc => ({ ...sc })),
    })
  }

  async function saveEdit(id: string) {
    if (!editForm) return
    setLoading(id)
    await fetch(`/api/scripts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        setting: editForm.setting,
        characters: editForm.characters.split(',').map(c => c.trim()).filter(Boolean),
        cta: editForm.cta,
        scenes: editForm.scenes,
      }),
    })
    setEditing(null)
    setEditForm(null)
    router.refresh()
    setLoading(null)
  }

  async function handleGenerateImage(id: string) {
    setGeneratingImage(id)
    const res = await fetch(`/api/scripts/${id}/generate-image`, { method: 'POST' })
    if (!res.ok) alert('Tạo ảnh thất bại. Thử lại!')
    router.refresh()
    setGeneratingImage(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleGenerateVideo(id: string) {
    _setGeneratingVideo(id)
    const res = await fetch(`/api/scripts/${id}/generate-video`, { method: 'POST' })
    if (!res.ok) alert('Tạo video thất bại. Thử lại!')
    router.refresh()
    _setGeneratingVideo(null)
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
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.value ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {f.label}
            <span className="ml-1 opacity-70">({f.value === 'all' ? initial.length : initial.filter(s => s.status === f.value).length})</span>
          </button>
        ))}
      </div>
      {scripts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 text-sm">Không có kịch bản nào.</div>
      )}
      {scripts.map(s => (
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
            <button onClick={() => { setExpanded(expanded === s.id ? null : s.id); setEditing(null) }} className="text-xs text-gray-500 hover:text-gray-700 shrink-0">
              {expanded === s.id ? 'Thu gọn ▲' : 'Xem ▼'}
            </button>
          </div>

          {expanded === s.id && (
            <div className="border-t px-5 py-4 space-y-4 bg-gray-50">
              {editing === s.id && editForm ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tiêu đề</label>
                    <input value={editForm.title} onChange={e => setEditForm(p => p && ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bối cảnh</label>
                    <textarea value={editForm.setting} onChange={e => setEditForm(p => p && ({ ...p, setting: e.target.value }))} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nhân vật (cách nhau bằng dấu phẩy)</label>
                    <input value={editForm.characters} onChange={e => setEditForm(p => p && ({ ...p, characters: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Lời thoại</label>
                    <div className="space-y-3">
                      {editForm.scenes.map((scene, i) => (
                        <div key={i} className="bg-white border rounded-lg p-3 space-y-2">
                          <input value={scene.character} onChange={e => setEditForm(p => { if (!p) return p; const scenes = [...p.scenes]; scenes[i] = { ...scenes[i], character: e.target.value }; return { ...p, scenes } })} placeholder="Nhân vật" className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:border-orange-400" />
                          <textarea value={scene.line} onChange={e => setEditForm(p => { if (!p) return p; const scenes = [...p.scenes]; scenes[i] = { ...scenes[i], line: e.target.value }; return { ...p, scenes } })} placeholder="Lời thoại" rows={2} className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:border-orange-400 resize-none" />
                          <input value={scene.action} onChange={e => setEditForm(p => { if (!p) return p; const scenes = [...p.scenes]; scenes[i] = { ...scenes[i], action: e.target.value }; return { ...p, scenes } })} placeholder="Hành động" className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:border-orange-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CTA</label>
                    <input value={editForm.cta} onChange={e => setEditForm(p => p && ({ ...p, cta: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button disabled={loading === s.id} onClick={() => saveEdit(s.id)} className="bg-orange-500 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50">Lưu</button>
                    <button onClick={() => { setEditing(null); setEditForm(null) }} className="bg-gray-200 text-gray-700 text-xs px-4 py-1.5 rounded-lg hover:bg-gray-300">Hủy</button>
                  </div>
                </>
              ) : (
                <>
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
                  {s.imagePrompt && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Image Prompt</p>
                      <p className="text-xs text-gray-500 bg-white border rounded-lg px-3 py-2 italic">{s.imagePrompt}</p>
                    </div>
                  )}
                  {(s.shortCaption || s.longCaption) && (
                    <div className="space-y-3">
                      {s.shortCaption && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Caption ngắn (TikTok/Threads)</p>
                            <button onClick={() => navigator.clipboard.writeText(s.shortCaption!)} className="text-xs text-blue-500 hover:underline">Copy</button>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-line bg-white border rounded-lg px-3 py-2">{s.shortCaption}</p>
                        </div>
                      )}
                      {s.longCaption && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Caption dài (Facebook/Instagram)</p>
                            <button onClick={() => navigator.clipboard.writeText(s.longCaption!)} className="text-xs text-blue-500 hover:underline">Copy</button>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-line bg-white border rounded-lg px-3 py-2">{s.longCaption}</p>
                        </div>
                      )}
                      {s.hashtags?.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Hashtags</p>
                            <button onClick={() => navigator.clipboard.writeText(s.hashtags.join(' '))} className="text-xs text-blue-500 hover:underline">Copy</button>
                          </div>
                          <p className="text-sm text-blue-500">{s.hashtags.join(' ')}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {s.generatedImageUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ảnh generated</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.generatedImageUrl} alt="generated" className="w-full max-w-[200px] rounded-lg border" />
                      <a href={s.generatedImageUrl} download className="inline-block mt-1 text-xs text-blue-500 hover:underline">Tải xuống</a>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.status !== 'approved' && (
                      <button disabled={loading === s.id} onClick={() => updateStatus(s.id, 'approved')} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50">Duyệt</button>
                    )}
                    {s.status !== 'rejected' && (
                      <button disabled={loading === s.id} onClick={() => updateStatus(s.id, 'rejected')} className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-50">Từ chối</button>
                    )}
                    {s.status !== 'draft' && (
                      <button disabled={loading === s.id} onClick={() => updateStatus(s.id, 'draft')} className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-200 disabled:opacity-50">Draft lại</button>
                    )}
                    <button onClick={() => startEdit(s)} className="bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100">Chỉnh sửa</button>
                    {s.imagePrompt && (
                      <button disabled={generatingImage === s.id} onClick={() => handleGenerateImage(s.id)} className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                        {generatingImage === s.id ? 'Đang tạo ảnh...' : s.generatedImageUrl ? 'Tạo lại ảnh' : 'Tạo ảnh'}
                      </button>
                    )}
                    <button disabled={loading === s.id} onClick={() => handleDelete(s.id)} className="ml-auto text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">Xóa</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
