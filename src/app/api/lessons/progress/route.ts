import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { lessons } from "@/data/lessons";

export const runtime = "nodejs";

const schema = z.object({
  lessonId: z.string().min(1),
  score: z.number().int().min(0),
});

export async function GET() {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare("SELECT lesson_id, completed, score, completed_at FROM lesson_progress WHERE user_id = ?")
    .all(session.userId);

  return NextResponse.json({ progress: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const { lessonId, score } = parsed.data;

  if (!lessons.some((l) => l.id === lessonId)) {
    return NextResponse.json({ error: "Bài học không tồn tại" }, { status: 404 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?")
    .get(session.userId, lessonId) as { id: string } | undefined;

  const now = nowIso();
  if (existing) {
    db.prepare(
      "UPDATE lesson_progress SET completed = 1, score = ?, completed_at = ? WHERE id = ?"
    ).run(score, now, existing.id);
  } else {
    db.prepare(
      `INSERT INTO lesson_progress (id, user_id, lesson_id, completed, score, completed_at)
       VALUES (?, ?, ?, 1, ?, ?)`
    ).run(newId(), session.userId, lessonId, score, now);
  }

  return NextResponse.json({ ok: true });
}
