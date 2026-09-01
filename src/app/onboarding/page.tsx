"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

interface Step {
  key: "goal" | "experience" | "visa" | "industry" | "employment";
  title: string;
  subtitle: string;
  options: { emoji: string; label: string }[];
}

const steps: Step[] = [
  {
    key: "goal",
    title: "Bạn muốn làm gì?",
    subtitle: "Chọn điều gần đúng nhất với bạn lúc này",
    options: [
      { emoji: "✅", label: "Kiểm tra công việc hiện tại có công bằng không" },
      { emoji: "🆕", label: "Kiểm tra công việc mới trước khi nhận lời" },
      { emoji: "📚", label: "Tìm hiểu quyền lợi tại nơi làm việc" },
      { emoji: "⚠️", label: "Tôi đang gặp vấn đề tại nơi làm việc" },
      { emoji: "🤔", label: "Tôi chưa chắc chắn" },
    ],
  },
  {
    key: "experience",
    title: "Kinh nghiệm của bạn",
    subtitle: "Bạn đã làm việc tại Úc bao lâu rồi?",
    options: [
      { emoji: "🌱", label: "Mới bắt đầu làm việc tại Úc" },
      { emoji: "🕐", label: "Đã làm dưới 6 tháng" },
      { emoji: "🕕", label: "6–12 tháng" },
      { emoji: "🕛", label: "Hơn 1 năm" },
    ],
  },
  {
    key: "visa",
    title: "Visa của bạn",
    subtitle: "Thông tin này giúp cá nhân hoá nội dung phù hợp",
    options: [
      { emoji: "🎓", label: "Du học sinh (Student)" },
      { emoji: "🧳", label: "Working Holiday" },
      { emoji: "💼", label: "Tạm trú diện lao động (Temporary Work)" },
      { emoji: "🏠", label: "Thường trú nhân (Permanent Resident)" },
      { emoji: "❓", label: "Không chắc chắn" },
    ],
  },
  {
    key: "industry",
    title: "Ngành nghề",
    subtitle: "Bạn đang/sẽ làm việc trong ngành nào?",
    options: [
      { emoji: "🍜", label: "Nhà hàng / Quán cà phê" },
      { emoji: "💅", label: "Nail / Làm đẹp" },
      { emoji: "🧹", label: "Dọn dẹp (Cleaning)" },
      { emoji: "🛍️", label: "Bán lẻ (Retail)" },
      { emoji: "🌾", label: "Nông trại (Farm)" },
      { emoji: "🧩", label: "Khác" },
    ],
  },
  {
    key: "employment",
    title: "Hình thức làm việc",
    subtitle: "Bạn đang làm theo hình thức nào?",
    options: [
      { emoji: "📆", label: "Casual (thời vụ)" },
      { emoji: "🗓️", label: "Part-time (bán thời gian)" },
      { emoji: "🗓️", label: "Full-time (toàn thời gian)" },
      { emoji: "🧾", label: "Contractor / ABN" },
      { emoji: "❓", label: "Không chắc chắn" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function choose(label: string) {
    const next = { ...answers, [step.key]: label };
    setAnswers(next);
    if (!isLast) {
      setStepIndex((i) => i + 1);
    } else {
      submit(next);
    }
  }

  async function submit(finalAnswers: Record<string, string>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-6">
      <div className="flex items-center gap-1.5 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-[var(--color-primary)]" : "bg-black/10"
            }`}
          />
        ))}
      </div>

      <p className="text-xs font-semibold text-[var(--color-primary-dark)] uppercase tracking-wide">
        Bước {stepIndex + 1}/{steps.length}
      </p>
      <h1 className="text-xl font-bold mt-1">{step.title}</h1>
      <p className="text-sm text-[var(--color-muted)] mt-1 mb-6">{step.subtitle}</p>

      <div className="space-y-2.5 flex-1">
        {step.options.map((opt) => (
          <button
            key={opt.label}
            disabled={submitting}
            onClick={() => choose(opt.label)}
            className="w-full flex items-center gap-3 rounded-2xl border-2 border-[var(--color-border)] bg-white px-4 py-3.5 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition disabled:opacity-50"
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="font-medium text-sm">{opt.label}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-[var(--color-danger)] mt-3">{error}</p>}

      {stepIndex > 0 && (
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={submitting}
        >
          ← Quay lại bước trước
        </Button>
      )}
    </div>
  );
}
