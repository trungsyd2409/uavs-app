/**
 * Test NLU, rerank, lương, ABN, câu trả lời và toàn bộ luồng askAssistant.
 * Gemini được giả lập bằng vi.mock: không cần mạng, không cần API key.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/assistant/gemini", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/lib/assistant/gemini")>();
  return { ...real, generateJson: vi.fn(), embedQuery: vi.fn(real.embedQuery) };
});

import { askAssistant } from "../src/lib/assistant";
import { fallbackAnswer, validateAnswer } from "../src/lib/assistant/answer";
import { isValidAbn, parseAbnResponse } from "../src/lib/assistant/abn";
import { GeminiAuthError, generateJson } from "../src/lib/assistant/gemini";
import { analyze, foldVietnamese, keywordIntent, scanEmergency, validateNlu } from "../src/lib/assistant/nlu";
import { sanitizeProfile } from "../src/lib/assistant/profile";
import { applyScores } from "../src/lib/assistant/rerank";
import { resetRagIndex } from "../src/lib/assistant/retrieval";
import type { NluResult, SearchHit } from "../src/lib/assistant/types";
import { compareWage, currentRate, wageEvidence } from "../src/lib/assistant/wages";
import { POST } from "../src/app/api/assistant/route";

const mockGenerate = vi.mocked(generateJson);

function nlu(partial: Partial<NluResult> = {}): NluResult {
  return { intent: "general", entities: {}, risk: "low", needsReferral: false, englishQuery: "q",
    emergencyKeywords: [], source: "gemini", ...partial };
}

beforeEach(() => {
  mockGenerate.mockReset();
  resetRagIndex();
});
afterEach(() => {
  delete process.env.RAG_FAKE_GEMINI;
});

// ---------------- NLU ----------------

describe("NLU", () => {
  it("bỏ dấu tiếng Việt để nhận cả chữ gõ không dấu", () => {
    expect(foldVietnamese("Chủ giữ HỘ CHIẾU, đe doạ")).toBe("chu giu ho chieu, de doa");
  });

  it("quét khẩn cấp: có dấu và không dấu đều bắt được", () => {
    expect(scanEmergency("chủ giữ hộ chiếu của em")).toContain("ho chieu");
    expect(scanEmergency("chu giu ho chieu cua em")).toContain("ho chieu");
    expect(scanEmergency("em bị đánh")).toContain("bi danh");
  });

  it("quét khẩn cấp không bắt nhầm từ ghép", () => {
    expect(scanEmergency("em đánh máy chậm")).toEqual([]);
    expect(scanEmergency("hỏi về lương casual")).toEqual([]);
  });

  it("phân loại từ khoá: 'phiếu lương' thắng 'lương'", () => {
    expect(keywordIntent("chủ không đưa phiếu lương")).toBe("no_payslip");
    expect(keywordIntent("chủ trả lương thấp")).toBe("underpayment");
    expect(keywordIntent("bi duoi viec")).toBe("unfair_dismissal");
    expect(keywordIntent("xin chào")).toBe("general");
  });

  it("kiểm tra JSON: bỏ intent lạ, chuẩn hoá ABN, bỏ số âm", () => {
    expect(validateNlu({ intent: "wages", risk: "low", englishQuery: "x", needsReferral: false, entities: {} })).toBeNull();
    const v = validateNlu({ intent: "underpayment", risk: "medium", needsReferral: true, englishQuery: " pay ",
      entities: { abn: "51 824 753 556", amount: -5, hourlyRate: 18 } });
    expect(v?.entities).toEqual({ abn: "51824753556", hourlyRate: 18 });
    expect(v?.englishQuery).toBe("pay");
  });

  it("Gemini nói risk thấp nhưng có từ khoá khẩn cấp -> risk cao", async () => {
    mockGenerate.mockResolvedValueOnce({ model: "m", data: {
      intent: "visa_threat", risk: "low", needsReferral: false, englishQuery: "employer holds passport", entities: {} } });
    const { nlu: r } = await analyze("Chủ giữ hộ chiếu của em");
    expect(r.risk).toBe("high");
    expect(r.needsReferral).toBe(true);
    expect(r.source).toBe("gemini");
  });

  it("Gemini trả JSON sai -> dùng fallback, vẫn có englishQuery tiếng Anh", async () => {
    mockGenerate.mockResolvedValueOnce({ model: "m", data: { nonsense: true } });
    const { nlu: r, error } = await analyze("chủ không đưa payslip");
    expect(r.source).toBe("fallback");
    expect(r.intent).toBe("no_payslip");
    expect(r.englishQuery).toMatch(/pay slips/);
    expect(error).toMatch(/không hợp lệ/);
  });

  it("sai API key thì báo lên trên, không giấu", async () => {
    mockGenerate.mockRejectedValueOnce(new GeminiAuthError("API_KEY_INVALID"));
    await expect(analyze("xin chào")).rejects.toBeInstanceOf(GeminiAuthError);
  });
});

// ---------------- Rerank ----------------

describe("rerank", () => {
  const hit = (id: number): SearchHit => ({ id, chunkId: `c${id}`, docId: "d", contextHeader: "h", content: "x",
    url: "u", source: "s", topic: "t", subtopic: "s", rrfScore: 0.01 });
  const hits = [hit(0), hit(1), hit(2), hit(3), hit(4), hit(5)];

  it("lọc dưới ngưỡng 5, sắp xếp, tối đa 4", () => {
    const out = applyScores(hits, [
      { index: 0, score: 3 }, { index: 1, score: 9 }, { index: 2, score: 6 },
      { index: 3, score: 8 }, { index: 4, score: 7 }, { index: 5, score: 5 },
    ]);
    expect(out.map((h) => h.id)).toEqual([1, 3, 4, 2]);
    expect(out[0].rerankScore).toBe(9);
  });

  it("bỏ index không hợp lệ do model trả sai", () => {
    expect(applyScores(hits, [{ index: 99, score: 10 }, { index: -1, score: 10 }, { index: 2, score: NaN }])).toEqual([]);
  });
});

// ---------------- Lương + ABN ----------------

describe("lương tối thiểu", () => {
  it("so sánh lương casual: $18 thấp hơn mức casual", () => {
    const rate = currentRate();
    const cmp = compareWage(18, true, rate);
    expect(cmp.minimum).toBeCloseTo(rate.hourly * 1.25, 2);
    expect(cmp.shortfallPerHour).toBeCloseTo(cmp.minimum - 18, 2);
  });

  it("chỉ tạo bằng chứng lương khi câu hỏi liên quan đến lương", () => {
    expect(wageEvidence(nlu({ intent: "harassment" }))).toBeNull();
    const ev = wageEvidence(nlu({ intent: "underpayment", entities: { hourlyRate: 18 } }), "casual");
    expect(ev?.content).toMatch(/BELOW/);
    expect(ev?.priority).toBe(2);
  });
});

describe("ABN", () => {
  it("checksum ATO", () => {
    expect(isValidAbn("51 824 753 556")).toBe(true);
    expect(isValidAbn("51 824 753 557")).toBe(false);
    expect(isValidAbn("123")).toBe(false);
  });

  it("đọc phản hồi JSONP của ABR", () => {
    const text = 'callback({"Abn":"51824753556","AbnStatus":"Active","EntityName":"ACME PTY LTD","EntityTypeName":"Company","AddressState":"NSW","Gst":"2000-07-01","BusinessName":[],"Message":""})';
    expect(parseAbnResponse(text)).toMatchObject({ status: "Active", entityName: "ACME PTY LTD", gstRegistered: true });
    expect(parseAbnResponse('callback({"Message":"Search text is not a valid ABN"})')).toBeNull();
  });
});

// ---------------- Câu trả lời ----------------

describe("câu trả lời", () => {
  it("kiểm tra JSON: bỏ trích dẫn ngoài phạm vi, không có bằng chứng thì 'insufficient'", () => {
    const raw = { whatIsHappening: "a", whyItMatters: "b", whatToDo: ["c", "", 5], evidenceToKeep: [],
      whoCanHelp: ["FWO"], citations: [1, 2, 9, 2], grounding: "grounded" };
    expect(validateAnswer(raw, 2)).toMatchObject({ whatToDo: ["c"], citations: [1, 2], grounding: "grounded" });
    expect(validateAnswer(raw, 0)?.grounding).toBe("insufficient");
    expect(validateAnswer({ whatIsHappening: "a" }, 2)).toBeNull();
  });

  it("mẫu dự phòng tính đúng số tiền thiếu", () => {
    const a = fallbackAnswer(nlu({ intent: "underpayment", entities: { hourlyRate: 18 } }), { employment: "casual" }, [], []);
    expect(a.whatIsHappening).toMatch(/\$18\.00\/giờ — thấp hơn/);
    expect(a.grounding).toBe("insufficient");
  });
});

// ---------------- Toàn bộ luồng ----------------

describe("askAssistant (chế độ giả, rag.db mẫu)", () => {
  beforeEach(() => { process.env.RAG_FAKE_GEMINI = "1"; });

  it("payslip: đúng intent, tìm được tài liệu payslip, đủ 5 phần", async () => {
    const { response, trace } = await askAssistant("Chủ không đưa payslip, trả tiền mặt");
    expect(response.intent).toBe("no_payslip");
    expect(response.sources.some((s) => s.title.includes("Pay slips"))).toBe(true);
    expect(response.answer.whatToDo.length).toBeGreaterThan(0);
    expect(response.urgent.show).toBe(false);
    expect(trace.map((t) => t.step)).toEqual(expect.arrayContaining(["NLU", "embed câu hỏi", "hybrid search + RRF", "rerank"]));
  });

  it("bị giữ hộ chiếu: hiện khối khẩn cấp với số 000", async () => {
    const { response } = await askAssistant("Chủ giữ hộ chiếu của em và doạ báo di trú");
    expect(response.risk).toBe("high");
    expect(response.urgent.show).toBe(true);
    expect(response.urgent.contacts.map((c) => c.phone)).toContain("000");
  });

  it("ý định tự hại: hiện Lifeline", async () => {
    const { response } = await askAssistant("em mệt quá, muốn chết");
    expect(response.urgent.contacts.map((c) => c.name)).toContain("Lifeline");
  });

  it("lọc visa: du học sinh thấy tài liệu visa sinh viên", async () => {
    const { response } = await askAssistant("sinh vien duoc lam bao nhieu gio visa", { visa: "student" });
    expect(response.sources.some((s) => s.title.includes("Student visa"))).toBe(true);
  });
});

describe("askAssistant khi API key sai", () => {
  it("không sập: dùng chế độ không có AI và ghi rõ lý do", async () => {
    mockGenerate.mockRejectedValue(new GeminiAuthError("API_KEY_INVALID"));
    const { response, trace } = await askAssistant("chủ trả lương thấp");
    expect(response.mode).toBe("fallback");
    expect(response.answer.whatIsHappening).toBeTruthy();
    expect(JSON.stringify(trace)).toMatch(/API key Gemini sai/);
  });

  it("chặn rag.db vector giả khi chạy Gemini thật", async () => {
    mockGenerate.mockResolvedValue({ model: "m", data: {
      intent: "no_payslip", risk: "low", needsReferral: false, englishQuery: "pay slip", entities: {} } });
    const { trace } = await askAssistant("chủ không đưa payslip");
    expect(JSON.stringify(trace)).toMatch(/vector GIẢ/);
  });
});

// ---------------- API route ----------------

describe("POST /api/assistant", () => {
  beforeEach(() => { process.env.RAG_FAKE_GEMINI = "1"; });
  const post = (body: unknown, query = "") =>
    POST(new Request(`http://localhost/api/assistant${query}`, { method: "POST", body: JSON.stringify(body) }));

  it("trả lời 200, có trace khi debug=1", async () => {
    const res = await post({ message: "làm thử không lương ở nhà hàng", profile: { industry: "hospitality" } }, "?debug=1");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answer.whatToDo.length).toBeGreaterThan(0);
    expect(Array.isArray(data.trace)).toBe(true);
  });

  it("không có trace khi không debug", async () => {
    const data = await (await post({ message: "payslip" })).json();
    expect(data.trace).toBeUndefined();
  });

  it("400 khi câu hỏi rỗng hoặc quá dài", async () => {
    expect((await post({ message: "  " })).status).toBe(400);
    expect((await post({ message: "a".repeat(3000) })).status).toBe(400);
  });

  it("lọc hồ sơ: bỏ giá trị lạ", () => {
    expect(sanitizeProfile({ visa: "student", industry: "hacker", state: "NSW", extra: 1 }))
      .toEqual({ visa: "student", industry: undefined, employment: undefined, state: "NSW" });
  });
});
