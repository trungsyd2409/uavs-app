# Bạn Đồng Hành 🤝

Ứng dụng web (mobile-first) giúp người lao động Việt Nam tại Úc kiểm tra công việc, học quyền lợi lao động, và tìm sự trợ giúp đáng tin cậy — theo mô hình MVP trong `UAVSIdea.docx`.

## Chạy thử (local)

Yêu cầu: **Node.js 22.5+** (dùng module `node:sqlite` có sẵn trong Node, không cần cài database riêng).

```bash
npm install
npm run dev
```

Mở http://localhost:3000 — đăng ký tài khoản mới để bắt đầu (dữ liệu lưu trong file SQLite tại `data/app.db`, tự tạo khi chạy lần đầu).

Build production:

```bash
npm run build
npm run start
```

## 6 chức năng chính

1. **Onboarding cá nhân hoá** — 5 bước kiểu Duolingo (mục tiêu, kinh nghiệm, visa, ngành nghề, hình thức làm việc).
2. **Check My Job** — nhập lương/giờ làm/hình thức trả lương → engine quy tắc (`src/lib/riskEngine.ts`) chấm điểm rủi ro: Trông ổn / Có thể có vấn đề / Rủi ro cao. Mức lương tối thiểu tham khảo lấy từ Fair Work Ombudsman (hiệu lực 01/07/2026: $26.44/giờ, casual $33.05/giờ).
3. **Learn My Rights** — 6 bài học ngắn kèm quiz, mở khoá dần, lưu tiến độ (`src/data/lessons.ts`).
4. **AI Workplace Assistant** — chat mô tả tình huống, engine so khớp từ khoá trả lời theo cấu trúc "Điều gì đang xảy ra / Vì sao quan trọng / Bạn nên làm gì / Bằng chứng cần giữ / Ai có thể giúp" (`src/lib/aiAssistant.ts`). **Đây là bản demo dùng câu trả lời dựng sẵn, chưa nối với LLM thật** — xem phần "Gắn AI thật" bên dưới.
5. **Evidence Locker** — lưu payslip/hợp đồng/ảnh chụp/ghi chú (tối đa 5MB/file).
6. **Trusted Support** — danh bạ tổ chức hỗ trợ thật đã kiểm chứng: Fair Work Ombudsman, Migrant Workers Centre, Community Legal Centres Australia, JobWatch, TIS National, Legal Aid — có lọc theo loại vấn đề.

## Kỹ thuật

- **Next.js 16** (App Router, Turbopack), TypeScript, Tailwind CSS v4
- **Database**: `node:sqlite` built-in (không cần cài đặt gì thêm) — schema ở `src/lib/db.ts`
- **Auth**: cookie session ký bằng JWT (`jose`), mật khẩu băm bằng `bcryptjs`
- Route bảo vệ qua `src/proxy.ts` (Next.js 16 đổi tên `middleware` → `proxy`)

## Gắn AI thật (tuỳ chọn, sau hackathon)

`src/lib/aiAssistant.ts` hiện dùng so khớp từ khoá. Để gọi LLM thật (OpenAI/Claude/Gemini...), thay nội dung hàm `askAssistant` bằng một lời gọi API tới nhà cung cấp bạn chọn, giữ nguyên cấu trúc trả về `AssistantResponse` để không phải sửa giao diện.

## Lưu ý quan trọng

- Đây là **bản demo cho hackathon**, không phải tư vấn pháp lý. Mọi số liệu lương tối thiểu và thông tin tổ chức hỗ trợ nên được người dùng tự kiểm tra lại trên website chính thức trước khi hành động.
- `SESSION_SECRET` trong `.env.local` là secret demo — đổi giá trị khác nếu triển khai thật.
