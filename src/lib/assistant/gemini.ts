/**
 * Gọi Gemini: embedding câu hỏi + sinh JSON theo schema.
 * - Mỗi lời gọi có timeout (AbortSignal) để một bước chậm không làm treo cả API.
 * - Lỗi API key -> GeminiAuthError (không thử lại, không thử model khác).
 * - Chế độ giả (RAG_FAKE_GEMINI=1): embedding bằng băm từ khoá, KHỚP pipeline Python.
 */
import { createHash } from "node:crypto";
import { ApiError, GoogleGenAI } from "@google/genai";
import { EMBED_DIM, EMBED_MODEL, isFakeMode } from "./config";

export class GeminiAuthError extends Error {}
export class GeminiTimeoutError extends Error {}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new GeminiAuthError("Thiếu GEMINI_API_KEY trong .env.local");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function isAuthError(e: unknown): boolean {
  const text = String((e as Error)?.message ?? e);
  const status = e instanceof ApiError ? e.status : undefined;
  return text.includes("API_KEY_INVALID") || text.includes("API key not valid") || status === 401 || status === 403;
}

function isAbort(e: unknown): boolean {
  const name = (e as Error)?.name;
  return name === "AbortError" || name === "TimeoutError";
}

/** Chuẩn hoá lỗi của SDK thành 3 loại dễ xử lý. */
function translateError(e: unknown, what: string): Error {
  if (isAuthError(e)) return new GeminiAuthError("Google từ chối GEMINI_API_KEY (API_KEY_INVALID)");
  if (isAbort(e)) return new GeminiTimeoutError(`${what} quá thời gian cho phép`);
  return e instanceof Error ? e : new Error(String(e));
}

// ---------------- Vector ----------------

/** Chia vector cho độ dài của nó (L2). Bắt buộc khi cắt Matryoshka còn 768 chiều. */
export function l2Normalize(values: ArrayLike<number>): Float32Array {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i] * values[i];
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) out[i] = values[i] / norm;
  return out;
}

const WORD = /[a-zA-ZÀ-ỹ0-9]+/g;

/** Bản TypeScript của _fake_embed_one() trong pipeline (lib/gemini_client.py). */
export function fakeEmbed(text: string): Float32Array {
  const vec = new Float64Array(EMBED_DIM);
  for (const word of text.toLowerCase().match(WORD) ?? []) {
    const h = BigInt("0x" + createHash("md5").update(word, "utf8").digest("hex"));
    const index = Number(h % BigInt(EMBED_DIM));
    // Dùng BigInt(...) thay cho 20n/2n: tsconfig của app đặt target ES2017, không cho viết BigInt literal
    vec[index] += (h >> BigInt(20)) % BigInt(2) === BigInt(1) ? 1 : -1;
  }
  if (vec.every((v) => v === 0)) vec[0] = 1;
  return l2Normalize(vec);
}

/** Embed câu hỏi: task RETRIEVAL_QUERY, 768 chiều, đã chuẩn hoá L2. */
export async function embedQuery(text: string, timeoutMs: number): Promise<Float32Array> {
  if (isFakeMode()) return fakeEmbed(text);
  try {
    const res = await getClient().models.embedContent({
      model: EMBED_MODEL,
      contents: [text],
      config: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: EMBED_DIM, // KHÔNG ĐƯỢC THIẾU: phải khớp vector trong rag.db
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    });
    const values = res.embeddings?.[0]?.values;
    if (!values || values.length !== EMBED_DIM) {
      throw new Error(`Gemini trả về vector ${values?.length ?? 0} chiều, cần ${EMBED_DIM}`);
    }
    return l2Normalize(values);
  } catch (e) {
    throw translateError(e, "embedding");
  }
}

// ---------------- Sinh JSON ----------------

export interface GenerateOptions {
  models: string[]; // thử lần lượt: model đầu lỗi (không phải lỗi key) thì dùng model sau
  system: string;
  prompt: string;
  schema: object;
  timeoutMs: number;
  temperature?: number;
}

/** Gọi model sinh văn bản, ép trả JSON đúng schema. Trả về object và tên model đã dùng. */
export async function generateJson<T>(opts: GenerateOptions): Promise<{ data: T; model: string }> {
  let lastError: Error = new Error("Không có model nào để gọi");
  for (const model of opts.models) {
    try {
      const res = await getClient().models.generateContent({
        model,
        contents: opts.prompt,
        config: {
          systemInstruction: opts.system,
          responseMimeType: "application/json",
          responseSchema: opts.schema,
          temperature: opts.temperature ?? 0,
          abortSignal: AbortSignal.timeout(opts.timeoutMs),
        },
      });
      const text = res.text?.trim();
      if (!text) throw new Error(`${model} trả về rỗng`);
      return { data: JSON.parse(text) as T, model };
    } catch (e) {
      lastError = translateError(e, model);
      if (lastError instanceof GeminiAuthError) throw lastError; // sai key: model khác cũng vậy
    }
  }
  throw lastError;
}
