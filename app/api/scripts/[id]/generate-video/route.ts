import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Scene = { character: string; line: string; action: string }

function buildPrompt(script: { setting: string; characters: unknown; scenes: unknown; cta: string }): string {
  const characters = script.characters as string[]
  const scenes = script.scenes as Scene[]
  const dialogue = scenes
    .map(s => `${s.character} (${s.action}): "${s.line}"`)
    .join('\n')
  return `Short drama video, 9:16 vertical format, cinematic style.

Setting: ${script.setting}
Characters: ${characters.join(', ')}

Scene:
${dialogue}

End with: ${script.cta}

Style: realistic, natural lighting, Vietnamese lifestyle, TikTok drama style.`
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function getKlingToken(): string {
  const apiKey = process.env.KLING_ACCESS_KEY!
  const secretKey = process.env.KLING_SECRET_KEY!
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ iss: apiKey, iat: now, exp: now + 1800 }))
  const signature = base64url(
    createHmac('sha256', secretKey).update(`${header}.${payload}`).digest()
  )
  return `${header}.${payload}.${signature}`
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const script = await prisma.script.findUnique({ where: { id } })

  if (!script)
    return NextResponse.json({ error: 'Script not found' }, { status: 404 })
  if (script.status !== 'approved')
    return NextResponse.json({ error: 'Script must be approved first' }, { status: 400 })
  if (script.videoStatus === 'pending')
    return NextResponse.json({ error: 'Video already being generated' }, { status: 400 })

  await prisma.script.update({ where: { id }, data: { videoStatus: 'pending' } })

  const token = getKlingToken()

  const res = await fetch('https://api.klingai.com/v1/videos/text2video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: buildPrompt(script),
      duration: '5',
      aspect_ratio: '9:16',
      mode: 'std',
      version: '1.6',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    await prisma.script.update({ where: { id }, data: { videoStatus: 'failed' } })
    return NextResponse.json({ error: err?.message ?? 'Failed to submit video job' }, { status: 500 })
  }

  const data = await res.json()
  const taskId = data?.data?.task_id ?? data?.task_id ?? null

  await prisma.script.update({ where: { id }, data: { taskId } })

  return NextResponse.json({ status: 'pending', taskId })
}
