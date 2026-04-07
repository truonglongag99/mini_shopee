import { NextRequest, NextResponse } from 'next/server'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function parseShopeeUrl(url: string): { shopId: string; itemId: string } | null {
  const match = url.match(/i\.(\d+)\.(\d+)/)
  if (!match) return null
  return { shopId: match[1], itemId: match[2] }
}

async function resolveShortUrl(url: string): Promise<string> {
  // Follow redirects to get the actual product URL
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  return res.url
}

export async function POST(request: NextRequest) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  // Resolve short URL (s.shopee.vn)
  if (url.includes('s.shopee.vn') || !url.includes('i.')) {
    try {
      url = await resolveShortUrl(url)
    } catch {
      return NextResponse.json({ error: 'Không resolve được link affiliate' }, { status: 400 })
    }
  }

  const parsed = parseShopeeUrl(url)
  if (!parsed) return NextResponse.json({ error: 'Không parse được URL Shopee' }, { status: 400 })

  const { shopId, itemId } = parsed

  const res = await fetch(
    `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://shopee.vn/',
        'Accept': 'application/json',
      },
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'Không lấy được thông tin sản phẩm' }, { status: 500 })

  const data = await res.json()
  const item = data?.data?.item

  if (!item) return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })

  const name = item.name ?? ''
  const price = item.price ? item.price / 100000 : item.price_min ? item.price_min / 100000 : 0
  const imageId = item.image ?? item.images?.[0]
  const imageUrl = imageId ? `https://down-vn.img.susercontent.com/file/${imageId}` : ''
  const category = item.categories?.[item.categories.length - 1]?.display_name ?? ''

  return NextResponse.json({ name, price, imageUrl, category })
}
