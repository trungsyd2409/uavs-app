/**
 * Cấu hình của trợ lý AI. Mọi hằng số nằm ở đây (giống config/settings.py bên pipeline).
 * Chỉ dùng phía server: file này đọc biến môi trường chứa API key.
 */
import path from "node:path";

// ---- Model ----
// Đổi tên model tại đây. Danh sách trả lời có thứ tự: model đầu lỗi thì thử model sau.
export const NLU_MODEL = process.env.AI_NLU_MODEL ?? "gemini-2.5-flash-lite";
export const RERANK_MODEL = process.env.AI_RERANK_MODEL ?? "gemini-2.5-flash-lite";
export const ANSWER_MODELS = (process.env.AI_ANSWER_MODELS ?? "gemini-2.5-flash,gemini-2.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// ---- Embedding: PHẢI khớp với pipeline (config/settings.py) ----
export const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIM = 768;

// ---- rag.db ----
export const RAG_DB_PATH = process.env.RAG_DB_PATH ?? path.join(process.cwd(), "data", "rag.db");

// ---- Tìm kiếm ----
export const RRF_K = 60;
export const SEARCH_CANDIDATES = 20; // mỗi nhánh (vector, BM25) lấy bao nhiêu ứng viên
export const RERANK_INPUT = 12; // số chunk đưa vào rerank
export const RERANK_MIN_SCORE = 5; // điểm 0-10; dưới ngưỡng thì bỏ
export const FINAL_CHUNKS = 4; // số chunk cuối cùng đưa cho LLM

// ---- Giới hạn thời gian (ms) ----
export const TIMEOUT = {
  nlu: 8_000,
  embed: 6_000,
  rerank: 8_000,
  answer: 25_000,
  abn: 5_000,
};

export const MAX_MESSAGE_CHARS = 2_000;

/** RAG_FAKE_GEMINI=1: chạy toàn bộ không gọi Gemini (khớp chế độ giả của pipeline). */
export function isFakeMode(): boolean {
  return process.env.RAG_FAKE_GEMINI === "1";
}
