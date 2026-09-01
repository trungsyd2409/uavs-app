"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export function TopBar({ name }: { name: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-[var(--color-bg)]/90 backdrop-blur border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-xl">🤝</span>
          <span className="font-bold text-[var(--color-primary-dark)]">Bạn Đồng Hành</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-muted)] hidden sm:inline">Xin chào, {name}</span>
          <button
            onClick={logout}
            className="text-xs font-semibold text-[var(--color-muted)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 hover:bg-black/5"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
