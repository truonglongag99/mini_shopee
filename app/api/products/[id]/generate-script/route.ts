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
const now = new Date()
const dayOfWeek = now.getDay()
const month = now.getMonth() + 1 // 1-12
const weekOfYear = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)
const selectedType = contentTypeByDay[dayOfWeek]

// ============================================================
// SEASONAL CONTEXT — tâm lý xã hội theo tháng
// ============================================================
const seasonalContextByMonth: Record<number, { season: string; mood: string; angle: string }> = {
  1:  { season: 'sau Tết', mood: 'mệt mỏi sau dịp lễ, chi tiêu nhiều rồi bắt đầu tiết kiệm', angle: 'sản phẩm giúp tiết kiệm hoặc bù đắp sau kỳ nghỉ' },
  2:  { season: 'đầu năm mới', mood: 'hứng khởi bắt đầu lại, muốn thay đổi bản thân', angle: 'sản phẩm gắn với mục tiêu năm mới, fresh start' },
  3:  { season: 'cuối mùa lạnh - nắng dần lên', mood: 'phấn chấn vì thời tiết đẹp, bắt đầu ra ngoài nhiều', angle: 'chuẩn bị cho mùa hè, mặc đẹp hơn' },
  4:  { season: 'nắng bắt đầu gắt', mood: 'lo lắng về da, về nắng, về việc mặc gì cho mát', angle: 'chống nắng, mát mẻ, chăm sóc da mùa hè' },
  5:  { season: 'nắng đỉnh điểm', mood: 'nóng bức, dễ cáu, cần giải nhiệt và thoải mái', angle: 'sản phẩm giúp dễ chịu hơn trong tiết trời nóng' },
  6:  { season: 'mùa hè - nghỉ hè bắt đầu', mood: 'vui vẻ, muốn du lịch, muốn mặc đẹp đi chơi', angle: 'outfit đi biển, du lịch, hẹn hò mùa hè' },
  7:  { season: 'mùa mưa bắt đầu', mood: 'lười biếng, thích ở nhà, hay nhớ vẩn vơ', angle: 'sản phẩm dùng ở nhà, comfort, self-care ngày mưa' },
  8:  { season: 'mùa mưa - cuối hè', mood: 'hơi chán, muốn thay đổi gì đó, chuẩn bị vào năm học', angle: 'thay đổi thói quen, refresh bản thân, back to routine' },
  9:  { season: 'đầu thu - se lạnh', mood: 'mơ mộng, lãng mạn nhẹ, thích cà phê và quần áo mới', angle: 'outfit mùa thu, cozy vibes, lớp áo mới' },
  10: { season: 'thu - trời mát dần', mood: 'năng suất cao hơn, muốn chăm sóc bản thân nhiều hơn', angle: 'skincare mùa chuyển giao, thời trang thu' },
  11: { season: 'gần cuối năm', mood: 'nhìn lại năm qua, mua sắm chuẩn bị Tết sớm, sale mùa', angle: 'sản phẩm tổng kết năm, chuẩn bị diện Tết' },
  12: { season: 'cuối năm - cận Tết', mood: 'háo hức, mua sắm nhiều, muốn cho bản thân thứ gì đó', angle: 'quà tặng, diện Tết, làm mới bản thân trước năm mới' },
}
const seasonal = seasonalContextByMonth[month]

// ============================================================
// TRENDING CAPTION FORMAT — rotate theo tuần trong năm
// ============================================================
const trendingFormats = [
  { name: 'confess nhẹ', instruction: 'Mở bằng 1 câu tự thú nhỏ, kiểu "Tui phải thừa nhận là..." hoặc "Không ngờ tui lại..." — giọng nhẹ tự cười bản thân' },
  { name: 'POV relatable', instruction: 'Mở bằng "POV:" hoặc mô tả cảnh từ ngôi thứ 2 "Khi bạn đang..." — đặt người đọc vào đúng tình huống' },
  { name: 'plot twist', instruction: 'Mở bằng tình huống bình thường rồi dòng 2-3 lật ngược hoàn toàn — kiểu "Tưởng là... ai ngờ..."' },
  { name: 'so sánh ngầm', instruction: 'Không so sánh trực tiếp mà kể 2 trạng thái: trước và sau — để người đọc tự rút ra kết luận' },
  { name: 'nói thật khó nghe', instruction: 'Mở bằng 1 câu thẳng thắn hơi bất ngờ, kiểu "Thật ra là..." hoặc "Ít ai biết nhưng..." — giọng người đã trải nghiệm' },
  { name: 'kể chuyện bạn bè', instruction: 'Viết như đang nhắn tin kể chuyện cho bạn thân — câu ngắn, tự nhiên, có thể dùng "bạn ơi", "ủa mà"' },
  { name: 'micro-story', instruction: 'Kể 1 câu chuyện nhỏ có đầu có cuối trong 5-6 dòng — nhân vật rõ ràng, có vấn đề, có giải pháp, có cảm xúc' },
  { name: 'câu hỏi bỏ ngỏ', instruction: 'Kết thúc bằng 1 câu hỏi thật sự muốn nghe ý kiến người đọc — không phải hỏi tu từ, hỏi như muốn biết thật' },
]
const selectedFormat = trendingFormats[weekOfYear % trendingFormats.length]

const contextScenarios = [
  "đang cuộn feed lúc 11 giờ đêm không ngủ được",
  "vừa nhận hàng xong ngồi mở ra xem",
  "đang nằm ườn cuối tuần chẳng biết làm gì",
  "vừa đi làm về mệt ngồi thở",
  "đang ngồi café một mình nhìn ra cửa sổ",
  "đang chờ cơm chín ngồi lướt điện thoại",
  "vừa tắm xong ngồi dưỡng da",
  "đang ngồi trên xe buýt về nhà",
  "đang đợi bạn trễ hẹn ngoài quán",
  "vừa ăn tối xong nằm dài ra ghế",
  "đang ngồi làm việc giữa giờ tranh thủ lướt mạng",
  "sáng sớm chưa ngủ dậy hẳn còn nằm trên giường",
  "đang ngồi với mẹ xem tivi buổi tối",
  "vừa đi siêu thị về đang cất đồ",
  "đang ngồi ngoài ban công nhìn mưa",
  "vừa xem xong một video và tay tự lướt tiếp",
  "đang thử quần áo trước gương",
  "ngồi uống trà chiều một mình ở nhà",
  "đang nhắn tin cho bạn về chuyện mua sắm",
  "vừa xong buổi gym ngồi nghỉ",
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
BỐI CẢNH THỜI ĐIỂM (tháng ${month} — ${seasonal.season}):
- Tâm lý người dùng lúc này: ${seasonal.mood}
- Góc khai thác phù hợp: ${seasonal.angle}
- Tất cả nội dung (kịch bản, caption) NÊN phản ánh đúng tâm lý này — đừng viết content mùa đông trong mùa hè
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
    "CONCEPT: Đời thường – dễ mặc. Viết 1 English image prompt: A young Vietnamese woman, girl-next-door appearance, naturally pretty but not model-level, slightly chubby soft body, gentle round belly, fuller arms and thighs, soft oval face with full cheeks, warm tan skin, slightly wavy black hair, light natural makeup, relaxed everyday posture — looks like a real everyday woman not a model. She is wearing [mô tả chính xác sản phẩm '${product.name}': màu sắc, kiểu dáng, chất liệu dựa trên: ${product.description ?? product.name}]. Candid moment — she is doing something ordinary (walking, holding a coffee, adjusting hair). Setting: ${sceneContext}, warm natural daylight. Photorealistic vertical photo. No text, no logo.",
    "CONCEPT: Che khuyết điểm. Viết 1 English image prompt: A young Vietnamese woman, girl-next-door look, slightly chubby soft body, gentle round belly, fuller thighs, soft oval face with full cheeks, warm tan skin, black hair, no heavy makeup. She is wearing [mô tả chính xác sản phẩm '${product.name}': màu sắc, kiểu dáng, chất liệu dựa trên: ${product.description ?? product.name}] — the outfit fits well and flatters her figure, naturally concealing problem areas. Angle shows how the clothing drapes naturally on a real body. Setting: ${sceneContext}, soft diffused light. Photorealistic vertical photo. No text, no logo.",
    "CONCEPT: Outfit đi làm / đi chơi. Viết 1 English image prompt: A young Vietnamese woman, relatable everyday appearance, slightly chubby soft body, soft oval face with full cheeks, warm tan skin, neat black hair, minimal makeup. She is wearing [mô tả chính xác sản phẩm '${product.name}': màu sắc, kiểu dáng, chất liệu dựa trên: ${product.description ?? product.name}] styled for a casual outing or light workday. She looks put-together without trying too hard. Setting: simple urban or rural Vietnamese backdrop — café corner, market alley, or riverside path in Mekong Delta, warm ambient light. Photorealistic vertical photo. No text, no logo.",
    "CONCEPT: POV nữ (góc nhìn ngôi thứ nhất). Viết 1 English image prompt: First-person POV shot looking down — the viewer IS the woman. Shot from chest-height looking down at the outfit. Visible: the clothing on the body, hands casually resting, feet or background below. She is wearing [mô tả chính xác sản phẩm '${product.name}': màu sắc, kiểu dáng, chất liệu dựa trên: ${product.description ?? product.name}]. Natural feminine hands, no heavy jewelry. Setting: ${outdoorScene4}, warm soft light. Photorealistic vertical photo. No text, no logo.",
    "CONCEPT: Reaction – người khác nhận xét. Viết 1 English image prompt: Two young Vietnamese women, both girl-next-door appearance, slightly chubby soft bodies, soft oval faces, warm tan skin, natural look. One woman is wearing [mô tả chính xác sản phẩm '${product.name}': màu sắc, kiểu dáng, chất liệu dựa trên: ${product.description ?? product.name}]. The other woman is visibly reacting — touching the fabric with curiosity, leaning in, or giving an impressed look. Candid natural moment, feels like a real conversation between friends. Setting: ${sceneContext}, warm daylight. Photorealistic vertical photo. No text, no logo."
  ]` : `"imagePrompt": "Viết 1 image prompt tiếng Anh mô tả cảnh sản phẩm '${product.name}' được sử dụng trong bối cảnh tự nhiên. Setting: ${sceneContext}. ${selectedAngle}. Nếu có nhân vật thì dùng: young Vietnamese woman, girl-next-door appearance, slightly chubby soft body, soft oval face with full cheeks, warm tan skin, black hair, no heavy makeup, real-person candid vibe. Mô tả sản phẩm chính xác dựa trên: ${product.description ?? product.name}. Lighting: natural/warm/soft. Candid lifestyle. No text, no watermark, no logo."`},
  "tiktokHook": "Câu hook đầu tiên cho video TikTok — tối đa 1 câu, đủ mạnh để giữ người xem không vuốt qua",
  "shortCaption": "Caption TikTok/Threads — áp dụng format '${selectedFormat.name}': ${selectedFormat.instruction}\nCấu trúc 3 dòng:\nDÒNG 1 — Hook theo format trên, liên quan đến tâm lý tháng ${month} (${seasonal.mood})\nDÒNG 2 — Lợi ích cụ thể: 1 lợi ích thật sự khiến cuộc sống dễ hơn — KHÔNG dùng từ chung chung như 'tốt', 'hiệu quả'\nDÒNG 3 — Câu gây tiếc nuối nhẹ nếu không dùng\nQUY TẮC: xưng hô ${pronounSet}, ngắn gọn, có thể có 1-2 emoji, KHÔNG kêu gọi mua hàng",
  "longCaption": "Caption Facebook — áp dụng format '${selectedFormat.name}': ${selectedFormat.instruction}\n\nDÒNG 1 — Hook dừng tay: PHẢI bắt đầu từ đúng tình huống này: '${selectedContext}' — áp dụng format trên để viết thành 1 câu tự nhiên, phù hợp tâm lý tháng ${month} (${seasonal.mood}), KHÔNG dùng câu hỏi tu từ\n\nDÒNG 2-3 — Kể chuyện ngắn: tình huống thật, dẫn đến sản phẩm tự nhiên — KHÔNG giới thiệu sản phẩm trực tiếp\n\nDÒNG 4-5 — Fact hữu ích: 1-2 điều người dùng không biết về sản phẩm, viết như người tự tìm hiểu được\n\nDÒNG 6 — Câu nói thật nhẹ gây tranh cãi: nhận xét thẳng thắn mà ít người dám nói\n\nDÒNG 7-8 — Kết tự nhiên: cảm xúc hoặc bỏ ngỏ, KHÔNG kêu gọi mua\n\nQUY TẮC BẮT BUỘC:\n- Xưng hô: ${pronounSet}\n- Câu ngắn, có thể ngắt dòng giữa chừng\n- KHÔNG dùng: 'thật sự', 'quá trời', 'siêu', 'tuyệt vời', 'hiệu quả ngay'\n- KHÔNG lộ là quảng cáo\n- Tổng 7-9 dòng",
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
