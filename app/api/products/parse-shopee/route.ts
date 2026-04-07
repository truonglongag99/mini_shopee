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

  // Fetch the product page HTML and parse embedded JSON
  const pageRes = await fetch(
    `https://shopee.vn/product/${shopId}/${itemId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9',
      },
    }
  )

  if (!pageRes.ok)
    return NextResponse.json({ error: `Không tải được trang Shopee (${pageRes.status})` }, { status: 500 })

  const html = await pageRes.text()

  // Parse __NEXT_DATA__ embedded JSON
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!nextDataMatch)
    return NextResponse.json({ error: 'Không tìm thấy dữ liệu sản phẩm trong trang' }, { status: 404 })

  const nextData = JSON.parse(nextDataMatch[1])
  const item = nextData?.props?.pageProps?.initialData?.data?.item
    ?? nextData?.props?.pageProps?.productInfo
    ?? nextData?.props?.pageProps?.data?.item

  if (!item)
    return NextResponse.json({ error: 'Không parse được thông tin sản phẩm', keys: Object.keys(nextData?.props?.pageProps ?? {}) }, { status: 404 })

  const name = item.name ?? ''
  const price = item.price ? item.price / 100000 : item.price_min ? item.price_min / 100000 : 0
  const imageId = item.image ?? item.images?.[0]
  const imageUrl = imageId ? `https://down-vn.img.susercontent.com/file/${imageId}` : ''
  const category = item.categories?.[item.categories.length - 1]?.display_name ?? ''

  return NextResponse.json({ name, price, imageUrl, category })
}
