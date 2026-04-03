import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

  await prisma.script.update({ where: { id }, data: { videoStatus: 'pending' } })

  try {
    const result = await fal.subscribe('fal-ai/kling-video/v1.6/standard/text-to-video', {
      input: {
        prompt: buildPrompt(script),
        duration: '5',
        aspect_ratio: '9:16',
      },
    }) as { video: { url: string } }

    const videoUrl = result.video.url

    await prisma.script.update({
      where: { id },
      data: { videoStatus: 'completed', videoUrl },
    })

    return NextResponse.json({ videoUrl })
  } catch {
    await prisma.script.update({ where: { id }, data: { videoStatus: 'failed' } })
    return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
  }
}
