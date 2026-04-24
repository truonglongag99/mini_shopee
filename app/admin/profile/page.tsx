'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function MyProfilePage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-8')
        }
      })
    }, { threshold: 0.1 })

    const sections = document.querySelectorAll('.section-animate')
    sections.forEach(sec => observer.observe(sec))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0] font-sans">
      <div className="flex flex-col md:flex-row min-h-screen">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-[300px] bg-[#020617] p-8 text-center shrink-0">
          <img 
            src="https://i.pravatar.cc/150?img=3" 
            className="w-32 h-32 rounded-full object-cover border-4 border-[#38bdf8] mx-auto mb-4" 
            alt="Avatar"
          />
          <h1 className="text-2xl font-bold mb-1">Minh Phục</h1>
          <p className="text-[#38bdf8] mb-6">IT Support / System</p>

          <div className="text-sm text-[#94a3b8] space-y-2 mb-8">
            <p>📞 ________</p>
            <p>✉ ________</p>
            <p>📍 An Giang</p>
          </div>

          <Link 
            href="/admin" 
            className="inline-block mt-4 text-[#38bdf8] hover:underline text-sm font-medium"
          >
            Quay lại Dashboard
          </Link>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="flex-1 p-6 md:p-12 space-y-12">
          
          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-xl font-bold text-[#38bdf8] border-b border-[#1e293b] pb-2 mb-4 uppercase tracking-wider">Tóm tắt</h2>
            <div className="bg-[#020617] p-6 rounded-xl shadow-2xl border border-gray-800">
              Kỹ sư CNTT có kinh nghiệm phát triển web và vận hành hệ thống. 
              Có khả năng xử lý sự cố mạng, quản lý server và hỗ trợ người dùng.
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <h2 className="text-xl font-bold text-[#38bdf8] border-b border-[#1e293b] pb-2 mb-4 uppercase tracking-wider">Kỹ năng</h2>
            <div className="bg-[#020617] p-6 rounded-xl shadow-2xl border border-gray-800">
              <ul className="list-disc list-inside space-y-2">
                <li>LAN, WiFi, DNS, DHCP</li>
                <li>PHP, API, MySQL</li>
                <li>Redis, Queue</li>
                <li>Linux, Deploy server</li>
              </ul>
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <h2 className="text-xl font-bold text-[#38bdf8] border-b border-[#1e293b] pb-2 mb-4 uppercase tracking-wider">Kinh nghiệm</h2>
            <div className="bg-[#020617] p-6 rounded-xl shadow-2xl border border-gray-800">
              <ul className="list-disc list-inside space-y-2">
                <li>Phát triển hệ thống web PHP</li>
                <li>Tối ưu database lớn</li>
                <li>Xử lý sự cố hệ thống</li>
                <li>Deploy và vận hành server</li>
              </ul>
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <h2 className="text-xl font-bold text-[#38bdf8] border-b border-[#1e293b] pb-2 mb-4 uppercase tracking-wider">Dự án</h2>
            <div className="bg-[#020617] p-6 rounded-xl shadow-2xl border border-gray-800">
              <ul className="list-disc list-inside space-y-2">
                <li>Hệ thống quản lý đơn hàng</li>
                <li>Xử lý dữ liệu lớn, tối ưu hiệu năng</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
