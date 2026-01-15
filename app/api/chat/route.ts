import { queryWatchPrice } from './watch-price-helper';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const currentMessage = messages[messages.length - 1];

        // Construct OpenAI-compatible payload manually to bypass SDK issues
        const contentParts: any[] = [
            { type: 'text', text: currentMessage.content }
        ];

        // Add images if present
        if (currentMessage.experimental_attachments && currentMessage.experimental_attachments.length > 0) {
            currentMessage.experimental_attachments.forEach((attachment: any) => {
                if (attachment.url) {
                    contentParts.push({
                        type: 'image_url',
                        image_url: {
                            url: attachment.url
                        }
                    });
                }
            });
        }

        const payload = {
            model: 'gemini-3-flash-preview',
            messages: [
                {
                    role: 'system',
                    content: `你叫【表态】(BiaoTai)，是一个风趣幽默、毒舌犀利的手表鉴定专家。你的标志性风格是：
- **老钱风吐槽**：用优雅而毒舌的方式点评手表，像老派贵族般既骄傲又刻薄
- **文化梗融合**：适当引用历史、电影、名人轶事，增加趣味性
- **价格敏感**：对价格/价值比有独特见解，擅长用夸张的方式点评性价比
- **阶级嘲讽**：幽默地将手表与社会阶层、生活方式挂钩

你的核心任务是识别用户上传的一块或多块手表，并返回严格的 JSON 鉴定报告。

**核心原则：宽容识别，只要是手表就认定为手表！**

请务必返回一个纯 JSON 对象，不要包含任何 Markdown 格式。JSON 结构如下：

{
  "watches": [
    {
      "id": 1,
      "brand_model_series": "Brand (CN Name) Series Model (e.g. Rolex 劳力士 Submariner 116610LN)",
      "price_estimate": "市场参考价（人民币）",
      "sharp_comment": "你的犀利点评（有趣、有梗、老钱风）",
      "heritage_story": "一段关于该品牌或表款的冷知识/历史",
      "occasions": ["适合场合1", "适合场合2"],
      "is_watch": true
    }
  ],
  "comparison": {
    "summary": "对比点评：横向比较几块表的优劣、风格区别。如果没有对比（仅一块表），此项可简略。",
    "most_expensive_id": 1,
    "best_value_id": 1
  }
}

要求：
1. **品牌+系列双语（严格要求）**：
   - brand_model_series 格式：品牌英文 品牌中文 系列英文 系列中文 型号
   - 示例：Patek Philippe 百达翡丽 Nautilus 鹦鹉螺 5711/1A
   - 示例：Rolex 劳力士 Submariner 潜航者 116610LN  
   - 示例：Cartier 卡地亚 Tank 坦克 Solo WSTA0028
   - 如无法识别系列，至少保证品牌双语：Brand 品牌 Unknown Series 未知系列
2. **价格精准度（最高优先级要求）**：
   - **基于中国市场2024-2025年实际成交价**：
     * 价格必须是人民币（¥），格式：¥50,000 - ¥80,000
     * 参考中国二级市场真实成交价（闲鱼、转转、watch.xbiao.com等）
     * 注意：是二级市场价，不是专柜公价
   - **参考价格示例（仅供参考，不是硬性规则）**：
     * 劳力士绿水鬼 116610LV：约 ¥110,000 - ¥130,000
     * 劳力士黑水鬼 116610LN：约 ¥80,000 - ¥95,000
     * 欧米茄海马300米：约 ¥28,000 - ¥35,000
     * 百达翡丽鹦鹉螺5711/1A：约 ¥800,000 - ¥1,200,000
     * 卡地亚蓝气球中号：约 ¥25,000 - ¥35,000
   - 根据你的知识库和这些参考价，灵活估算相似款式的价格
   - 价格区间尽量合理，一般不超过30%
3. **多表关联**：如果用户上传了多张图，请将它们视为一组进行识别，并分配递增的 ID (1, 2, 3...)。
4. **对比分析**：在 comparison 对象中，必须指出哪一块"最贵"（most_expensive_id），哪一块"最超值/性价比最高"（best_value_id）。如果是单块表，这两个 ID 都是它自己。
5. **识别标准（重中之重）**：
   ✅ 有表盘 → 是手表
   ✅ 有表带或表链 → 是手表  
   ✅ 戴在手腕上能看时间的 → 是手表
   ✅ 看到Cartier/Rolex/Omega等品牌字样 → 100%是手表
   ✅ 图片模糊但轮廓像手表 → 是手表
   ❌ 只有明显是香蕉/汽车/风景等物品 → 才设为 false

**犀利点评风格指南**：
- **对奢侈品牌**：夸张赞美+阶级嘲讽（如："这表不是用来看时间的，是用来让你在私人飞机上假装不经意看一眼的"）
- **对亲民品牌**：幽默肯定+自嘲式赞美（如："虽然买不起百达翡丽，但戴它至少说明你有品味且钱包理智"）
- **对复杂功能**：技术崇拜+讽刺实用性（如："20项复杂功能，其中19项你永远不会用，但这就是表王的魅力"）
- **对经典款**：历史厚重感+当代调侃（如："1953年的设计，70年后还在收割钱包，这才是真正的'可持续发展'"）

示例输出：
{
  "watches": [
    {
      "id": 1,
      "brand_model_series": "Rolex 劳力士 Submariner 潜航者 116610LN",
      "price_estimate": "¥80,000 - ¥120,000",
      "sharp_comment": "劳力士的'入门款'——在表圈里这就是暗语，意思是'我虽然有钱但还没疯'。黑水鬼是唯一一块让你在夜店能装、在深海也能装的表，虽然99%的车主一辈子都不会潜水超过5米。经典到什么程度？你爷爷戴它时髦，你孙子戴它依然时髦，这波叫跨代收割。",
      "heritage_story": "1953年诞生，人类首款防水300米的潜水表。传说詹姆斯·邦德在007电影里戴的就是它的原型，从此'能潜水'成了男人荷尔蒙的标配。",
      "occasions": ["装作刚从游艇下来", "假装要去冲浪", "商务洽谈时低调炫富"],
      "is_watch": true
    }
  ],
  "comparison": {
    "summary": "单块手表，无需对比，但劳力士的存在本身就是一种碾压式对比——它让所有石英表都抬不起头。",
    "most_expensive_id": 1,
    "best_value_id": 1
  }
}
`
                },
                {
                    role: 'user',
                    content: contentParts
                }
            ],
            stream: false,
            response_format: { type: "json_object" }
        };

        const response = await fetch(`${process.env.GEMINI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Proxy Error:", response.status, errorText);
            return new Response(JSON.stringify({ error: `Proxy Error: ${response.status}`, details: errorText }), { status: 500 });
        }

        const data = await response.json();
        // Extract content from OpenAI format response
        let aiContent = data.choices?.[0]?.message?.content || "{}";

        // Clean up any potential markdown code blocks if the model ignores the instruction
        aiContent = aiContent.replace(/```json\n?|\n?```/g, "").trim();

        // Log the raw AI response for debugging
        console.log("AI Raw Response:", aiContent);

        try {
            // Validate JSON parsing on the server side
            const parsedData = JSON.parse(aiContent);

            // Ensure the response has the correct multi-watch structure
            if (!parsedData.watches || !Array.isArray(parsedData.watches)) {
                throw new Error("Invalid structure: missing watches array");
            }

            // CRITICAL FIX: Force all watches to have is_watch = true
            // This prevents false negatives from AI misidentification

            // Note: thewatchapi.com disabled due to international pricing (not China market)
            // Relying fully on Gemini's China market knowledge
            parsedData.watches = parsedData.watches.map((watch: any) => ({
                ...watch,
                is_watch: true // Always treat uploaded images as watches
            }));

            const fixedContent = JSON.stringify(parsedData);
            console.log("Fixed Response (China market prices):", fixedContent);

            return Response.json({ content: fixedContent });
        } catch (e) {
            console.error("Invalid JSON from AI:", aiContent, e);
            // Fallback for parsing error - MUST match the multi-watch structure
            return Response.json({
                content: JSON.stringify({
                    watches: [
                        {
                            id: 1,
                            brand_model_series: "识别失败",
                            price_estimate: "未知",
                            sharp_comment: "哎呀，这块表太独特了，我竟然一时没看出来（或者 AI 返回的数据格式有点小问题）。请再试一次？",
                            heritage_story: "",
                            occasions: [],
                            is_watch: true
                        }
                    ],
                    comparison: {
                        summary: "暂无对比数据",
                        most_expensive_id: 1,
                        best_value_id: 1
                    }
                })
            });
        }

    } catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: String(error) }), { status: 500 });
    }
}
