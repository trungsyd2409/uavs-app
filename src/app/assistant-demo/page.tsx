"use client";

/**
 * Trang thử trợ lý AI: /assistant-demo
 * Gọi POST /api/assistant/debug và hiển thị câu trả lời 5 phần, nguồn, nhật ký từng bước.
 * Có thể dùng làm mẫu để nối vào trang AI Assistant sẵn có của app.
 */
import { useState } from "react";
import type { AssistantResponse, TraceStep, UserProfile } from "@/lib/assistant/types";

type Result = AssistantResponse & { trace?: TraceStep[] };

const EXAMPLES = [
  "Chủ trả em 18 đô một giờ, làm casual ở nhà hàng có đúng không?",
  "Chủ không đưa payslip, trả tiền mặt",
  "Em làm thử 2 ngày ở quán mà không được trả tiền",
  "Gọi Fair Work thì có bị huỷ visa không?",
  "Chủ giữ hộ chiếu của em và doạ báo di trú",
];

const OPTIONS = {
  visa: [["", "Visa: không rõ"], ["student", "Du học sinh"], ["whv", "Working Holiday"], ["temp_work", "Visa lao động tạm thời"], ["pr", "Thường trú"]],
  industry: [["", "Ngành: không rõ"], ["hospitality", "Nhà hàng / quán"], ["beauty", "Nail / làm đẹp"], ["cleaning", "Dọn dẹp"], ["retail", "Bán lẻ"], ["farm", "Nông trại"]],
  employment: [["", "Hình thức: không rõ"], ["casual", "Casual"], ["part_time", "Part-time"], ["full_time", "Full-time"], ["contractor", "Contractor / ABN"]],
  state: [["", "Bang: không rõ"], ["NSW", "NSW"], ["VIC", "VIC"], ["QLD", "QLD"], ["WA", "WA"], ["SA", "SA"]],
} as const;

const GROUNDING_LABEL = {
  grounded: ["Có nguồn chính thức", "bg-green-100 text-green-800"],
  partial: ["Nguồn chỉ trả lời một phần", "bg-amber-100 text-amber-800"],
  insufficient: ["Chưa đủ thông tin chính thức", "bg-gray-200 text-gray-700"],
} as const;

export default function AssistantDemo() {
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/assistant/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, profile: profile as UserProfile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Lỗi ${res.status}`);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-4 pb-16">
      <h1 className="text-xl font-semibold">Trợ lý quyền lợi lao động</h1>

      <section className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3">
        {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map((key) => (
          <select
            key={key}
            aria-label={key}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"
            value={profile[key] ?? ""}
            onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
          >
            {OPTIONS[key].map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        ))}
      </section>

      <section className="space-y-2 rounded-2xl bg-white p-3">
        <textarea
          className="h-24 w-full resize-none rounded-lg border border-gray-200 p-2 text-sm"
          placeholder="Hỏi bằng tiếng Việt, ví dụ: chủ không đưa payslip..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => { setMessage(ex); ask(ex); }}
              className="rounded-full bg-gray-100 px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-200">
              {ex}
            </button>
          ))}
        </div>
        <button onClick={() => ask(message)} disabled={loading || !message.trim()}
          className="w-full rounded-xl bg-green-700 py-2 font-medium text-white disabled:opacity-50">
          {loading ? "Đang tìm câu trả lời..." : "Gửi câu hỏi"}
        </button>
      </section>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {result && <ResultView result={result} />}
    </main>
  );
}

function ResultView({ result }: { result: Result }) {
  const { answer, urgent, sources } = result;
  const [label, color] = GROUNDING_LABEL[answer.grounding];
  const cited = new Set(answer.citations);

  return (
    <div className="space-y-3">
      {urgent.show && (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm">
          <p className="font-semibold text-red-800">{urgent.message}</p>
          <ul className="mt-2 space-y-1">
            {urgent.contacts.map((c) => (
              <li key={c.name}>
                <a className="font-medium text-red-900 underline" href={c.phone ? `tel:${c.phone.replace(/\s/g, "")}` : c.url}>
                  {c.name}{c.phone ? ` — ${c.phone}` : ""}
                </a>
                <span className="text-red-800"> · {c.note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-2xl bg-white p-4 text-sm">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 ${color}`}>{label}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">intent: {result.intent}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">rủi ro: {result.risk}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">{result.mode === "llm" ? "Gemini" : "mẫu dự phòng"}</span>
        </div>
        <Part title="Điều gì đang xảy ra" text={answer.whatIsHappening} />
        <Part title="Vì sao quan trọng" text={answer.whyItMatters} />
        <Part title="Bạn nên làm gì" items={answer.whatToDo} ordered />
        <Part title="Bằng chứng nên giữ" items={answer.evidenceToKeep} />
        <Part title="Ai có thể giúp" items={answer.whoCanHelp} />
      </section>

      {sources.length > 0 && (
        <section className="rounded-2xl bg-white p-4 text-xs">
          <h2 className="mb-2 font-semibold">Nguồn</h2>
          <ol className="space-y-1">
            {sources.map((s) => (
              <li key={s.n} className={cited.has(s.n) ? "text-gray-900" : "text-gray-400"}>
                [{s.n}] {s.url ? <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
                <span> · {s.source}</span>
                {cited.has(s.n) && <span className="ml-1 text-green-700">✓ được trích</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="px-1 text-xs text-gray-500">{result.disclaimer}</p>

      {result.trace && (
        <details className="rounded-2xl bg-white p-4 text-xs">
          <summary className="cursor-pointer font-semibold">
            Nhật ký xử lý ({result.trace.reduce((s, t) => s + t.ms, 0)} ms)
          </summary>
          <ol className="mt-2 space-y-2">
            {result.trace.map((t, i) => (
              <li key={i}>
                <span className={t.ok ? "text-green-700" : "text-red-600"}>{t.ok ? "✓" : "✗"}</span>{" "}
                <b>{t.step}</b> <span className="text-gray-500">{t.ms} ms</span>
                {t.detail !== undefined && (
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-gray-50 p-2 whitespace-pre-wrap">
                    {typeof t.detail === "string" ? t.detail : JSON.stringify(t.detail, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function Part({ title, text, items, ordered }: { title: string; text?: string; items?: string[]; ordered?: boolean }) {
  if (!text && !items?.length) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="font-semibold text-green-800">{title}</h3>
      {text && <p className="mt-1 leading-relaxed">{text}</p>}
      {items && (
        <List className={`mt-1 space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </List>
      )}
    </div>
  );
}
