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

  const prompt = `Bạn là chuyên gia viết nội dung sản phẩm cho affiliate marketing.

Thông tin đầu vào:
- Tên sản phẩm: ${name ?? 'Chưa có'}
- Danh mục: ${category ?? 'Chưa có'}
- Nội dung thô (giữ nguyên các thông tin quan trọng): ${rawContent}

Viết mô tả sản phẩm (tối đa 150 từ), plain text, không markdown, theo thứ tự:

1. ĐẶC ĐIỂM SẢN PHẨM (bắt buộc giữ nguyên, không bịa): màu sắc, chất liệu, kiểu dáng, kích thước, thương hiệu, tính năng nổi bật — những gì có trong nội dung thô thì giữ nguyên để AI tạo ảnh đúng sản phẩm
2. Công dụng chính + đối tượng phù hợp (1-2 câu)
3. 1 fact thú vị hoặc lợi ích ít ai để ý (1 câu)
4. Góc khai thác content hài hước/cảm xúc phù hợp (1 câu)

QUAN TRỌNG: Phần đặc điểm sản phẩm phải chính xác với thực tế — không thêm màu sắc, chất liệu, hay tính năng không có trong nội dung thô.`

  let description = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    description = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch {
    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    description = message.choices[0].message.content ?? ''
  }

  return NextResponse.json({ description })
}
