import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

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

Hãy viết kịch bản drama tự nhiên khoảng 30 giây, 2 nhân vật đang nói chuyện với nhau. Nhân vật, ngôn ngữ và tình huống phải phù hợp với mô tả sản phẩm.

Trả về JSON theo đúng format sau, không thêm bất kỳ text nào ngoài JSON:
{
  "title": "tiêu đề kịch bản",
  "setting": "mô tả bối cảnh cảnh quay",
  "characters": ["tên nhân vật 1", "tên nhân vật 2"],
  "scenes": [
    {
      "character": "tên nhân vật",
      "line": "lời thoại",
      "action": "hành động/biểu cảm ngắn"
    }
  ],
  "cta": "câu kêu gọi mua hàng cuối video có giá và nhắc Shopee"
}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = JSON.parse(raw)

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
