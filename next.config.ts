import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel chỉ đóng gói file mà code import; rag.db được mở bằng đường dẫn nên phải khai báo
  // cho MỌI route dùng pipeline RAG.
  outputFileTracingIncludes: {
    "/api/assistant": ["./data/rag.db"],
    "/api/assistant/debug": ["./data/rag.db"],
  },
};

export default nextConfig;
