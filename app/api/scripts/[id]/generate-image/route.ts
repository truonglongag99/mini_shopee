import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

fal.config({ credentials: process.env.FAL_KEY })

const openai = new OpenAI()

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
  if (!script.imagePrompt)
    return NextResponse.json({ error: 'No image prompt found' }, { status: 400 })

  let imageUrl = ''

  try {
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: script.imagePrompt,
        image_size: 'square_hd',
        num_images: 1,
      },
    }) as unknown as { images: { url: string }[] }
    imageUrl = result.images[0].url
  } catch {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: script.imagePrompt,
      size: '1024x1024',
      n: 1,
    })
    imageUrl = response.data?.[0]?.url ?? ''
  }

  if (!imageUrl)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })

  await prisma.script.update({
    where: { id },
    data: { generatedImageUrl: imageUrl },
  })

  return NextResponse.json({ imageUrl })
}
