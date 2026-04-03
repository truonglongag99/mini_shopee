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

  const prompt = `Bạn là chuyên gia viết nội dung affiliate marketing đa nền tảng (TikTok, Instagram, Facebook, Threads).

Thông tin:
- Tên sản phẩm: ${name ?? 'Chưa có'}
- Danh mục: ${category ?? 'Chưa có'}
- Nội dung thô: ${rawContent}

Hãy viết mô tả sản phẩm theo cấu trúc sau (trả về plain text, không markdown):

1. Công dụng & điểm nổi bật thực sự của sản phẩm
2. Đối tượng phù hợp
3. Fact ít ai biết hoặc sự thật bất ngờ về sản phẩm/vấn đề mà SP giải quyết (1-2 fact cụ thể, có thể hơi gây sốc nhẹ)
4. Gợi ý nhân vật kể chuyện: người dùng, thú cưng, hoặc chính sản phẩm — nhân vật nào phù hợp nhất để tạo content hài hước + có ích
5. Góc hài hước có thể khai thác (ví dụ: nhân vật "sống sang hơn chủ", "tiết lộ bí mật", "phản ứng cường điệu")`

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
