import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { askAssistant } from "@/lib/aiAssistant";

export const runtime = "nodejs";

const schema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function GET() {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, role, content, topic_tag, created_at FROM ai_messages WHERE user_id = ? ORDER BY created_at ASC"
    )
    .all(session.userId);

  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Vui lòng nhập nội dung" }, { status: 400 });
  }

  const db = getDb();
  const userMsgId = newId();
  const now1 = nowIso();
  db.prepare(
    "INSERT INTO ai_messages (id, user_id, role, content, topic_tag, created_at) VALUES (?, ?, 'user', ?, NULL, ?)"
  ).run(userMsgId, session.userId, parsed.data.message, now1);

  const response = askAssistant(parsed.data.message);

  const assistantMsgId = newId();
  const now2 = nowIso();
  db.prepare(
    "INSERT INTO ai_messages (id, user_id, role, content, topic_tag, created_at) VALUES (?, ?, 'assistant', ?, ?, ?)"
  ).run(assistantMsgId, session.userId, JSON.stringify(response), response.topic, now2);

  return NextResponse.json({ response });
}
