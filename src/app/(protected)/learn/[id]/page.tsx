"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { lessons } from "@/data/lessons";
import { Card, Button, PageHeader, Badge } from "@/components/ui";

type Phase = "content" | "quiz" | "done";

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const lesson = lessons.find((l) => l.id === id);

  const [phase, setPhase] = useState<Phase>("content");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!lesson) {
    return (
      <div className="px-5 py-6">
        <p>Không tìm thấy bài học.</p>
      </div>
    );
  }

  const question = lesson.quiz[qIndex];

  async function finish(finalCorrect: number) {
    setSaving(true);
    const score = Math.round((finalCorrect / lesson!.quiz.length) * 100);
    try {
      await fetch("/api/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson!.id, score }),
      });
    } finally {
      setSaving(false);
      setPhase("done");
    }
  }

  function answer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplain(true);
    if (idx === question.correctIndex) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (qIndex + 1 < lesson!.quiz.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setShowExplain(false);
    } else {
      finish(correctCount);
    }
  }

  return (
    <div className="px-5 py-2 pb-8">
      <PageHeader title={lesson.title} backHref="/learn" />

      {phase === "content" && (
        <div className="space-y-3">
          {lesson.content.map((c, i) => (
            <Card key={i}>
              <p className="text-sm leading-relaxed">{c}</p>
            </Card>
          ))}
          <Button onClick={() => setPhase("quiz")}>Làm quiz →</Button>
        </div>
      )}

      {phase === "quiz" && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-[var(--color-muted)]">
            Câu hỏi {qIndex + 1}/{lesson.quiz.length}
          </p>
          <Card>
            <p className="font-semibold text-sm mb-3">{question.question}</p>
            <div className="space-y-2">
              {question.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === question.correctIndex;
                let cls = "border-[var(--color-border)]";
                if (selected !== null) {
                  if (isCorrect) cls = "border-[var(--color-primary)] bg-[var(--color-primary-light)]";
                  else if (isSelected) cls = "border-[var(--color-danger)] bg-[var(--color-danger-light)]";
                } else if (isSelected) {
                  cls = "border-[var(--color-primary)]";
                }
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={selected !== null}
                    className={`w-full text-left rounded-xl border-2 px-3 py-2.5 text-sm ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {showExplain && (
              <div className="mt-3 text-sm bg-black/5 rounded-xl p-3">
                <p className="font-semibold mb-1">
                  {selected === question.correctIndex ? "✓ Chính xác!" : "✗ Chưa đúng"}
                </p>
                <p className="text-[var(--color-muted)]">{question.explanation}</p>
              </div>
            )}
          </Card>
          {selected !== null && (
            <Button onClick={next} disabled={saving}>
              {qIndex + 1 < lesson.quiz.length ? "Câu tiếp theo →" : saving ? "Đang lưu..." : "Hoàn thành"}
            </Button>
          )}
        </div>
      )}

      {phase === "done" && (
        <Card className="text-center py-8">
          <div className="text-5xl mb-2">🏅</div>
          <p className="font-bold text-lg">Hoàn thành bài học!</p>
          <div className="mt-2">
            <Badge tone="ok">
              {correctCount}/{lesson.quiz.length} câu đúng
            </Badge>
          </div>
          <Button className="mt-5" onClick={() => router.push("/learn")}>
            Quay lại danh sách bài học
          </Button>
        </Card>
      )}
    </div>
  );
}
