/**
 * So kết quả tìm kiếm TypeScript với Python (test/fixtures/parity.json do pipeline tạo).
 * Nếu test này đỏ: logic tìm kiếm hai bên đã lệch nhau.
 */
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { fakeEmbed } from "../src/lib/assistant/gemini";
import { RagIndex, buildFtsQuery, rrf, type Filters } from "../src/lib/assistant/retrieval";

interface Case {
  name: string;
  query: string;
  filters: Filters;
  queryVector: number[];
  vector: string[];
  vectorScores: number[];
  keyword: string[];
  hybrid: string[];
}
const parity = JSON.parse(readFileSync("test/fixtures/parity.json", "utf8")) as {
  fakeEmbed: { text: string; vector: number[] };
  cases: Case[];
};
const index = new RagIndex("test/fixtures/sample-rag.db");
afterAll(() => index.close());

const hasFilter = (f: Filters) => Object.keys(f).length > 0;

describe("hàm thuần", () => {
  it("RRF khớp ví dụ đã tính tay (A, B, C)", () => {
    const result = new Map(rrf([["A", "B"], ["B", "C", "A"]]));
    expect([...result.keys()][0]).toBe("B");
    expect(result.get("A")).toBeCloseTo(1 / 61 + 1 / 63, 10);
    expect(result.get("C")).toBeCloseTo(1 / 62, 10);
  });

  it("truy vấn FTS an toàn và bỏ stopword (giống Python)", () => {
    expect(buildFtsQuery('What is the "casual" loading: 25%-rate for my job?')).toBe(
      '"casual" OR "loading" OR "25" OR "rate" OR "job"',
    );
    expect(buildFtsQuery("the of and")).toBe("");
  });

  it("vector giả khớp Python đến từng giá trị", () => {
    const ts = fakeEmbed(parity.fakeEmbed.text);
    parity.fakeEmbed.vector.forEach((v, i) => expect(ts[i]).toBeCloseTo(v, 6));
  });
});

describe("rag.db", () => {
  it("đọc đúng meta và số chunk", () => {
    expect(index.meta.embed_dim).toBe("768");
    expect(index.rows.length).toBe(Number(index.meta.chunk_count));
    expect(index.isFakeVectors).toBe(true);
  });
});

describe.each(parity.cases)("giống Python: $name", (c) => {
  const f = hasFilter(c.filters) ? c.filters : undefined;
  const q = new Float32Array(c.queryVector);

  it("vector search: cùng thứ tự (trừ các cặp điểm gần bằng nhau)", () => {
    const ts = index.vectorSearch(q, 20, f);
    const tsIds = index.chunkIds(ts.map(([id]) => id));
    expect(new Set(tsIds)).toEqual(new Set(c.vector));
    tsIds.forEach((id, i) => {
      if (id !== c.vector[i]) {
        // chỉ chấp nhận đổi chỗ khi điểm Python của hai vị trí chênh nhau rất ít (float32 vs float64)
        const j = c.vector.indexOf(id);
        expect(Math.abs(c.vectorScores[i] - c.vectorScores[j])).toBeLessThan(1e-4);
      }
    });
    ts.forEach(([, score], i) => expect(score).toBeCloseTo(c.vectorScores[i], 4));
  });

  it("keyword search (BM25): cùng kết quả", () => {
    expect(index.chunkIds(index.keywordSearch(c.query, 20, f))).toEqual(c.keyword);
  });

  it("hybrid (RRF): cùng top 5", () => {
    expect(index.hybridSearch(q, c.query, 5, f).map((h) => h.chunkId)).toEqual(c.hybrid);
  });
});

describe("lọc theo hồ sơ", () => {
  it("visa: whv không thấy tài liệu chỉ dành cho sinh viên", () => {
    const q = new Float32Array(parity.cases[0].queryVector);
    const docs = (f?: Filters) =>
      new Set(index.vectorSearch(q, 50, f).map(([id]) => index.rows.find((r) => r.id === id)!.docId));
    expect(docs({ visa: "student" }).has("t_student_visa")).toBe(true);
    expect(docs({ visa: "whv" }).has("t_student_visa")).toBe(false);
    expect(docs().has("t_student_visa")).toBe(true);
  });

  it("boostTopic đưa chunk đúng topic lên cao hơn", () => {
    const text = "work rights";
    const q = fakeEmbed(text);
    const plain = index.hybridSearch(q, text, 13).findIndex((h) => h.topic === "unfair_dismissal");
    const boosted = index.hybridSearch(q, text, 13, undefined, 20, "unfair_dismissal")
      .findIndex((h) => h.topic === "unfair_dismissal");
    expect(boosted).toBeLessThanOrEqual(plain);
    expect(boosted).toBeLessThan(3);
  });

  it("từ chối vector sai số chiều", () => {
    expect(() => index.vectorSearch(new Float32Array(3072), 5)).toThrow(/3072/);
  });
});
