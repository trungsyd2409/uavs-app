import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none w-full";
  const variants: Record<string, string> = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]",
    secondary:
      "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] hover:bg-[#d5efdc]",
    ghost: "bg-transparent text-[var(--color-muted)] hover:bg-black/5",
    danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm transition active:scale-[0.98] w-full";
  const variants: Record<string, string> = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]",
    secondary: "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] hover:bg-[#d5efdc]",
    ghost: "bg-transparent text-[var(--color-muted)] hover:bg-black/5",
  };
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "issue" | "high";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-black/5 text-[var(--color-muted)]",
    ok: "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]",
    issue: "bg-[var(--color-warn-light)] text-[var(--color-warn)]",
    high: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <div className="px-5 pt-6 pb-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] mb-2"
        >
          ← Quay lại
        </Link>
      )}
      <h1 className="text-xl font-bold text-[var(--color-ink)]">{title}</h1>
      {subtitle && <p className="text-sm text-[var(--color-muted)] mt-1">{subtitle}</p>}
    </div>
  );
}
