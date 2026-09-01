process.loadEnvFile(".env.local");
import { GoogleGenAI, Type } from "@google/genai";
import { scenarios } from "../src/lib/aiAssistant";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROBLEM_TAGS = [
    "underpayment", "no_payslip", "unsafe", "visa_threat",
    "harassment", "unfair_dismissal", "contract_hours", "general",
] as const;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        whatMightBeHappening: { type: Type.STRING },
        whyItMatters: { type: Type.STRING },
        whatYouCanDo: { type: Type.ARRAY, items: { type: Type.STRING } },
        evidenceToKeep: { type: Type.ARRAY, items: { type: Type.STRING } },
        helpTags: { type: Type.ARRAY, items: { type: Type.STRING, enum: PROBLEM_TAGS } },
    },
    required: ["topic", "whatMightBeHappening", "whyItMatters", "whatYouCanDo", "evidenceToKeep", "helpTags"],
};

const knowledgeBase = scenarios
    .map((s) => `- ${s.response.topic}: ${s.response.whyItMatters}`)
    .join("\n");

const systemInstruction = `Bạn là trợ lý AI về quyền lợi lao động cho người lao động Việt Nam tại Úc, trong app "Bạn Đồng Hành".
Chỉ trả lời bằng tiếng Việt. Đây KHÔNG phải tư vấn pháp lý chính thức — luôn nhắc người dùng kiểm tra lại với Fair Work Ombudsman khi cần.
Dựa trên các kiến thức đã được kiểm chứng sau (không tự bịa số liệu luật khác):
${knowledgeBase}
Trả lời đúng theo JSON schema được cung cấp.`;

async function main() {
    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: "Chủ nói nếu tôi phàn nàn về lương thì sẽ báo cho di trú, tôi phải làm sao?",
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
        },
    });
    console.log(JSON.parse(response.text!));
}

main().catch(console.error);