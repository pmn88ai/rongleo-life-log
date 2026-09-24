# Quan Sát

Life Event Logger tiếng Việt, local-first — một chạm để ghi lại bất kỳ chuyện gì vừa xảy ra, từ chuyện thường ngày/riêng tư (💩 đại tiện, 🚽 tiểu tiện, uống nước...) đến công việc, cảm xúc, sự kiện bất thường. Không phải habit tracker (không streak, không huy hiệu, không nhãn "tốt/xấu") — triết lý là **quan sát trước, không phán xét**.

PWA cài được lên điện thoại, hoạt động offline. Dữ liệu mặc định lưu trên thiết bị (không cần tài khoản); có thể bật đồng bộ đám mây tùy chọn cho quản trị viên.

## Tính năng

- **Ghi nhận 1 chạm**: lưới sự kiện hay dùng trên màn hình chính, không giới hạn số ô, ưu tiên yêu thích → gần đây → hay dùng.
- **Thư viện 354 loại sự kiện** có sẵn, 18 nhóm, tìm không dấu tiếng Việt + alias tiếng Anh, hoặc tự tạo loại mới.
- **5 kiểu ghi nhận**: mốc thời gian (moment), số lần (count), số đo (measurement), thời lượng (duration), đánh giá (rating).
- **Dòng thời gian**: mỗi lần bấm là 1 dòng riêng (không gộp nhóm), phân trang cho hàng chục nghìn sự kiện, tìm kiếm + lọc theo nhóm, xóa trực tiếp trên từng dòng.
- **Lịch** xem theo tháng, **Thống kê** theo khoảng thời gian (không có nhãn tốt/xấu).
- **3 chế độ giao diện**: Sáng / Tối / Sang trọng (vàng-đồng) — đổi nhanh từ icon trên màn hình chính hoặc Quản lý → Dữ liệu.
- **Sao lưu/khôi phục** bằng file JSON, gộp hoặc ghi đè.
- **Đồng bộ đám mây tùy chọn** (Supabase Auth, dành cho quản trị viên) — ứng dụng hoạt động đầy đủ mà không cần đăng nhập; đăng nhập chỉ là tính năng bổ sung, không bao giờ là điều kiện bắt buộc. Mất mạng/đám mây lỗi không làm hỏng ứng dụng.
- **PWA**: cài lên màn hình chính, hoạt động offline (service worker + app shell cache).

## Bắt đầu

```bash
npm install
npm run dev       # http://localhost:5173
```

Ứng dụng hoạt động đầy đủ ngay lập tức — không cần cấu hình gì thêm cho chế độ lưu trên thiết bị (mặc định).

### Bật đồng bộ đám mây (tùy chọn)

Chỉ cần nếu muốn bật đăng nhập quản trị viên + đồng bộ Supabase:

1. Tạo project trên [Supabase](https://supabase.com) (hoặc dùng project sẵn có).
2. Chạy **lần lượt theo thứ tự** toàn bộ file trong `supabase/migrations/` trên project đó (SQL Editor hoặc CLI): `0001_life_log_cloud.sql` rồi `0002_soft_delete.sql`. Nếu project đã chạy 0001 từ trước, chỉ cần chạy thêm 0002 (additive, không đụng dữ liệu sẵn có).
3. Tạo tài khoản quản trị viên qua **Supabase Dashboard → Authentication** (không tạo qua code, để không lộ mật khẩu/service key trong ứng dụng).
4. Copy `.env.example` → `.env.local`, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (lấy ở Project Settings → API — chỉ dùng **anon key**, không bao giờ dùng `service_role`).
5. Restart `npm run dev`.

`.env.local` đã được gitignore, không bao giờ commit.

## Scripts

| Lệnh | Việc gì |
|---|---|
| `npm run dev` | Chạy dev server (Vite, hot reload) |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Chạy thử bản build production ở local |
| `npm run icons` | Sinh lại bộ icon PWA từ `scripts/icon-source-*.svg` |
| `npm run qa` | Chạy bộ test Playwright thật trên Chromium (yêu cầu `npm run build && npm run preview` đang chạy ở port 5199) |

## Cấu trúc thư mục

```
src/
├── app/          App.jsx — state container gốc, wiring
├── auth/         Supabase Auth context (guest/authenticated)
├── components/   UI dùng chung (Modal, EventButton, TimelineRow...)
├── pages/        1 file / 1 màn hình (Capture, Timeline, Calendar, Statistics, Manage, AddEvent)
├── domain/       Logic thuần, không phụ thuộc React/backend (eventService, selectors, statistics, migration, cloudSync)
├── storage/      localStorage (nguồn sự thật) + cloudRepository + syncQueue (outbox pattern)
├── data/         Thư viện 354 sự kiện, danh mục, bộ khởi đầu
└── utils/        Format ngày giờ, id...
supabase/
└── migrations/   SQL cho chế độ đám mây tùy chọn
scripts/
├── qa-playwright.mjs   Bộ QA thường trực (Playwright, chạy thật trên Chromium)
└── generate-icons.mjs  Sinh icon PWA
```

Kiến trúc **local-first**: `localStorage` luôn là nguồn sự thật, kể cả khi đã đăng nhập. Đồng bộ đám mây chạy nền qua hàng đợi (`syncQueue`), không bao giờ chặn thao tác ghi nhận.

## Triển khai (deploy)

Đây là SPA tĩnh (Vite build ra HTML/CSS/JS thuần) — deploy được lên bất kỳ static host nào (Vercel, Netlify, Cloudflare Pages...):

```bash
npm run build   # output: dist/
```

- Nếu dùng chế độ đám mây, khai báo `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong biến môi trường của host deploy (không phải chỉ `.env.local`).
- Không bắt buộc — nếu bỏ trống, ứng dụng tự chuyển sang chế độ lưu-trên-thiết-bị hoàn toàn, không gọi Supabase, không có màn hình bắt đăng nhập.
- Dữ liệu người dùng nằm trong `localStorage` của trình duyệt họ — mỗi người dùng mới trên máy/trình duyệt khác luôn bắt đầu trống, không liên quan gì đến dữ liệu bạn từng thử trên máy mình. Muốn dọn dữ liệu thử nghiệm trên máy mình trước khi demo: **Quản lý → Dữ liệu → Vùng nguy hiểm → Xóa toàn bộ dữ liệu trên thiết bị này**.

## Trạng thái

Xem [PROGRESS.md](PROGRESS.md) để biết lịch sử các mốc và trạng thái hiện tại.
