import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { id } = await ctx.params;

  const db = getDb();
  const item = db
    .prepare("SELECT * FROM evidence_items WHERE id = ? AND user_id = ?")
    .get(id, session.userId);

  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { id } = await ctx.params;

  const db = getDb();
  db.prepare("DELETE FROM evidence_items WHERE id = ? AND user_id = ?").run(id, session.userId);

  return NextResponse.json({ ok: true });
}
