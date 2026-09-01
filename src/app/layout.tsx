import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bạn Đồng Hành — Quyền lợi lao động cho người Việt tại Úc",
  description:
    "Ứng dụng hỗ trợ người lao động Việt Nam tại Úc kiểm tra công việc, học quyền lợi, và tìm sự trợ giúp đáng tin cậy.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f9d58",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
