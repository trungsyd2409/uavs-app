import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { lessons } from "@/data/lessons";
import { Card, PageHeader, Badge } from "@/components/ui";

export default async function LearnPage() {
  const session = await getSession();
  const db = getDb();
  const progressRows = session
    ? (db
        .prepare("SELECT lesson_id, completed, score FROM lesson_progress WHERE user_id = ?")
        .all(session.userId) as { lesson_id: string; completed: number; score: number }[])
    : [];
  const progressMap = new Map(progressRows.map((r) => [r.lesson_id, r]));
  const completedCount = progressRows.filter((r) => r.completed).length;

  return (
    <div className="px-5 py-2">
      <PageHeader
        title="Learn My Rights"
        subtitle={`Bài học ngắn 2–5 phút, kiểu Duolingo · Đã hoàn thành ${completedCount}/${lessons.length}`}
      />

      <div className="space-y-3 pb-6">
        {lessons.map((lesson, idx) => {
          const p = progressMap.get(lesson.id);
          const locked = idx > 0 && !progressMap.get(lessons[idx - 1].id)?.completed;
          return (
            <Link
              key={lesson.id}
              href={locked ? "#" : `/learn/${lesson.id}`}
              aria-disabled={locked}
              className={locked ? "pointer-events-none" : ""}
            >
              <Card className={`flex items-center gap-3 ${locked ? "opacity-50" : "hover:shadow-md transition"}`}>
                <div className="text-3xl leading-none">{lesson.emoji}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{lesson.title}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{lesson.minutes} phút</p>
                </div>
                {p?.completed ? (
                  <Badge tone="ok">✓ Xong</Badge>
                ) : locked ? (
                  <span className="text-lg">🔒</span>
                ) : (
                  <span className="text-[var(--color-muted)]">›</span>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
