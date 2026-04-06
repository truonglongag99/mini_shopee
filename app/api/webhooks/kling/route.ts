import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const scriptId = request.nextUrl.searchParams.get('scriptId')
  if (!scriptId)
    return NextResponse.json({ error: 'Missing scriptId' }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  // Kling callback structure:
  // { task_id, task_status, task_status_msg, data: { works: [{ video: { resource: "url" } }] } }
  const taskStatus = body.task_status as string
  const videoUrl = body.data?.works?.[0]?.video?.resource as string | undefined

  if (taskStatus === 'succeed' && videoUrl) {
    await prisma.script.update({
      where: { id: scriptId },
      data: { videoStatus: 'completed', videoUrl },
    })
  } else if (taskStatus === 'failed') {
    await prisma.script.update({
      where: { id: scriptId },
      data: { videoStatus: 'failed' },
    })
  }

  return NextResponse.json({ ok: true })
}
