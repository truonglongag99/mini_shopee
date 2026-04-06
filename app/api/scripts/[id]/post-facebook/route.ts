import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PAGE_ID = process.env.FB_PAGE_ID!
const PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN!

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!PAGE_ID || !PAGE_TOKEN)
    return NextResponse.json({ error: 'Chưa cấu hình FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN' }, { status: 500 })

  const { id } = await context.params
  const script = await prisma.script.findUnique({
    where: { id },
    include: { product: { select: { affiliateUrl: true } } },
  })
  if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 })

  const affiliateUrl = script.product.affiliateUrl ?? ''
  const hashtags = script.hashtags && (script.hashtags as string[]).length > 0
    ? '\n' + (script.hashtags as string[]).join(' ')
    : ''

  const message = [
    script.longCaption ?? script.shortCaption ?? '',
    hashtags,
    affiliateUrl ? '\n\n🛒 Mua ngay: ' + affiliateUrl : '',
  ].join('').trim()

  let result: { id?: string; error?: { message: string } }

  if (script.generatedImageUrl) {
    // Post as photo with caption
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: script.generatedImageUrl,
          caption: message,
          access_token: PAGE_TOKEN,
        }),
      }
    )
    result = await res.json()
  } else {
    // Post as text + link preview
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          link: affiliateUrl || undefined,
          access_token: PAGE_TOKEN,
        }),
      }
    )
    result = await res.json()
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 })
  }

  return NextResponse.json({ postId: result.id })
}
