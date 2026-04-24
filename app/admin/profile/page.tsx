import Link from 'next/link'

export default function MyProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h1>
          <Link href="/" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
            Quay lại Trang chủ
          </Link>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            A
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Ada Admin</h2>
          <p className="text-gray-500 mt-2">Đây là trang thông tin công khai dành cho Admin.</p>
        </div>
      </main>
    </div>
  )
}
