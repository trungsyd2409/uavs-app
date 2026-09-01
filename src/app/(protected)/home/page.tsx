import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { lessons } from "@/data/lessons";

interface JobCheckRow {
  risk_level: "ok" | "issue" | "high";
  industry: string;
  created_at: string;
}

const blocks = [
  {
    href: "/check-job",
    emoji: "🔍",
    title: "Check My Job",
    desc: "Kiểm tra công việc hiện tại/công việc mới có ổn không.",
  },
  {
    href: "/learn",
    emoji: "🎓",
    title: "Learn My Rights",
    desc: "Học quyền lợi qua bài học ngắn kiểu Duolingo.",
  },
  {
    href: "/assistant",
    emoji: "💬",
    title: "AI Workplace Assistant",
    desc: "Mô tả tình huống, nhận gợi ý bạn nên làm gì.",
  },
  {
    href: "/evidence",
    emoji: "🗂️",
    title: "Evidence Locker",
    desc: "Lưu payslip, hợp đồng, ảnh chụp, ghi chú sự việc.",
  },
  {
    href: "/support",
    emoji: "🤝",
    title: "Trusted Support",
    desc: "Danh sách tổ chức hỗ trợ đáng tin cậy, miễn phí.",
  },
  {
    href: "/check-job",
    emoji: "📋",
    title: "Onboarding của bạn",
    desc: "Xem/cập nhật hồ sơ cá nhân hoá.",
    hrefOverride: "/onboarding",
  },
];

const riskLabel: Record<string, { text: string; tone: "ok" | "issue" | "high" }> = {
  ok: { text: "Trông ổn", tone: "ok" },
  issue: { text: "Có thể có vấn đề", tone: "issue" },
  high: { text: "Rủi ro cao", tone: "high" },
};

export default async function HomePage() {
  const session = await getSession();
  const db = getDb();

  const lastCheck = session
    ? (db
        .prepare(
          "SELECT risk_level, industry, created_at FROM job_checks WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
        )
        .get(session.userId) as JobCheckRow | undefined)
    : undefined;

  const completedLessons = session
    ? ((
        db
          .prepare(
            "SELECT COUNT(*) as c FROM lesson_progress WHERE user_id = ? AND completed = 1"
          )
          .get(session.userId) as { c: number }
      ).c)
    : 0;

  return (
    <div className="px-5 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Chào bạn 👋</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Bạn muốn kiểm tra điều gì hôm nay?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3">
          <p className="text-xs text-[var(--color-muted)]">Tiến độ học</p>
          <p className="text-lg font-bold mt-0.5">
            {completedLessons}/{lessons.length} bài
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-xs text-[var(--color-muted)]">Lần kiểm tra gần nhất</p>
          {lastCheck ? (
            <div className="mt-1">
              <Badge tone={riskLabel[lastCheck.risk_level].tone}>
                {riskLabel[lastCheck.risk_level].text}
              </Badge>
            </div>
          ) : (
            <p className="text-sm mt-1 text-[var(--color-muted)]">Chưa có</p>
          )}
        </Card>
      </div>

      <div className="space-y-3">
        {blocks.map((b, idx) => (
          <Link key={idx} href={b.hrefOverride || b.href} className="block">
            <Card className="flex items-center gap-3 hover:shadow-md transition">
              <div className="text-3xl leading-none">{b.emoji}</div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-ink)]">{b.title}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">{b.desc}</p>
              </div>
              <div className="text-[var(--color-muted)]">›</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
