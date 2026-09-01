"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Button } from "@/components/ui";
import { DEMO_DISCLAIMER, type AssistantResponse } from "@/lib/assistantShared";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const suggestions = [
  "Boss của tôi không đưa payslip",
  "Tôi làm Chủ nhật nhưng không được trả thêm",
  "Boss nói sinh viên chỉ được trả $20/giờ tiền mặt",
  "Tôi bị cho nghỉ việc đột ngột",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setError(null);
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, role: "user", content: trimmed, created_at: new Date().toISOString() },
    ]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: `tmp-a-${Date.now()}`,
            role: "assistant",
            content: JSON.stringify(data.response),
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        setError(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch {
      setError("Không kết nối được server, kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 py-2 flex flex-col min-h-[70vh]">
      <PageHeader title="AI Workplace Assistant" subtitle="Mô tả tình huống của bạn bằng tiếng Việt hoặc tiếng Anh" />

      <div className="bg-[var(--color-accent-light)] text-[11px] text-[var(--color-muted)] rounded-xl p-2.5 mb-3">
        ℹ️ {DEMO_DISCLAIMER}
      </div>

      <div className="flex-1 space-y-3">
        {!loadingHistory && messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--color-muted)]">Thử một trong các câu hỏi phổ biến:</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full text-left text-sm rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 hover:border-[var(--color-primary)]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="animate-pulse">💬 Đang soạn phản hồi...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 pt-3 pb-2 bg-[var(--color-bg)] flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tình huống của bạn..."
          className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] bg-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-[var(--color-primary)] text-white px-4 font-semibold text-sm disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[var(--color-primary)] text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%]">
          {message.content}
        </div>
      </div>
    );
  }

  let parsed: AssistantResponse | null = null;
  try {
    parsed = JSON.parse(message.content);
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return (
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm max-w-[85%] border border-[var(--color-border)]">
        {message.content}
      </div>
    );
  }

  return (
    <Card className="max-w-[95%]">
      <p className="font-semibold text-sm text-[var(--color-primary-dark)]">{parsed.topic}</p>
      <div className="mt-2 space-y-2.5 text-sm">
        <Block label="Có thể đang xảy ra gì" text={parsed.whatMightBeHappening} />
        <Block label="Vì sao điều này quan trọng" text={parsed.whyItMatters} />
        <ListBlock label="Bạn có thể làm gì" items={parsed.whatYouCanDo} />
        <ListBlock label="Bằng chứng nên giữ lại" items={parsed.evidenceToKeep} />
      </div>
      <Link href="/support" className="block mt-3">
        <Button variant="secondary" className="!py-2 !text-xs">
          Xem tổ chức có thể giúp bạn →
        </Button>
      </Link>
    </Card>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--color-muted)]">{label}</p>
      <p className="mt-0.5">{text}</p>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--color-muted)]">{label}</p>
      <ul className="mt-0.5 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <span>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
