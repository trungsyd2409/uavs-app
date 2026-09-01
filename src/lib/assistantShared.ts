import { ProblemTag } from "@/data/supportOrgs";

export interface AssistantResponse {
    topic: string;
    whatMightBeHappening: string;
    whyItMatters: string;
    whatYouCanDo: string[];
    evidenceToKeep: string[];
    helpTags: ProblemTag[];
}

export interface ChatTurn {
    role: "user" | "assistant";
    content: string;
}

export const DEMO_DISCLAIMER =
    "Trợ lý AI có thể dùng mô hình AI thật (Gemini) khi có kết nối, hoặc câu trả lời dựng sẵn khi cần — chỉ mang tính tham khảo, không phải tư vấn pháp lý.";