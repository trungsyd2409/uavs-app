import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel chỉ đóng gói file mà code import; rag.db được mở bằng đường dẫn nên phải khai báo
  outputFileTracingIncludes: {
    "/api/assistant": ["./data/rag.db"],
  },
};

export default nextConfig;
