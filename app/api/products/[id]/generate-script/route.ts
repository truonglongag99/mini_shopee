import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic()
const openai = new OpenAI()

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product)
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const prompt = `Bạn là chuyên gia tạo content affiliate marketing đa nền tảng (TikTok, Instagram, Facebook, Threads) theo phong cách: nhân vật tự kể chuyện + fact bất ngờ + hài hước nhẹ.

Thông tin sản phẩm:
- Tên: ${product.name}
- Danh mục: ${product.category}
- Giá: ${product.price.toLocaleString('vi-VN')}đ
- Mô tả: ${product.description ?? 'Không có mô tả'}

Yêu cầu:
- Nhân vật: 1 hoặc 2, có thể là người/thú cưng/động vật tự kể — chọn theo mô tả sản phẩm
- Tone cơ bản: có ích (fact thật) + hài hước bạo miệng kiểu TikTok VN — nói thẳng, hơi lố, phá cách, twist bất ngờ, hook gây sốc nhẹ
- Điều chỉnh tone theo sản phẩm:
  + Sản phẩm giáo dục giới tính / sức khỏe tình dục: dùng ngôn từ hơi tục nhẹ, ám chỉ táo bạo, thẳng thắn về chủ đề nhạy cảm nhưng vẫn mang tính giáo dục
  + Sản phẩm thời trang / quần áo nữ / đồ lót: dùng lời lẽ khêu gợi nhẹ, gợi cảm, tôn vinh vẻ đẹp cơ thể
  + Sản phẩm thú cưng / trẻ em / gia đình: hài hước dễ thương, "mất dạy" kiểu ngây thơ
  + Các sản phẩm khác: bạo miệng vui vẻ, gen Z, không quá nhạy cảm
- Xưng hô:
  + Sản phẩm dành cho nữ (thời trang nữ, mỹ phẩm, đồ lót, skincare...): xưng "tui", gọi người đọc là "mấy bà"
  + Sản phẩm khác: xưng "tui", gọi người đọc là "mấy ông/bạn" hoặc trung tính
- Caption ngắn (TikTok/Threads): hook cực mạnh, 3-5 dòng, emoji nhiều, ngôn ngữ gen Z VN, "Link trong bio 🔗"
- Caption dài (Facebook/Instagram): kể chuyện táo bạo hơn, có fact bất ngờ, kết có giá + link

Trả về JSON theo đúng format sau, không thêm bất kỳ text nào ngoài JSON:
{
  "title": "tiêu đề nội dung",
  "setting": "mô tả bối cảnh",
  "characters": ["tên nhân vật"],
  "scenes": [
    {
      "character": "tên nhân vật",
      "line": "lời thoại",
      "action": "hành động/biểu cảm"
    }
  ],
  "cta": "câu kêu gọi mua có giá và nhắc Shopee",
  "imagePrompt": "Detailed English prompt for AI image generation — describe scene, characters, lighting, style, mood. Photorealistic, vibrant, social media ready.",
  "shortCaption": "Caption TikTok/Threads: nhân vật xưng tao/tôi tự kể, có fact bất ngờ, hài hước, 3-5 dòng, emoji phù hợp, kết bằng 'Link trong bio 🔗'",
  "longCaption": "Caption Facebook/Instagram: nhân vật tự giới thiệu, kể chuyện có fact thú vị, hài hước, 5-8 dòng, kết bằng giá + '[affiliate link]' + hashtags",
  "hashtags": ["#hashtag1", "#hashtag2"]
}`

  let raw = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch {
    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = message.choices[0].message.content ?? ''
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const parsed = JSON.parse(cleaned)

  const script = await prisma.script.create({
    data: {
      productId: id,
      title: parsed.title,
      setting: parsed.setting,
      characters: parsed.characters,
      scenes: parsed.scenes,
      cta: parsed.cta,
      imagePrompt: parsed.imagePrompt ?? null,
      shortCaption: parsed.shortCaption ?? null,
      longCaption: parsed.longCaption ?? null,
      hashtags: parsed.hashtags ?? [],
      status: 'draft',
    },
  })

  return NextResponse.json(script, { status: 201 })
}
