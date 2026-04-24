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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-400/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none -z-10" />

      <div className="flex flex-col md:flex-row min-h-screen relative z-10 max-w-7xl mx-auto shadow-2xl bg-white/50 backdrop-blur-sm">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-[320px] bg-white border-r border-slate-200 p-8 text-center shrink-0 flex flex-col justify-between shadow-sm">
          <div>
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-10 rounded-full"></div>
              <img 
                src="https://i.pravatar.cc/150?img=3" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg relative z-10" 
                alt="Avatar"
              />
            </div>
            <h1 className="text-2xl font-extrabold mb-1 tracking-tight text-slate-900">TRƯƠNG ĐỨC LONG</h1>
            <p className="text-blue-600 font-semibold mb-8 tracking-[0.15em] uppercase text-[10px]">IT Support / System Specialist</p>

            <div className="text-sm text-slate-600 space-y-4 mb-8 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">📞</span>
                <span>037767281</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">✉</span>
                <span>truongduclong@gmail.com</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">📍</span>
                <span>An Giang, Viet Nam</span>
              </p>
            </div>
          </div>

          <Link 
            href="/admin" 
            className="mt-4 px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-medium transition-all duration-300 shadow-md flex items-center justify-center gap-2"
          >
            <span>←</span>
            Dashboard
          </Link>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="flex-1 p-6 md:p-16 space-y-12 overflow-y-auto max-h-screen bg-white/30">
          
          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-xs font-bold text-blue-600 mb-4 uppercase tracking-[0.3em] flex items-center gap-4">
              Giới thiệu <div className="h-[1px] flex-1 bg-slate-200"></div>
            </h2>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
              <p className="text-slate-800 font-medium leading-relaxed">
                Kỹ sư CNTT có kinh nghiệm phát triển web và vận hành hệ thống. 
              </p>
              <p className="mt-2 text-slate-500 group-hover:text-slate-700 transition-colors leading-relaxed">
                Có khả năng xử lý sự cố mạng, quản lý server và hỗ trợ người dùng với hiệu suất tối ưu, luôn sẵn sàng học hỏi công nghệ mới.
              </p>
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <h2 className="text-xs font-bold text-blue-600 mb-4 uppercase tracking-[0.3em] flex items-center gap-4">
              Kỹ năng chuyên môn <div className="h-[1px] flex-1 bg-slate-200"></div>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Hạ tầng mạng', list: 'LAN, WiFi, DNS, DHCP' },
                { title: 'Phát triển Web', list: 'Next.js, PHP, MySQL' },
                { title: 'Hệ thống', list: 'Linux, Docker, Vercel' },
                { title: 'Công cụ', list: 'Redis, RabbitMQ, Git' }
              ].map((skill, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-300">
                  <h3 className="text-slate-900 font-bold text-sm mb-2">{skill.title}</h3>
                  <p className="text-slate-500 text-sm">{skill.list}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <h2 className="text-xs font-bold text-blue-600 mb-4 uppercase tracking-[0.3em] flex items-center gap-4">
              Kinh nghiệm làm việc <div className="h-[1px] flex-1 bg-slate-200"></div>
            </h2>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <ul className="space-y-4">
                {[
                  'Phát triển hệ thống web PHP quy mô lớn',
                  'Tối ưu hóa Database với hàng triệu bản ghi',
                  'Triển khai và vận hành hệ thống Server Cloud/On-premise',
                  'Xây dựng quy trình CI/CD cho dự án'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
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
