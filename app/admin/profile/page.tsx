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
    <div className="min-h-screen bg-[#020617] text-[#e2e8f0] font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] -z-10" />

      <div className="flex flex-col md:flex-row min-h-screen relative z-10">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-[320px] bg-black/40 backdrop-blur-xl border-r border-white/5 p-8 text-center shrink-0 flex flex-col justify-between">
          <div>
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-[#38bdf8] blur-2xl opacity-20 rounded-full"></div>
              <img 
                src="https://i.pravatar.cc/150?img=3" 
                className="w-32 h-32 rounded-full object-cover border-2 border-white/10 relative z-10" 
                alt="Avatar"
              />
            </div>
            <h1 className="text-3xl font-extrabold mb-1 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Minh Phục</h1>
            <p className="text-[#38bdf8] font-medium mb-8 tracking-[0.2em] uppercase text-xs">IT Support / System</p>

            <div className="text-sm text-[#94a3b8] space-y-4 mb-8 text-left bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8]">📞</span>
                <span>037767281</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8]">✉</span>
                <span>truongduclong@gmail.com</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8]">📍</span>
                <span>An Giang, Viet Nam</span>
              </p>
            </div>
          </div>

          <Link 
            href="/admin" 
            className="mt-4 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span className="text-lg">←</span>
            Quay lại Dashboard
          </Link>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="flex-1 p-6 md:p-16 space-y-12 overflow-y-auto max-h-screen">
          
          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-sm font-bold text-[#38bdf8] mb-4 uppercase tracking-[0.3em] flex items-center gap-4">
              Tóm tắt <div className="h-[1px] flex-1 bg-gradient-to-r from-[#38bdf8]/50 to-transparent"></div>
            </h2>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl group">
              Kỹ sư CNTT có kinh nghiệm phát triển web và vận hành hệ thống. 
              <p className="mt-2 text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors leading-relaxed">Có khả năng xử lý sự cố mạng, quản lý server và hỗ trợ người dùng với hiệu suất tối ưu.</p>
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <h2 className="text-sm font-bold text-[#38bdf8] mb-4 uppercase tracking-[0.3em] flex items-center gap-4">
              Kỹ năng <div className="h-[1px] flex-1 bg-gradient-to-r from-[#38bdf8]/50 to-transparent"></div>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Hạ tầng mạng', list: 'LAN, WiFi, DNS, DHCP' },
                { title: 'Phát triển Web', list: 'PHP, REST API, MySQL' },
                { title: 'Hệ thống', list: 'Linux, Docker, Deploy' },
                { title: 'Công cụ', list: 'Redis, RabbitMQ, Git' }
              ].map((skill, idx) => (
                <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/[0.07] transition-all duration-300">
                  <h3 className="text-[#38bdf8] font-bold text-sm mb-2">{skill.title}</h3>
                  <p className="text-[#94a3b8] text-sm">{skill.list}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <h2 className="text-sm font-bold text-[#38bdf8] mb-4 uppercase tracking-[0.3em] flex items-center gap-4">
              Kinh nghiệm <div className="h-[1px] flex-1 bg-gradient-to-r from-[#38bdf8]/50 to-transparent"></div>
            </h2>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl space-y-6">
              <ul className="space-y-4">
                {[
                  'Phát triển hệ thống web PHP quy mô lớn',
                  'Tối ưu hóa Database với hàng triệu bản ghi',
                  'Triển khai và vận hành hệ thống Server Cloud/On-premise',
                  'Xây dựng quy trình CI/CD cho dự án'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#94a3b8]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
