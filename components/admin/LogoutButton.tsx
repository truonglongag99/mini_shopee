'use client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }
  return <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded hover:bg-gray-100 transition-colors">Đăng xuất</button>
}
