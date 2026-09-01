"use client";

import { useEffect, useState, FormEvent } from "react";
import { PageHeader, Card, Button, Badge } from "@/components/ui";

interface EvidenceItem {
  id: string;
  type: string;
  title: string;
  note: string | null;
  file_name: string | null;
  mime_type: string | null;
  created_at: string;
  has_file: number;
}

const types = [
  { value: "payslip", label: "Payslip", emoji: "💵" },
  { value: "contract", label: "Hợp đồng", emoji: "📄" },
  { value: "screenshot", label: "Ảnh chụp màn hình", emoji: "📱" },
  { value: "hours", label: "Ghi chú giờ làm", emoji: "🕐" },
  { value: "message", label: "Tin nhắn", emoji: "💬" },
  { value: "incident", label: "Ghi chú sự việc", emoji: "📝" },
];

function typeMeta(v: string) {
  return types.find((t) => t.value === v) || types[types.length - 1];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function EvidencePage() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState(types[0].value);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/evidence")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError("File quá lớn (tối đa 5MB)");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const fileData = file ? await fileToBase64(file) : undefined;
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          note: note || undefined,
          fileName: file?.name,
          mimeType: file?.type,
          fileData,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Có lỗi xảy ra");
        return;
      }
      setTitle("");
      setNote("");
      setFile(null);
      setShowForm(false);
      load();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function view(id: string) {
    const res = await fetch(`/api/evidence/${id}`);
    const data = await res.json();
    const item = data.item;
    if (item?.file_data && item?.mime_type) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<img src="data:${item.mime_type};base64,${item.file_data}" style="max-width:100%" />`
        );
        if (!item.mime_type.startsWith("image/")) {
          win.location.href = `data:${item.mime_type};base64,${item.file_data}`;
        }
      }
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/evidence/${id}`, { method: "DELETE" });
  }

  return (
    <div className="px-5 py-2 pb-6">
      <PageHeader title="Evidence Locker" subtitle="Lưu lại bằng chứng trước khi liên hệ hỗ trợ" />

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-4">
          + Thêm bằng chứng
        </Button>
      ) : (
        <Card className="mb-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">Loại</label>
              <div className="grid grid-cols-3 gap-2">
                {types.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`text-xs rounded-xl border px-2 py-2 flex flex-col items-center gap-1 ${
                      type === t.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">Tiêu đề</label>
              <input
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Payslip tháng 8"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">Ghi chú (không bắt buộc)</label>
              <textarea
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-muted)] mb-1 block">
                Đính kèm ảnh/file (không bắt buộc, tối đa 5MB)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
            </div>
            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Huỷ
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Chưa có bằng chứng nào được lưu.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => {
            const meta = typeMeta(it.type);
            return (
              <Card key={it.id} className="flex items-start gap-3">
                <div className="text-2xl">{meta.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{it.title}</p>
                    <Badge>{meta.label}</Badge>
                  </div>
                  {it.note && <p className="text-xs text-[var(--color-muted)] mt-1">{it.note}</p>}
                  <p className="text-[11px] text-[var(--color-muted)] mt-1">{fmtDate(it.created_at)}</p>
                  <div className="flex gap-3 mt-2">
                    {!!it.has_file && (
                      <button
                        onClick={() => view(it.id)}
                        className="text-xs font-semibold text-[var(--color-primary-dark)]"
                      >
                        Xem file
                      </button>
                    )}
                    <button
                      onClick={() => remove(it.id)}
                      className="text-xs font-semibold text-[var(--color-danger)]"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
