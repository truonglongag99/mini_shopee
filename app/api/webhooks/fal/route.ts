import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const scriptId = request.nextUrl.searchParams.get('scriptId')
  if (!scriptId)
    return NextResponse.json({ error: 'Missing scriptId' }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const status = body.status as string

  if (status === 'OK') {
    const videoUrl = body.payload?.video?.url as string | undefined
    if (!videoUrl) {
      await prisma.script.update({ where: { id: scriptId }, data: { videoStatus: 'failed' } })
      return NextResponse.json({ ok: true })
    }
    await prisma.script.update({
      where: { id: scriptId },
      data: { videoStatus: 'completed', videoUrl },
    })
  } else {
    await prisma.script.update({ where: { id: scriptId }, data: { videoStatus: 'failed' } })
  }

  return NextResponse.json({ ok: true })
}
