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

  const prompt = `Bạn là chuyên gia viết kịch bản video ngắn TikTok cho affiliate marketing Shopee.

Thông tin sản phẩm:
- Tên: ${product.name}
- Danh mục: ${product.category}
- Giá: ${product.price.toLocaleString('vi-VN')}đ
- Mô tả: ${product.description ?? 'Không có mô tả'}

Hãy viết kịch bản video ngắn khoảng 10 giây, phù hợp với mô tả sản phẩm. Lưu ý:
- Số nhân vật: 1 hoặc 2 tùy theo mô tả sản phẩm phù hợp
- Nhân vật có thể là người, động vật, hoặc thú cưng đang "tự kể" về sản phẩm
- Nếu là động vật: viết như thể chúng đang nói chuyện tự nhiên về trải nghiệm dùng sản phẩm
- Ngôn ngữ, giọng điệu phù hợp với đối tượng trong mô tả

Trả về JSON theo đúng format sau, không thêm bất kỳ text nào ngoài JSON:
{
  "title": "tiêu đề kịch bản",
  "setting": "mô tả bối cảnh cảnh quay",
  "characters": ["tên/loài nhân vật 1"],
  "scenes": [
    {
      "character": "tên nhân vật",
      "line": "lời thoại",
      "action": "hành động/biểu cảm ngắn"
    }
  ],
  "cta": "câu kêu gọi mua hàng cuối video có giá và nhắc Shopee"
}`

  let raw = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    raw = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch {
    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
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
      status: 'draft',
    },
  })

  return NextResponse.json(script, { status: 201 })
}
