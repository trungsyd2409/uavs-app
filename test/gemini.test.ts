/**
 * Test cơ chế chọn model trong gemini.ts với một Gemini giả.
 * Tình huống thật đã gặp: "models/gemini-2.5-flash-lite is no longer available to new users" (404).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();
vi.mock("@google/genai", async (importOriginal) => {
  const real = await importOriginal<typeof import("@google/genai")>();
  return { ...real, GoogleGenAI: class { models = { generateContent }; } };
});

import { ApiError } from "@google/genai";
import { GeminiAuthError, generateJson, isModelUnavailable, resetUnavailableModels } from "../src/lib/assistant/gemini";

const unavailable = () => new ApiError({
  status: 404,
  message: '{"error":{"code":404,"message":"This model models/old-model is no longer available to new users.","status":"NOT_FOUND"}}',
});
const ok = (text: string) => ({ text });
const call = (models: string[]) =>
  generateJson<{ a: number }>({ models, system: "s", prompt: "p", schema: {}, timeoutMs: 1000 });

beforeEach(() => {
  generateContent.mockReset();
  resetUnavailableModels();
  process.env.GEMINI_API_KEY = "test-key";
});

describe("chọn model", () => {
  it("model đầu bị khoá (404) -> tự dùng model sau", async () => {
    generateContent.mockRejectedValueOnce(unavailable()).mockResolvedValueOnce(ok('{"a":1}'));
    const result = await call(["old-model", "new-model"]);
    expect(result).toEqual({ data: { a: 1 }, model: "new-model" });
  });

  it("ghi nhớ model bị khoá: câu hỏi sau không gọi lại model đó", async () => {
    generateContent.mockRejectedValueOnce(unavailable()).mockResolvedValue(ok('{"a":1}'));
    await call(["old-model", "new-model"]);
    generateContent.mockClear();
    await call(["old-model", "new-model"]);
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(generateContent.mock.calls[0][0].model).toBe("new-model");
  });

  it("lỗi tạm thời (503) KHÔNG bị ghi nhớ là model hỏng", async () => {
    generateContent.mockRejectedValueOnce(new ApiError({ status: 503, message: "overloaded" }))
      .mockResolvedValue(ok('{"a":1}'));
    await call(["m1", "m2"]);
    generateContent.mockClear();
    await call(["m1", "m2"]);
    expect(generateContent.mock.calls[0][0].model).toBe("m1");
  });

  it("tất cả model đều hỏng -> báo lỗi của model cuối", async () => {
    generateContent.mockRejectedValue(unavailable());
    await expect(call(["a", "b"])).rejects.toThrow(/no longer available/);
  });

  it("sai API key -> dừng ngay, không thử model khác", async () => {
    generateContent.mockRejectedValue(new ApiError({ status: 400, message: "API key not valid. API_KEY_INVALID" }));
    await expect(call(["a", "b"])).rejects.toBeInstanceOf(GeminiAuthError);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("nhận diện đúng lỗi model không dùng được", () => {
    expect(isModelUnavailable(unavailable())).toBe(true);
    expect(isModelUnavailable(new ApiError({ status: 503, message: "overloaded" }))).toBe(false);
  });
});
