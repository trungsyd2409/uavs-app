# Trợ lý AI (phần online) — Bạn Đồng Hành

```
câu hỏi tiếng Việt
  → NLU (src/lib/assistant/nlu.ts): intent, entities, risk, englishQuery
  → Grounding song song (grounding.ts):
       RAG: embed → hybrid search (vector + BM25) → RRF → rerank   (retrieval.ts, rerank.ts)
       Bảng lương tối thiểu                                         (wages.ts)
       ABN Lookup (tuỳ chọn)                                        (abn.ts)
  → Câu trả lời 5 phần tiếng Việt (answer.ts) hoặc mẫu dự phòng
  + Khối khẩn cấp tạo bằng code khi risk cao (support.ts)
```

## File trong gói

| File | Việc |
|---|---|
| `src/lib/assistant/index.ts` | `askAssistant(message, profile)` — điểm vào duy nhất |
| `src/lib/assistant/config.ts` | Model, đường dẫn rag.db, ngưỡng, timeout |
| `src/lib/assistant/retrieval.ts` | Bản TypeScript của `lib/search.py` (pipeline) |
| `src/app/api/assistant/route.ts` | `POST /api/assistant`, `GET /api/assistant` (trạng thái) |
| `src/app/assistant-demo/page.tsx` | Trang thử `/assistant-demo` |
| `test/` | 60 test, không cần mạng/API key; `fixtures/sample-rag.db` là dữ liệu THỬ |
| `next.config.example.ts` | Dòng `outputFileTracingIncludes` cần thêm vào next.config của app |

## Lệnh

```bash
npm test                 # 60 test
npm run dev              # mở http://localhost:3000/assistant-demo
curl localhost:3000/api/assistant          # kiểm tra rag.db + chế độ
```

## Gọi từ trang AI Assistant sẵn có

```ts
const res = await fetch("/api/assistant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, profile: { visa: "student", industry: "hospitality", employment: "casual", state: "NSW" } }),
});
const data = await res.json(); // data.answer.whatIsHappening, data.answer.whatToDo, data.sources, data.urgent...
```

Giá trị `profile` phải khớp taxonomy của pipeline: visa `student|whv|temp_work|pr`,
industry `hospitality|beauty|cleaning|retail|farm`, employment `casual|part_time|full_time|contractor`.
Onboarding của app dùng giá trị khác thì đổi (map) trước khi gửi.

## Lưu ý

- `EMBED_DIM = 768` trong `config.ts` phải khớp pipeline. App tự kiểm tra `meta.embed_dim` của rag.db.
- App từ chối rag.db vector giả khi chạy Gemini thật (kết quả sẽ vô nghĩa).
- Lương tối thiểu trong `wages.ts` phải cập nhật mỗi 1/7. Danh bạ trong `support.ts` có thể thay bằng `supportOrgs.ts` của app.
- Vercel: chọn Node 22 trở lên; thêm `GEMINI_API_KEY` trong Project Settings → Environment Variables.
