import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(100),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự").max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "Email này đã được đăng ký" }, { status: 409 });
  }

  const id = newId();
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = nowIso();

  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, email, name, passwordHash, createdAt);

  db.prepare(
    "INSERT INTO profiles (user_id, onboarding_complete, updated_at) VALUES (?, 0, ?)"
  ).run(id, createdAt);

  await createSession({ userId: id, email, name });

  return NextResponse.json({ ok: true, onboardingComplete: false });
}
