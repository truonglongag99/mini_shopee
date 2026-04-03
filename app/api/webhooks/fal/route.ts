import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const scriptId = request.nextUrl.searchParams.get('scriptId')
  if (!scriptId)
    return NextResponse.json({ error: 'Missing scriptId' }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const status = body.data?.status as string
  const videoUrl = body.data?.output?.video_url ?? body.data?.output?.video as string | undefined

  if (status === 'completed' && videoUrl) {
    await prisma.script.update({
      where: { id: scriptId },
      data: { videoStatus: 'completed', videoUrl },
    })
  } else if (status === 'failed' || !videoUrl) {
    await prisma.script.update({ where: { id: scriptId }, data: { videoStatus: 'failed' } })
  }

  return NextResponse.json({ ok: true })
}
