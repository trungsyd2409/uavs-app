"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import type { SupportOrg, ProblemTag } from "@/data/supportOrgs";

const filters: { value: ProblemTag | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "underpayment", label: "Lương thấp" },
  { value: "no_payslip", label: "Không payslip" },
  { value: "unfair_dismissal", label: "Sa thải" },
  { value: "unsafe", label: "An toàn" },
  { value: "harassment", label: "Quấy rối" },
  { value: "visa_threat", label: "Đe doạ visa" },
];

export function SupportList({ orgs }: { orgs: SupportOrg[] }) {
  const [active, setActive] = useState<ProblemTag | "all">("all");
  const visible = active === "all" ? orgs : orgs.filter((o) => o.tags.includes(active));

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`shrink-0 text-xs font-semibold rounded-full px-3 py-1.5 border ${
              active === f.value
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((org) => (
          <Card key={org.id}>
            <p className="font-bold text-sm">{org.name}</p>
            {org.phone && (
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary-dark)]">
                📞 {org.phone}
              </p>
            )}
            <p className="text-sm text-[var(--color-muted)] mt-1.5">{org.shortDesc}</p>

            <dl className="mt-3 space-y-1.5 text-xs">
              <Row label="Giúp gì cho bạn" value={org.helpsWith} />
              <Row label="Hỗ trợ tiếng Việt" value={org.vietnameseSupport} />
              <Row label="Phạm vi" value={org.coverage} />
              {org.hours && <Row label="Giờ làm việc" value={org.hours} />}
              {org.address && <Row label="Địa chỉ" value={org.address} />}
            </dl>

            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs font-semibold text-[var(--color-primary-dark)]"
            >
              Xem website →
            </a>
          </Card>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-[var(--color-muted)]">Không có tổ chức phù hợp bộ lọc này.</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt className="font-semibold text-[var(--color-muted)] shrink-0">{label}:</dt>
      <dd className="text-[var(--color-ink)] min-w-0">{value}</dd>
    </div>
  );
}
