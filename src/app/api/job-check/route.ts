import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, newId, nowIso } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { assessJob } from "@/lib/riskEngine";

export const runtime = "nodejs";

const schema = z.object({
  industry: z.string().min(1),
  role: z.string().optional(),
  employmentType: z.enum(["Casual", "Part-time", "Full-time", "Contractor / ABN", "Not sure"]),
  payAmount: z.number().positive(),
  payUnit: z.enum(["per_hour", "per_week", "flat_regardless_of_hours"]),
  hoursPerWeek: z.number().positive().optional(),
  workingDays: z.array(z.string()).default([]),
  paymentMethod: z.enum(["Bank transfer", "Cash", "Mixed (cash + bank)", "Not sure"]),
  visa: z.string().min(1),
  hasPayslips: z.enum(["yes", "no", "not_sure"]),
});

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

  const input = parsed.data;
  const result = assessJob(input);

  const db = getDb();
  const id = newId();
  db.prepare(
    `INSERT INTO job_checks
      (id, user_id, industry, role, employment_type, pay_amount, pay_unit, hours_per_week,
       working_days, payment_method, visa, has_payslips, risk_level, risk_score, risk_reasons, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    session.userId,
    input.industry,
    input.role || "",
    input.employmentType,
    input.payAmount,
    input.payUnit,
    input.hoursPerWeek ?? null,
    JSON.stringify(input.workingDays),
    input.paymentMethod,
    input.visa,
    input.hasPayslips,
    result.level,
    result.score,
    JSON.stringify(result),
    nowIso()
  );

  return NextResponse.json({ id, result });
}

export async function GET() {
  const session = await requireApiSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM job_checks WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(session.userId);

  return NextResponse.json({ items: rows });
}
