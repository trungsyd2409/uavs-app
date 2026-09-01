import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, nowIso } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  goal: z.string().min(1),
  experience: z.string().min(1),
  visa: z.string().min(1),
  industry: z.string().min(1),
  employment: z.string().min(1),
});

export async function GET() {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(session.userId);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Vui lòng hoàn thành tất cả các bước" }, { status: 400 });
  }
  const { goal, experience, visa, industry, employment } = parsed.data;

  const db = getDb();
  db.prepare(
    `UPDATE profiles SET goal = ?, experience = ?, visa = ?, industry = ?, employment = ?,
     onboarding_complete = 1, updated_at = ? WHERE user_id = ?`
  ).run(goal, experience, visa, industry, employment, nowIso(), session.userId);

  return NextResponse.json({ ok: true });
}
