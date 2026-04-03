import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic()
const openai = new OpenAI()

export async function POST(request: NextRequest) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, category, rawContent } = await request.json().catch(() => ({}))
  if (!rawContent)
    return NextResponse.json({ error: 'Missing rawContent' }, { status: 400 })

  const prompt = `Bạn là chuyên gia viết mô tả sản phẩm cho affiliate marketing TikTok/Shopee.

Thông tin:
- Tên sản phẩm: ${name ?? 'Chưa có'}
- Danh mục: ${category ?? 'Chưa có'}
- Nội dung thô: ${rawContent}

Hãy viết lại thành mô tả sản phẩm súc tích, tự nhiên, phù hợp để AI tạo kịch bản drama TikTok. Bao gồm: công dụng, đối tượng phù hợp, điểm nổi bật. Cuối mô tả thêm 1 dòng gợi ý nhân vật và bối cảnh phù hợp cho kịch bản video. Trả về chỉ nội dung mô tả, không thêm tiêu đề hay markdown.`

  let description = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    description = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch {
    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    description = message.choices[0].message.content ?? ''
  }

  return NextResponse.json({ description })
}
