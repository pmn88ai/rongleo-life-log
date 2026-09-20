# Tiến độ — Quan Sát (RongLeo Life Log)

## Trạng thái hiện tại

**Code complete, đã QA tự động đầy đủ trên chế độ lưu-trên-thiết-bị (guest); chế độ đám mây đã có credentials Supabase thật, sẵn sàng để tự kiểm tra trước khi deploy.**

- `npm run build` chạy sạch.
- `npm run qa` (Playwright, Chromium thật): **103/104 PASS**. 1 fail còn lại không phải bug — test giả định "chưa cấu hình đám mây" đã lỗi thời vì `.env.local` giờ có Supabase credentials thật (xem mục v2.2 bên dưới).
- Chưa có git repository / chưa push GitHub / chưa deploy.

## Mốc

### v2.0 — Life Event Logger (từ habit tracker cũ)
Viết lại từ `rongleo-habit-tracker` (streak/habit) sang mô hình tổng quát EventDefinition → Event, 5 kiểu ghi nhận, thư viện 324 sự kiện, migration tự động từ dữ liệu v1. PWA (manifest + service worker + icon set). QA Playwright tự cài (không có browser tool sẵn trong phiên) — 61/61 PASS.

### v2.1 — Repositioning: Capture-first, mundane-first
Sửa lại định vị sản phẩm sau phản hồi operator: không phải activity/habit tracker. Capture là màn hình chính (không phải 1 tab ngang hàng), 💩 Đại tiện/🚽 Tiểu tiện là công dân hạng nhất trong starter set, thư viện mở rộng 324→354 (thêm mundane/private/external-world). Nhiều vòng fix theo phản hồi dùng thật: hợp nhất luồng "Ghi điều khác"/Quản lý, xóa dùng modal thay vì `confirm()` gốc trình duyệt, bỏ gộp nhóm "× N" trong Dòng thời gian (mỗi lần bấm 1 dòng riêng), bỏ hẳn khái niệm ẩn/tắt (không dùng thì xóa hẳn), bỏ giới hạn 12 ô trên Capture Grid, sửa bug double-render (Yêu thích hiện trùng trong "Tất cả"), thêm đồng bộ đa tab (`storage` event). QA cuối chuỗi: 83/83 PASS.

### v2.2 — Local-first + đăng nhập quản trị viên tùy chọn (Supabase)
Thêm chế độ đám mây tùy chọn, giữ nguyên tắc: **guest/local luôn là mặc định và đầy đủ tính năng, không bao giờ cần đăng nhập**. Kiến trúc: Supabase Auth (email/password thật, không so mật khẩu trong React) + 2 bảng RLS theo `auth.uid()` + outbox sync (`syncQueue`, ghi local trước, đồng bộ nền). Bảo mật: không mật khẩu/service_role key nào trong client, chỉ `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Đăng xuất không xóa dữ liệu local; đăng nhập lần đầu có dữ liệu cả 2 bên → hỏi Gộp/Chỉ-cloud/Khôi-phục/Bắt-đầu-trống, không tự ý ghi đè.

QA: 97/97 PASS, gồm `runCloudGuestQA` (guest không bao giờ gọi mạng tới Supabase, không có login wall, không lộ chữ "Supabase" trong UI) và `runBundleSecurityQA` (quét bundle production xác nhận không rò rỉ secret). **Hạn chế lúc code xong**: chưa có Supabase project thật trong môi trường code, nên luồng đăng nhập/đồng bộ/RLS chỉ được code-review + verify phần "guest không đụng mạng", chưa test E2E thật.

*Cập nhật sau đó*: operator đã tự tạo `.env.local` với Supabase credentials thật — chế độ đám mây giờ **có thể** test thật khi cần (chưa được yêu cầu/thực hiện).

### Giao diện: 3 chế độ Sáng / Tối / Sang trọng
Thêm đúng theo nguyên tắc UI/UX cố định của dự án (mọi app phải có 3 theme, Sang trọng = tối + vàng/đồng). Kiến trúc: CSS custom properties theo `data-theme` trên `<html>`, 17 token ngữ nghĩa Tailwind thay cho màu `stone-*` hardcode trước đó trên toàn bộ 29 file component/page. Không có hiện tượng nháy sai theme khi tải trang (script inline trong `index.html` set theme trước khi React mount). QA: thêm `runThemeQA` (7 test) — 103/104 PASS tổng.

**Sau phản hồi operator dùng thử** (cùng đợt):
- Chuyển icon chuyển đổi giao diện ra thẳng màn hình Capture (trước đó chỉ có trong Quản lý → Dữ liệu, nay có cả 2 nơi, dùng chung 1 component `ThemeSwitcher.jsx`).
- Thêm nút xóa trực tiếp trên từng dòng ở Dòng thời gian/Hôm nay/Lịch (trước đó phải mở modal chi tiết mới xóa được) — vẫn xác nhận qua modal trong app, không phải `confirm()` gốc trình duyệt.
- Thêm "Xóa toàn bộ dữ liệu trên thiết bị này" (Quản lý → Dữ liệu → Vùng nguy hiểm) để operator tự dọn dữ liệu thử nghiệm trên máy mình trước khi deploy, có xác nhận + best-effort dọn luôn bản sao trên đám mây nếu đang đăng nhập.
- Dọn repo trước khi push: gitignore thư mục `rongleo-habit-tracker/` (source cũ, không còn được dùng ở đâu trong code).

## Việc còn mở (chưa làm, không chặn deploy)

- Test E2E thật cho luồng đăng nhập/đồng bộ/RLS với Supabase project thật (có credentials rồi, chưa chạy).
- Chưa có git repository — operator sẽ tự `git init` + push.
- `Icon.theme` mới thêm (icon chuyển đổi giao diện) dùng hình tròn nửa sáng nửa tối đơn giản — có thể tinh chỉnh lại nếu operator muốn icon khác.
