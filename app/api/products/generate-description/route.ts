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

Viết mô tả sản phẩm ngắn gọn (tối đa 150 từ), plain text, không markdown, gồm:
- Công dụng chính + đối tượng phù hợp (1-2 câu)
- 1 fact bất ngờ/ít ai biết về sản phẩm (1 câu)
- Nhân vật kể chuyện phù hợp nhất + góc hài hước có thể khai thác (1-2 câu)`

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
