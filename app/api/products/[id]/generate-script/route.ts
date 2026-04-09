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

// Chọn content type theo ngày trong tuần (0=CN, 1=T2, ..., 6=T7)
const contentTypeByDay: Record<number, string> = {
  1: "Tự ti → cải thiện: nhân vật từng mặc cảm / ngại ngùng, sản phẩm giúp lấy lại tự tin",
  2: "Lần đầu thử bất ngờ: hoài nghi lúc đầu, dùng xong bất ngờ vì kết quả ngoài mong đợi",
  3: "So sánh trước – sau: kể rõ trạng thái trước khi dùng và sự thay đổi cụ thể sau khi dùng",
  4: "Người khác nhận xét: ai đó xung quanh để ý / khen / hỏi mua, nhân vật kể lại",
  5: "Story nhẹ: kể chuyện đời thường có sản phẩm xuất hiện tự nhiên, không đẩy bán",
  6: "Flex nhẹ: mặc lên / dùng lên tự tin hơn, được chú ý hơn — tone nhẹ nhàng không khoe mẽ",
  0: "Re-up: kể lại câu chuyện ấn tượng nhất với sản phẩm, góc nhìn nhìn lại sau thời gian dùng",
}
const dayOfWeek = new Date().getDay()
const selectedType = contentTypeByDay[dayOfWeek]

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

const selectedContext  = contextScenarios[Math.floor(Math.random() * contextScenarios.length)];
const selectedMood     = characterMoods[Math.floor(Math.random() * characterMoods.length)];
const selectedAngle    = cameraAngles[Math.floor(Math.random() * cameraAngles.length)];
const hasCTA           = Math.random() > 0.4; // 60% có CTA, 40% không

// ============================================================
// DETECT SCENE CONTEXT THEO DANH MỤC
// ============================================================
const sceneContext = (() => {
  const cat = product.category.toLowerCase()
  if (/đồ ngủ|pyjama|ngủ|loungewear/.test(cat))
    return 'simple rustic bedroom of a Mekong Delta Vietnamese rural home, wooden furniture, mosquito net, warm ambient light'
  if (/đồ lót|lingerie|bikini/.test(cat))
    return 'simple rustic bedroom of a Mekong Delta Vietnamese rural home, wooden furniture, soft warm lamp light, intimate and tasteful'
  if (/thời trang|áo|quần|váy|đầm/.test(cat))
    return 'rural Mekong Delta Vietnam countryside, lush tropical greenery, banana trees, coconut palms, natural warm sunlight'
  if (/mỹ phẩm|skincare|makeup|son|kem/.test(cat))
    return 'bright vanity table or bathroom counter with natural window light'
  if (/thú cưng|pet|chó|mèo|vẹt/.test(cat))
    return 'cozy rural Mekong Delta home garden, tropical plants, warm natural light, pet in frame'
  if (/gia đình|trẻ em|mẹ bầu/.test(cat))
    return 'warm Mekong Delta rural home kitchen or living room, wooden house, family-friendly atmosphere'
  if (/thể thao|gym|yoga|fitness/.test(cat))
    return 'outdoor riverside or countryside road in Mekong Delta Vietnam, lush greenery, natural morning light'
  return 'rural Mekong Delta Vietnam setting, tropical greenery, natural warm light'
})()

// ============================================================
// STEP 2: DETECT GENDER HINT TỪ DANH MỤC
// ============================================================

const femaleCategories = ["thời trang nữ", "đồ lót", "mỹ phẩm", "skincare", "phụ kiện nữ"];
const isFemaleCategory = femaleCategories.some(c =>
  product.category.toLowerCase().includes(c)
);
const isFemaleClothing = /thời trang nữ|quần áo nữ|váy|đầm|áo nữ|đồ nữ|đồ lót|bra|bikini/i.test(product.category);
const isIntimateClohing = /đồ ngủ|pyjama|ngủ|loungewear|đồ lót|bra|lingerie|bikini/i.test(product.category);
const outdoorScene4 = isIntimateClohing
  ? 'simple rustic bedroom of a Mekong Delta Vietnamese rural home, wooden furniture, mosquito net, warm lamp light'
  : 'rural Mekong Delta Vietnam countryside alley or home porch, tropical plants, coconut trees, warm golden hour light';
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
CẤU TRÚC SCENES (TỐI ƯU CHO VIDEO 5 GIÂY):
- 2 đến 3 cảnh NGẮN — mỗi cảnh tương đương ~1.5-2 giây
- Mỗi "line" TỐI ĐA 1 câu ngắn, nói được trong 1-2 giây
- Cảnh 1: hook cực mạnh — 1 câu gây tò mò hoặc shock nhẹ ngay lập tức
- Cảnh 2: tình huống / sản phẩm xuất hiện tự nhiên
- Cảnh 3 (tùy chọn): twist hoặc reaction ngắn gọn
- KHÔNG có đoạn dài, KHÔNG giải thích, KHÔNG nói nhiều
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
  ${isFemaleClothing ? `"imagePrompts": [
    "Viết 1 image prompt tiếng Anh. Nhân vật: beautiful Vietnamese countryside woman, 158cm, 54kg, slim soft body with gentle curves, long straight black hair, fair smooth skin, slightly round face with natural rural charm, no makeup, gentle warm expression, balanced feminine figure. Cô đang mặc SẢN PHẨM NÀY (mô tả chính xác màu sắc, kiểu dáng, chất liệu của sản phẩm '${product.name}' dựa trên: ${product.description ?? product.name}). Pose: đứng nhìn thẳng vào camera, nụ cười tự nhiên tự tin. Setting: ${sceneContext}. Ánh sáng ban ngày tự nhiên. Candid lifestyle. Photorealistic vertical photo. No text, no logo.",
    "Viết 1 image prompt tiếng Anh. Nhân vật: beautiful Vietnamese countryside woman, 158cm, 54kg, slim soft body with gentle curves, long straight black hair, fair smooth skin, slightly round face with natural rural charm, no makeup, gentle warm expression, balanced feminine figure. Cô đang mặc SẢN PHẨM NÀY (mô tả chính xác màu sắc, kiểu dáng, chất liệu của sản phẩm '${product.name}' dựa trên: ${product.description ?? product.name}). Pose: nghiêng người sang một bên để lộ dáng, nhìn nhẹ ra xa. Setting: ${sceneContext}. Ánh đèn vàng ấm trong nhà. Candid style. Photorealistic vertical photo. No text, no logo.",
    "Viết 1 image prompt tiếng Anh. Nhân vật: beautiful Vietnamese countryside woman, 158cm, 54kg, slim soft body with gentle curves, long straight black hair, fair smooth skin, slightly round face with natural rural charm, no makeup, gentle warm expression, balanced feminine figure. Cô đang mặc SẢN PHẨM NÀY (mô tả chính xác màu sắc, kiểu dáng, chất liệu của sản phẩm '${product.name}' dựa trên: ${product.description ?? product.name}). Pose: đang đi bộ candid shot góc nghiêng nhẹ. Setting: rural Mekong Delta Vietnam countryside road, banana trees, coconut palms, rice fields, warm sunlight. Photorealistic vertical photo. No text, no logo.",
    "Viết 1 image prompt tiếng Anh. Nhân vật: beautiful Vietnamese countryside woman, 158cm, 54kg, slim soft body with gentle curves, long straight black hair, fair smooth skin, slightly round face with natural rural charm, no makeup, gentle warm expression, balanced feminine figure. Cô đang mặc SẢN PHẨM NÀY (mô tả chính xác màu sắc, kiểu dáng, chất liệu của sản phẩm '${product.name}' dựa trên: ${product.description ?? product.name}). Pose: thư giãn tự nhiên. Setting: ${outdoorScene4}. Photorealistic vertical photo. No text, no logo.",
    "Viết 1 image prompt tiếng Anh. Nhân vật: beautiful Vietnamese countryside woman, 158cm, 54kg, slim soft body with gentle curves, long straight black hair, fair smooth skin, slightly round face with natural rural charm, no makeup, gentle warm expression, balanced feminine figure. Cô đang mặc SẢN PHẨM NÀY (mô tả chính xác màu sắc, kiểu dáng, chất liệu của sản phẩm '${product.name}' dựa trên: ${product.description ?? product.name}). Pose: close-up từ thắt lưng trở lên, nhìn xuống nhẹ, dáng điệu tự nhiên. Setting: ${sceneContext}. Ánh sáng khuếch tán mềm. Photorealistic vertical photo. No text, no logo."
  ]` : `"imagePrompt": "Viết 1 image prompt tiếng Anh mô tả cảnh sản phẩm '${product.name}' được sử dụng trong bối cảnh tự nhiên. Setting: ${sceneContext}. ${selectedAngle}. Nếu có nhân vật thì dùng: beautiful Vietnamese countryside woman, 158cm, 62kg, slightly chubby soft body, long straight black hair, fair smooth skin, round chubby face, no makeup, gentle expression. Mô tả sản phẩm chính xác dựa trên: ${product.description ?? product.name}. Lighting: natural/warm/soft. Candid lifestyle. No text, no watermark, no logo."`},
  "tiktokHook": "Câu hook đầu tiên cho video TikTok — tối đa 1 câu, đủ mạnh để giữ người xem không vuốt qua",
  "shortCaption": "Caption TikTok/Threads theo cấu trúc:\nDÒNG 1 — Hook: 1 câu nêu vấn đề/nỗi đau mà sản phẩm giải quyết, viết như đang nói chuyện với bạn bè\nDÒNG 2 — Lợi ích cụ thể: nêu rõ 1 lợi ích thật sự của sản phẩm khiến cuộc sống dễ hơn / tốt hơn — KHÔNG dùng từ chung chung như 'tốt', 'hiệu quả'\nDÒNG 3 — Lý do phải dùng: 1 câu giải thích tại sao không dùng thì thiệt thòi, kiểu nhẹ nhàng gây tiếc nuối\nQUY TẮC: xưng hô ${pronounSet}, ngắn gọn, có thể có 1-2 emoji, KHÔNG kêu gọi mua hàng",
  "longCaption": "Caption Facebook theo đúng cấu trúc sau:\n\nDÒNG 1 — Hook dừng tay: 1 câu kể tình huống cụ thể gây tò mò hoặc nhận dạng được ngay, KHÔNG dùng câu hỏi tu từ kiểu 'Bạn có biết...'\n\nDÒNG 2-3 — Kể chuyện ngắn: tình huống thật xảy ra với nhân vật, dẫn đến việc dùng sản phẩm một cách tự nhiên — KHÔNG giới thiệu sản phẩm trực tiếp\n\nDÒNG 4-5 — Fact/thông tin hữu ích: 1-2 điều thật sự hữu ích về sản phẩm mà người dùng không biết (thành phần, cách dùng đúng, lưu ý, so sánh với cách làm thông thường) — viết như người dùng tự nghiên cứu được\n\nDÒNG 6 — Câu tranh cãi nhẹ: 1 câu nhận xét thẳng thắn hơi gây ý kiến trái chiều, kiểu nói thật mà người ta không dám nói (ví dụ: 'Thật ra mấy sản phẩm đắt tiền hơn cũng chỉ vậy thôi' hoặc 'Tui không hiểu sao người ta cứ chịu khổ mà không thử cái này')\n\nDÒNG 7-8 — Kết tự nhiên: câu kết bằng cảm xúc hoặc bỏ ngỏ, KHÔNG kêu gọi mua hàng trực tiếp\n\nQUY TẮC BẮT BUỘC:\n- Xưng hô: ${pronounSet}\n- Câu ngắn, có thể ngắt dòng giữa chừng cho tự nhiên\n- KHÔNG dùng: 'thật sự', 'quá trời', 'siêu', 'tuyệt vời', 'hiệu quả ngay'\n- KHÔNG lộ là quảng cáo\n- Tổng 7-9 dòng",
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
      imagePrompt: parsed.imagePrompts
        ? JSON.stringify(parsed.imagePrompts)
        : (parsed.imagePrompt ?? null),
      tiktokHook: parsed.tiktokHook ?? null,
      shortCaption: parsed.shortCaption ?? null,
      longCaption: parsed.longCaption ?? null,
      hashtags: parsed.hashtags ?? [],
      status: 'draft',
    },
  })

  return NextResponse.json(script, { status: 201 })
}
