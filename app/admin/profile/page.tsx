'use client'

import Link from 'next/link'
import { useEffect } from 'react'

// Tách dữ liệu ra ngoài để code gọn gàng và dễ quản lý
const SKILLS = [
  { title: 'Hạ tầng mạng', list: 'LAN, WiFi, DNS, DHCP' },
  { title: 'Phát triển Web', list: 'Next.js, PHP, MySQL' },
  { title: 'Hệ thống', list: 'Linux, Docker, Vercel' },
  { title: 'Công cụ', list: 'Redis, RabbitMQ, Git' }
];

const GEARMENT_EXP = [
  'Vận hành và duy trì hệ thống e-commerce POD hoạt động ổn định',
  'Xử lý sự cố hệ thống, đảm bảo uptime và hiệu năng',
  'Phối hợp xử lý lỗi phát sinh trong quá trình vận hành',
  'Xây dựng và duy trì API phục vụ hệ thống',
  'Quản lý và tối ưu database lớn với MySQL',
  'Sử dụng Redis để xử lý queue và background jobs',
  'Triển khai và quản lý hệ thống trên server'
];

const THREE_F_EXP = [
  'Phát triển và maintain website cho các tiệm nail (US market)',
  'Tùy chỉnh giao diện theo yêu cầu khách hàng',
  'Xử lý lỗi website và đảm bảo hoạt động ổn định',
  'Làm việc với database và hệ thống quản lý nội dung'
];

const GENERAL_EXP = [
  'Phát triển hệ thống web',
  'Tối ưu hóa Database với hàng triệu bản ghi',
  'Triển khai và vận hành hệ thống Server Cloud/On-premise',
  'Xây dựng quy trình CI/CD cho dự án'
];

export default function MyProfilePage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-8')
          // Sau khi đã hiện ra thì không cần quan sát nữa để tiết kiệm tài nguyên
          observer.unobserve(entry.target)
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
                src="/images/avatar.png" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg relative z-10" 
                alt="Avatar"
              />
            </div>
            <h1 className="text-2xl font-extrabold mb-1 tracking-tight text-slate-900">TRƯƠNG ĐỨC LONG</h1>
            <p className="text-blue-600 font-semibold mb-8 tracking-wider uppercase text-xs">IT Support / System Specialist</p>

            <div className="text-sm text-slate-600 space-y-3 mb-8 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">📞</span>
                <a href="tel:0377767281" className="hover:text-blue-600 transition-colors font-semibold decoration-blue-200 decoration-2 underline-offset-4 hover:underline">
                  0377 767 281
                </a>
              </p>
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">✉</span>
                <a href="mailto:truongduclong@gmail.com" className="hover:text-blue-600 transition-colors font-medium decoration-blue-200 hover:underline underline-offset-4">
                  truongduclongag@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">📍</span>
                <span>Bình Thạnh Đông, An Giang, Việt Nam</span>
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="flex-1 p-6 md:p-16 space-y-12 overflow-y-auto max-h-screen bg-white/30">
          
          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-xl font-bold text-blue-600 mb-4 uppercase tracking-wider flex items-center gap-4">
              Giới thiệu <div className="h-[1px] flex-1 bg-slate-200"></div>
            </h2>
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
              <p className="text-slate-800 font-medium leading-relaxed">
                Kỹ sư CNTT với kinh nghiệm vận hành hệ thống và hỗ trợ người dùng trong môi trường thực tế. Có khả năng xử lý sự cố máy tính, mạng nội bộ (LAN/WiFi) và quản lý server cơ bản. Đồng thời có nền tảng phát triển web (PHP) và từng tham gia xây dựng, vận hành hệ thống e-commerce theo mô hình Print-on-Demand.
              </p>
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <h2 className="text-xl font-bold text-blue-600 mb-4 uppercase tracking-wider flex items-center gap-4">
              Kinh nghiệm chi tiết <div className="h-[1px] flex-1 bg-slate-200"></div>
            </h2>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Backend Developer – Gearment</h3>
                  <a href="https://gearment.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline inline-flex items-center gap-1">
                    https://gearment.com/ <span className="text-[10px]">↗</span>
                  </a>
                </div>
              </div>
              <ul className="grid grid-cols-1 gap-y-3">
                {GEARMENT_EXP.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3F Experience */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Web Developer – 3F (đối tác của Fastboy Marketing)</h3>
                </div>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded uppercase tracking-wider">Web Development</span>
              </div>
              <ul className="grid grid-cols-1 gap-y-3 mt-4">
                {THREE_F_EXP.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <h2 className="text-xl font-bold text-blue-600 mb-4 uppercase tracking-wider flex items-center gap-4">
              Kỹ năng chuyên môn <div className="h-[1px] flex-1 bg-slate-200"></div>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SKILLS.map((skill, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-400 hover:shadow-blue-100/50 transition-all duration-300">
                  <h3 className="text-blue-600 font-bold text-base mb-2">{skill.title}</h3>
                  <p className="text-slate-500 text-sm">{skill.list}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="section-animate opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <h2 className="text-xl font-bold text-blue-600 mb-4 uppercase tracking-wider flex items-center gap-4">
              Kinh nghiệm làm việc <div className="h-[1px] flex-1 bg-slate-200"></div>
            </h2>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <ul className="space-y-4">
                {GENERAL_EXP.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
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
