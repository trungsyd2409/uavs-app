"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import type { JobCheckResult } from "@/lib/riskEngine";

const industries = ["Nhà hàng / Quán cà phê", "Nail / Làm đẹp", "Dọn dẹp", "Bán lẻ", "Nông trại", "Khác"];
const employmentTypes = ["Casual", "Part-time", "Full-time", "Contractor / ABN", "Not sure"] as const;
const payUnits = [
  { value: "per_hour", label: "Theo giờ ($/giờ)" },
  { value: "per_week", label: "Theo tuần ($/tuần)" },
  { value: "flat_regardless_of_hours", label: "Một khoản cố định, bất kể số giờ" },
] as const;
const paymentMethods = ["Bank transfer", "Cash", "Mixed (cash + bank)", "Not sure"] as const;
const visas = ["Student", "Working Holiday", "Temporary Work", "Permanent Resident", "Not sure"];
const dayOptions = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật", "Ngày lễ"];
const payslipOptions = [
  { value: "yes", label: "Có" },
  { value: "no", label: "Không" },
  { value: "not_sure", label: "Không chắc" },
] as const;

const riskCopy: Record<
  string,
  { title: string; tone: "ok" | "issue" | "high"; emoji: string; desc: string }
> = {
  ok: {
    title: "Trông ổn",
    tone: "ok",
    emoji: "✅",
    desc: "Dựa trên thông tin bạn cung cấp, công việc này không có dấu hiệu rủi ro rõ ràng.",
  },
  issue: {
    title: "Có thể có vấn đề",
    tone: "issue",
    emoji: "⚠️",
    desc: "Có một vài điểm bạn nên tìm hiểu thêm hoặc theo dõi cẩn thận.",
  },
  high: {
    title: "Rủi ro cao",
    tone: "high",
    emoji: "🚨",
    desc: "Có nhiều dấu hiệu đáng lo ngại — bạn nên ghi chép lại và tìm hỗ trợ sớm.",
  },
};

export default function CheckJobPage() {
  const [industry, setIndustry] = useState(industries[0]);
  const [role, setRole] = useState("");
  const [employmentType, setEmploymentType] = useState<(typeof employmentTypes)[number]>("Casual");
  const [payAmount, setPayAmount] = useState("");
  const [payUnit, setPayUnit] = useState<(typeof payUnits)[number]["value"]>("per_hour");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]>("Bank transfer");
  const [visa, setVisa] = useState(visas[0]);
  const [hasPayslips, setHasPayslips] = useState<(typeof payslipOptions)[number]["value"]>("yes");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobCheckResult | null>(null);

  function toggleDay(day: string) {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setError("Vui lòng nhập mức lương hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/job-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          role: role || undefined,
          employmentType,
          payAmount: amount,
          payUnit,
          hoursPerWeek: hoursPerWeek ? parseFloat(hoursPerWeek) : undefined,
          workingDays,
          paymentMethod,
          visa,
          hasPayslips,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }
      setResult(data.result);
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const copy = riskCopy[result.level];
    return (
      <div className="px-5 py-2 space-y-4">
        <PageHeader title="Kết quả kiểm tra" />
        <Card className="text-center py-6">
          <div className="text-5xl mb-2">{copy.emoji}</div>
          <Badge tone={copy.tone}>{copy.title}</Badge>
          <p className="text-sm text-[var(--color-muted)] mt-3">{copy.desc}</p>
          {result.estimatedHourlyRate !== null && (
            <p className="text-xs text-[var(--color-muted)] mt-2">
              Lương ước tính: <strong>${result.estimatedHourlyRate}/giờ</strong> · Tham khảo tối thiểu: $
              {result.applicableMinWage}/giờ
            </p>
          )}
        </Card>

        {result.reasons.length > 0 && (
          <Card>
            <p className="font-semibold text-sm mb-2">Vì sao?</p>
            <ul className="space-y-2">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-sm text-[var(--color-ink)] flex gap-2">
                  <span>•</span>
                  <span>{r.message}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {result.positives.length > 0 && (
          <Card>
            <p className="font-semibold text-sm mb-2 text-[var(--color-primary-dark)]">Điểm tốt</p>
            <ul className="space-y-2">
              {result.positives.map((p, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span>✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {result.notes.length > 0 && (
          <Card>
            <p className="font-semibold text-sm mb-2">Lưu ý thêm</p>
            <ul className="space-y-2">
              {result.notes.map((n, i) => (
                <li key={i} className="text-sm text-[var(--color-muted)] flex gap-2">
                  <span>ℹ️</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="text-[11px] text-[var(--color-muted)] px-1">
          Công cụ tham khảo dựa trên quy tắc đơn giản, không phải tư vấn pháp lý. Mức lương tối thiểu tham khảo
          áp dụng từ 01/07/2026 theo Fair Work Ombudsman.
        </p>

        <div className="space-y-2 pb-4">
          {(result.level === "issue" || result.level === "high") && (
            <Link href="/support">
              <Button variant="primary">Xem tổ chức hỗ trợ →</Button>
            </Link>
          )}
          <Link href="/evidence">
            <Button variant="secondary">Lưu bằng chứng liên quan →</Button>
          </Link>
          <Button variant="ghost" onClick={() => setResult(null)}>
            Kiểm tra công việc khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-2">
      <PageHeader title="Check My Job" subtitle="Điền thông tin để đánh giá nhanh tình huống công việc của bạn" />

      <form onSubmit={onSubmit} className="space-y-4 pb-6">
        <Field label="Ngành nghề">
          <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {industries.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>

        <Field label="Vị trí công việc (không bắt buộc)">
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="VD: phục vụ, thu ngân..." />
        </Field>

        <Field label="Hình thức làm việc">
          <select
            className="input"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)}
          >
            {employmentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mức lương ($)">
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="VD: 20"
              required
            />
          </Field>
          <Field label="Đơn vị trả lương">
            <select className="input" value={payUnit} onChange={(e) => setPayUnit(e.target.value as typeof payUnit)}>
              {payUnits.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Số giờ làm mỗi tuần (không bắt buộc)">
          <input
            className="input"
            type="number"
            min="0"
            step="0.5"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
            placeholder="VD: 25"
          />
        </Field>

        <Field label="Những ngày bạn thường làm">
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => toggleDay(d)}
                className={`text-xs font-medium rounded-full px-3 py-1.5 border ${
                  workingDays.includes(d)
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Hình thức nhận lương">
          <select
            className="input"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
          >
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bạn có nhận được payslip (phiếu lương) không?">
          <div className="flex gap-2">
            {payslipOptions.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => setHasPayslips(o.value)}
                className={`flex-1 text-sm font-medium rounded-xl px-3 py-2 border ${
                  hasPayslips === o.value
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Visa của bạn">
          <select className="input" value={visa} onChange={(e) => setVisa(e.target.value)}>
            {visas.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Đang kiểm tra..." : "Kiểm tra ngay"}
        </Button>
      </form>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">{label}</label>
      {children}
    </div>
  );
}
