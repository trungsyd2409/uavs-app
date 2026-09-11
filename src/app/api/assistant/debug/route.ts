/**
 * API THỬ NGHIỆM của pipeline RAG mới (không cần đăng nhập) — dùng cho trang /assistant-demo.
 *
 * POST /api/assistant/debug        { message, profile? } -> câu trả lời + trace từng bước
 * GET  /api/assistant/debug        -> trạng thái rag.db + chế độ
 *
 * Trên production (Vercel) API này bị TẮT để người lạ không dùng hết quota Gemini.
 * Muốn bật khi demo: thêm biến môi trường ASSISTANT_DEMO=1.
 * Người dùng thật đi qua /api/assistant (có đăng nhập, lưu lịch sử).
 */
import { NextResponse } from "next/server";
import { askAssistant } from "@/lib/assistant";
import { MAX_MESSAGE_CHARS, isFakeMode } from "@/lib/assistant/config";
import { sanitizeProfile } from "@/lib/assistant/profile";
import { getRagIndex } from "@/lib/assistant/retrieval";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs"; // node:sqlite chỉ chạy trên Node, không chạy trên Edge
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function demoEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ASSISTANT_DEMO === "1";
}

function clientKey(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `assistant-demo:${ip}`;
}

export async function POST(req: Request) {
  if (!demoEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rate = checkRateLimit(clientKey(req), 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Bạn hỏi hơi nhanh, vui lòng đợi một chút." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không phải JSON" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "Bạn chưa nhập câu hỏi" }, { status: 400 });
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: `Câu hỏi dài quá ${MAX_MESSAGE_CHARS} ký tự` }, { status: 400 });
  }

  try {
    const { response, trace } = await askAssistant(message, sanitizeProfile(body.profile));
    return NextResponse.json({ ...response, trace });
  } catch (e) {
    console.error("[assistant/debug]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  if (!demoEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const index = getRagIndex();
    return NextResponse.json({
      ok: true,
      mode: isFakeMode() ? "fake" : "gemini",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
      hasAbnGuid: Boolean(process.env.ABN_LOOKUP_GUID?.trim()),
      ragDb: { ...index.meta, rows: index.rows.length },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
