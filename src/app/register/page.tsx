"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🤝</div>
          <h1 className="text-2xl font-bold text-[var(--color-primary-dark)]">Tạo tài khoản</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Miễn phí, chỉ mất 1 phút để bắt đầu
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted)]">Tên của bạn</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              placeholder="ban@vidu.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted)]">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Đang tạo..." : "Đăng ký"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-[var(--color-primary-dark)] font-semibold">
            Đăng nhập
          </Link>
        </p>

        <p className="text-center text-[11px] text-[var(--color-muted)] mt-8">
          Đây là bản demo cho hackathon — thông tin của bạn được lưu trên máy chủ demo, không dùng cho mục đích khác.
        </p>
      </div>
    </div>
  );
}
