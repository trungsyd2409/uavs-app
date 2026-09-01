import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BASE64_LEN = 7_000_000; // ~5MB file

const schema = z.object({
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  note: z.string().max(2000).optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileData: z.string().max(MAX_BASE64_LEN).optional(),
});

export async function GET() {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, type, title, note, file_name, mime_type, created_at,
              (file_data IS NOT NULL) as has_file
       FROM evidence_items WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(session.userId);

  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }
  const { type, title, note, fileName, mimeType, fileData } = parsed.data;

  const db = getDb();
  const id = newId();
  db.prepare(
    `INSERT INTO evidence_items (id, user_id, type, title, note, file_name, mime_type, file_data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    session.userId,
    type,
    title,
    note || null,
    fileName || null,
    mimeType || null,
    fileData || null,
    nowIso()
  );

  return NextResponse.json({ ok: true, id });
}
