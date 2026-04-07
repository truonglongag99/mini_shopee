import { NextRequest, NextResponse } from 'next/server'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function parseShopeeUrl(url: string): { shopId: string; itemId: string } | null {
  // Pattern 1: shopee.vn/...-i.{shopId}.{itemId}
  const match1 = url.match(/i\.(\d+)\.(\d+)/)
  if (match1) return { shopId: match1[1], itemId: match1[2] }

  // Pattern 2: shopee.vn/{username}/{shopId}/{itemId}
  const match2 = url.match(/shopee\.vn\/[^/]+\/(\d+)\/(\d+)/)
  if (match2) return { shopId: match2[1], itemId: match2[2] }

  return null
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
  if (!parsed) return NextResponse.json({ error: 'Không parse được URL Shopee', resolvedUrl: url }, { status: 400 })

  const { shopId, itemId } = parsed

  const apiRes = await fetch(
    `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://shopee.vn/`,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'vi,en;q=0.9',
        'x-api-source': 'pc',
        'x-requested-with': 'XMLHttpRequest',
        'af-ac-enc-dat': '0',
      },
    }
  )

  if (!apiRes.ok) {
    const errText = await apiRes.text().catch(() => '')
    return NextResponse.json({ error: `Shopee API lỗi ${apiRes.status}: ${errText.slice(0, 200)}` }, { status: 500 })
  }

  const data = await apiRes.json()
  if (data?.error || !data?.data) {
    return NextResponse.json({ error: `Shopee trả lỗi: ${JSON.stringify(data?.error ?? data).slice(0, 200)}` }, { status: 500 })
  }

  const item = data?.data?.item

  if (!item) return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })

  const name = item.name ?? ''
  const price = item.price ? item.price / 100000 : item.price_min ? item.price_min / 100000 : 0
  const imageId = item.image ?? item.images?.[0]
  const imageUrl = imageId ? `https://down-vn.img.susercontent.com/file/${imageId}` : ''
  const category = item.categories?.[item.categories.length - 1]?.display_name ?? ''

  return NextResponse.json({ name, price, imageUrl, category })
}
