import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ScriptList } from '@/components/admin/ScriptList'

export const dynamic = 'force-dynamic'

export default async function ScriptsPage() {
  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true, imageUrl: true, category: true, affiliateUrl: true } } },
  })
  const serialized = JSON.parse(JSON.stringify(scripts))
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Quay lại</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Kịch bản</h1>
            <p className="text-xs text-gray-400">{scripts.length} kịch bản</p>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <ScriptList scripts={serialized} />
      </div>
    </div>
  )
}
