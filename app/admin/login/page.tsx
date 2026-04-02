'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) router.push('/admin')
    else { setError('Sai tài khoản hoặc mật khẩu'); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🛒</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Admin Login</h1>
          <p className="text-sm text-gray-400 mt-1">Mini Shopee Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400" />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
      </div>
    </div>
  )
}
