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

  // ============================================================
// STEP 1: INJECT RANDOMNESS TỪ CODE — không để model tự chọn
// ============================================================

const contentTypes = [
  "Kể chuyện trải nghiệm cá nhân",
  "Hỏi ý kiến gây tranh luận",
  "Tình huống hài hước / fail",
  "Review bất ngờ (twist)",
  "So sánh trước - sau",
  "Góc nhìn gây tranh cãi nhẹ",
];

const contextScenarios = [
  "đang cuộn feed lúc 11 giờ đêm",
  "vừa nhận hàng xong",
  "đang nằm ườn cuối tuần",
  "vừa đi làm về mệt",
  "đang ngồi café một mình",
  "đang dọn tủ đồ",
];

const characterMoods = [
  "đang bực bội nhẹ",
  "bất ngờ theo chiều hướng tốt",
  "hoài nghi lúc đầu",
  "hào hứng thái quá",
  "thờ ơ rồi bị cuốn",
  "đang so sánh lung tung",
];

const cameraAngles = [
  "close-up tay cầm sản phẩm, ánh sáng tự nhiên ban ngày",
  "flat lay trên nền pastel, góc chụp từ trên xuống",
  "POV người dùng đang thử sản phẩm lần đầu",
  "lifestyle shot trong phòng ngủ, đèn vàng ấm",
  "candid shot kiểu chụp lén tự nhiên ngoài đường",
];

const selectedType     = contentTypes[Math.floor(Math.random() * contentTypes.length)];
const selectedContext  = contextScenarios[Math.floor(Math.random() * contextScenarios.length)];
const selectedMood     = characterMoods[Math.floor(Math.random() * characterMoods.length)];
const selectedAngle    = cameraAngles[Math.floor(Math.random() * cameraAngles.length)];
const hasCTA           = Math.random() > 0.4; // 60% có CTA, 40% không

// ============================================================
// STEP 2: DETECT GENDER HINT TỪ DANH MỤC
// ============================================================

const femaleCategories = ["thời trang nữ", "đồ lót", "mỹ phẩm", "skincare", "phụ kiện nữ"];
const isFemaleCategory = femaleCategories.some(c =>
  product.category.toLowerCase().includes(c)
);
const pronounSet = isFemaleCategory
  ? `"tui" - "mấy bà" - "chị em"`
  : `"tui" - "mấy ông" - "mọi người"`;

// ============================================================
// STEP 3: PROMPT CHÍNH
// ============================================================

const prompt = `
Bạn là chuyên gia viết content mạng xã hội cho affiliate marketing tại Việt Nam.
Nhiệm vụ: tạo 1 content piece hoàn chỉnh cho sản phẩm dưới đây.

====================
THÔNG TIN SẢN PHẨM:
- Tên: ${product.name}
- Danh mục: ${product.category}
- Giá: ${product.price.toLocaleString("vi-VN")}đ
- Mô tả: ${product.description ?? "Không có mô tả"}
====================

====================
THÔNG SỐ BẮT BUỘC (KHÔNG ĐƯỢC THAY ĐỔI):
- Kiểu nội dung: ${selectedType}
- Bối cảnh nhân vật: Nhân vật đang ${selectedContext}
- Trạng thái cảm xúc: ${selectedMood}
- Góc ảnh gợi ý: ${selectedAngle}
- CTA: ${hasCTA ? "CÓ — nhưng phải mềm, gợi mở, không bán trực tiếp" : "KHÔNG có CTA — kết bằng cảm xúc hoặc câu hỏi bỏ ngỏ"}
====================

====================
NGUYÊN TẮC NỘI DUNG:
- KHÔNG viết như quảng cáo
- KHÔNG dùng "link trong bio" hoặc "mua ngay"
- KHÔNG lặp lại hook quen thuộc ("ai cần thì dm", "review thật lòng nha")
- Văn phong tự nhiên — có thể có lỗi nhỏ, câu ngắn, ngắt dòng bất ngờ
- Ưu tiên cảm xúc và câu chuyện hơn thông tin sản phẩm
====================

====================
ĐIỀU CHỈNH THEO DANH MỤC (${product.category}):
${
  /thời trang|đồ lót|nữ|bikini/i.test(product.category)
    ? "→ Gợi cảm tinh tế, tập trung cảm nhận khi mặc / tự tin hơn, KHÔNG mô tả cơ thể trực tiếp"
    : /sức khỏe|giới tính|sinh lý/i.test(product.category)
      ? "→ Thẳng thắn kiểu chia sẻ giữa bạn bè, không dung tục, có thể dùng từ lóng quen"
      : /thú cưng|pet|chó|mèo/i.test(product.category)
        ? "→ Dễ thương, nhân hoá thú cưng, hài kiểu ngây thơ vô số tội"
        : /gia đình|trẻ em|mẹ bầu/i.test(product.category)
          ? "→ Ấm áp, thật thà, nói về khoảnh khắc đời thường"
          : "→ Vui vẻ, relatable, khai thác tình huống đời thường ai cũng gặp"
}
====================

====================
XƯNG HÔ: ${pronounSet}
====================

====================
VÍ DỤ SAI ❌ — KHÔNG viết như này:
"Sản phẩm này thật sự quá tốt luôn! Tui dùng rồi thấy hiệu quả ngay. 
Ai muốn mua thì link trong bio nha mọi người! Đừng bỏ lỡ!"

VÍ DỤ ĐÚNG ✅ — Hãy viết gần giống thế này:
"Hôm qua chồng tui nhìn tui kiểu lạ lắm
không nói gì hết, chỉ đi nấu cơm luôn không cần nhắc
tui cũng không hiểu sao... mà thôi kệ"
====================

====================
CẤU TRÚC SCENES:
- 4 đến 6 cảnh
- Mỗi "line" tối đa 2 câu ngắn
- Cảnh đầu: hook — gây tò mò hoặc nhận dạng được ngay
- Cảnh giữa: build up cảm xúc / tình huống
- Cảnh cuối: twist hoặc kết tự nhiên
====================

====================
OUTPUT FORMAT — JSON THUẦN, KHÔNG THÊM BẤT CỨ TEXT NÀO BÊN NGOÀI:
{
  "title": "tiêu đề nội dung (dùng nội bộ)",
  "setting": "mô tả bối cảnh cụ thể (thời gian, địa điểm, tình huống)",
  "characters": ["tên nhân vật 1 (vai trò, tính cách)", "tên nhân vật 2 nếu có"],
  "scenes": [
    {
      "character": "tên nhân vật",
      "line": "lời thoại tự nhiên, tối đa 2 câu",
      "action": "hành động hoặc biểu cảm cụ thể"
    }
  ],
  "cta": ${hasCTA ? '"câu kết gợi mở tự nhiên — không bán hàng trực tiếp"' : 'null'},
  "imagePrompt": "Photorealistic vertical social media photo. ${selectedAngle}. Scene: [mô tả cảnh cụ thể liên quan sản phẩm]. Characters: beautiful Vietnamese woman, fair smooth porcelain skin, curvy hourglass body with soft rounded figure, naturally seductive posture, [mô tả trang phục phù hợp sản phẩm]. Lighting: natural/warm/soft. Style: candid lifestyle, not staged. Colors: vibrant but natural. No text, no watermark, no logo.",
  "tiktokHook": "Câu hook đầu tiên cho video TikTok — tối đa 1 câu, đủ mạnh để giữ người xem không vuốt qua",
  "shortCaption": "Caption TikTok/Threads — 3 đến 5 dòng, hook mạnh dòng đầu, tự nhiên như status người thật, có thể có emoji, KHÔNG rõ là quảng cáo",
  "longCaption": "Caption Facebook — viết như người dùng thật đang chia sẻ trải nghiệm cá nhân, có thông tin hữu ích/fact thật về sản phẩm, xen 1 câu hài mang tính tranh cãi nhẹ (kiểu nói thẳng gây ý kiến trái chiều nhưng không xúc phạm), 6-10 dòng, không lộ là quảng cáo, CTA nếu có phải cực kỳ tự nhiên",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7"]
}
====================
`;

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
      cta: parsed.cta ?? '',
      imagePrompt: parsed.imagePrompt ?? null,
      tiktokHook: parsed.tiktokHook ?? null,
      shortCaption: parsed.shortCaption ?? null,
      longCaption: parsed.longCaption ?? null,
      hashtags: parsed.hashtags ?? [],
      status: 'draft',
    },
  })

  return NextResponse.json(script, { status: 201 })
}
