"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Trang chủ", icon: "🏠" },
  { href: "/check-job", label: "Việc làm", icon: "🔍" },
  { href: "/assistant", label: "Trợ lý", icon: "💬" },
  { href: "/learn", label: "Học", icon: "🎓" },
  { href: "/support", label: "Hỗ trợ", icon: "🤝" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div className="app-shell !min-h-0 !shadow-none px-0">
        <div className="mx-3 mb-3 rounded-2xl bg-white border border-[var(--color-border)] shadow-lg flex justify-between px-2 py-2">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[11px] font-medium transition ${
                  active
                    ? "text-[var(--color-primary-dark)] bg-[var(--color-primary-light)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
