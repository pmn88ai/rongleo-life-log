# Tiến độ — Quan Sát (RongLeo Life Log)

## Trạng thái hiện tại

**Đã deploy thật lên Vercel (`rongleo-life-log.vercel.app`), cả chế độ guest và cloud đều hoạt động đúng trên thiết bị thật.**

- `npm run build` chạy sạch.
- `npm run qa` (Playwright, Chromium thật): **125/126 PASS**. 1 fail còn lại không phải bug — test giả định "chưa cấu hình đám mây" đã lỗi thời vì `.env.local`/Vercel giờ có Supabase credentials thật (xem mục v2.2 bên dưới).
- Git repository đã init, đã push GitHub, đã deploy Vercel. Gotcha thật gặp lúc deploy: xem mục "Vercel + PWA cache" bên dưới.
- **⚠️ TRƯỚC KHI DÙNG TIẾP: phải chạy `supabase/migrations/0002_soft_delete.sql` trên Supabase project thật** (xem mục "Đồng bộ xóa chéo thiết bị" bên dưới) — nếu chưa chạy, mọi thao tác xóa khi đã đăng nhập sẽ lỗi vì cột `deleted_at` chưa tồn tại.

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

### Vercel + PWA cache (gotcha thật, đã tự sửa xong)
Sau khi deploy Vercel + thêm env Supabase + redeploy, điện thoại operator vẫn báo "chưa cấu hình đám mây" — không phải bug code (tab ẩn danh cùng máy hiện đúng form đăng nhập). Nguyên nhân: service worker PWA giữ bundle JS cũ (từ build trước khi có env vars) trên trình duyệt thường của máy đó; `skipWaiting`+`clientsClaim` đã bật sẵn (cấu hình đúng nhất) nhưng cần 1 lượt điều hướng thật (đóng hẳn tab, mở lại) để trình duyệt kiểm tra bản SW mới — chỉ chuyển tab qua lại không kích hoạt kiểm tra. Fix: đóng hẳn tab/xóa dữ liệu trang cho riêng domain đó. Không cần sửa code — đây là hành vi cache một-lần trên thiết bị đã từng mở bản lỗi, không ảnh hưởng người dùng mới.

### Theo hoạt động — chế độ xem gộp theo sự kiện (Dòng thời gian + Lịch)
Operator: "nên cho xem thêm 1 chế độ: theo từng hoạt động... xem tập thể dục tổng hay tổng lượng nước uống trong ngày" — bên cạnh danh sách theo thời gian (chronological) đã có, thêm toggle "Dòng thời gian / Theo hoạt động". Chế độ mới nhóm sự kiện theo loại (bằng `eventDefinitionId`, hiển thị tên/emoji SNAPSHOT nên định nghĩa gốc bị xóa vẫn nhóm đúng), mỗi nhóm hiện tổng phù hợp theo kiểu dữ liệu — tái dùng chính xác `computeStatsForDefinition`/`StatisticCard` mà trang Thống kê đang dùng (moment → "N lần", count → "tổng + đơn vị · N lần", vv.), bấm vào mở rộng xem chi tiết đầy đủ như Thống kê. Ở Lịch, nhóm theo đúng ngày đang chọn. Ở Dòng thời gian (không có khái niệm "1 ngày" cố định), giữ nguyên dải ngày (day separator) nhưng phân trang theo SỐ NGÀY thay vì số sự kiện — đảm bảo tổng mỗi ngày luôn tính từ toàn bộ dữ liệu ngày đó, không bao giờ hiện tổng thiếu vì bị cắt trang giữa chừng.

Component mới dùng chung: `src/components/GroupedByActivity.jsx` + `domain/selectors.groupEventsByDefinition()` + 2 hàm mới trong `domain/statistics.js` (`summaryHeadline` chuyển từ StatisticsPage ra dùng chung, `inferDefinitionFromEvents` cho trường hợp hiếm định nghĩa gốc đã bị xóa — suy đoán kiểu dữ liệu từ chính event, mặc định "count" nếu có `value`).

QA: thêm `runGroupedByActivityQA` (5 assertion) — 114/115 PASS.

### Bug thật: đồng bộ đám mây chỉ 1 chiều, máy khác không thấy dữ liệu mới (2026-09-24)
Operator dùng thật trên 2 thiết bị (điện thoại + máy tính, cùng đăng nhập quản trị viên) và báo máy tính không thấy dữ liệu vừa ghi trên điện thoại. **Đây là lỗ hổng kiến trúc thật, không phải hiểu lầm**: code trước đó chỉ gọi `cloudRepository.fetchAll()` (tải dữ liệu TỪ đám mây VỀ máy) đúng **1 LẦN DUY NHẤT** — ngay sau khi đăng nhập lần đầu (`justSignedIn`). Sau đó mỗi thiết bị chỉ ĐẨY dữ liệu của mình LÊN đám mây (outbox `syncQueue`), không bao giờ tự tải dữ liệu MỚI từ đám mây về nữa — nên thiết bị B không bao giờ thấy những gì thiết bị A ghi/sửa sau thời điểm B đăng nhập lần đầu.

**Fix**: thêm cơ chế "pull xuống" định kỳ, tách biệt với màn hình gộp-dữ-liệu lúc đăng nhập lần đầu:
- `domain/cloudSync.mergeCloudDown()` (mới) — merge kiểu **cloud thắng khi trùng id** (ngược với `mergeLocalAndCloud` cũ là "local thắng", vốn chỉ dùng cho màn hình xác nhận lúc đăng nhập lần đầu). Cloud thắng hợp lý vì cloud luôn phản ánh thay đổi mới nhất đã đẩy lên từ BẤT KỲ thiết bị nào (outbox đẩy lên gần như ngay lập tức khi có mạng).
- `App.jsx` gọi `pullFromCloud()`: 1 lần khi phiên đăng nhập được khôi phục (mở lại app, không phải đăng nhập mới — trường hợp `justSignedIn` cố tình bỏ qua), rồi lặp lại mỗi khi tab được focus/visible + định kỳ 60 giây khi đang mở.
- Thêm nút **"Đồng bộ ngay"** thủ công trong modal Lưu trữ (khi đã đăng nhập) để không phải chờ tự động.

QA: thêm `runCloudMergeLogicQA` (4 assertion, test thuần logic `mergeCloudDown` bằng dữ liệu giả lập — KHÔNG chạy round-trip thật với Supabase production vì sẽ ghi dữ liệu test vào tài khoản thật của operator không có cách dọn sạch an toàn). **118/119 PASS**.

### Đồng bộ xóa chéo thiết bị — tombstone/soft-delete (2026-09-24, cùng chuỗi)
Giải quyết hạn chế nêu trên ngay trong đợt này. **⚠️ Cần chạy `supabase/migrations/0002_soft_delete.sql` trên Supabase project thật trước khi dùng** — nếu chưa chạy, `deleteDefinition`/`deleteEvent` sẽ lỗi (cột `deleted_at` chưa tồn tại).

**Cách hoạt động**: xóa trên 1 thiết bị giờ không còn `DELETE` thật trong Supabase — thay bằng `UPDATE ... SET deleted_at = now()` (tombstone). Local vẫn xóa ngay lập tức khỏi màn hình như cũ (trải nghiệm không đổi). Khi thiết bị khác pull xuống (`mergeCloudDown`), gặp dòng có `deleted_at` thì XÓA luôn bản sao ở local đó — đây là cách duy nhất pull-down phân biệt được "chưa từng tồn tại" với "đã tồn tại rồi bị xóa nơi khác". Upsert (tạo/sửa) luôn set tường minh `deleted_at: null` để "hồi sinh" đúng nếu người dùng xóa 1 sự kiện rồi sau đó thêm lại từ thư viện (cùng id ổn định) — nếu không làm vậy, tombstone cũ sẽ tồn tại mãi và lần pull tiếp theo sẽ xóa nhầm bản vừa thêm lại.

Màn hình gộp-dữ-liệu lúc đăng nhập lần đầu (`planCloudSync`/`mergeLocalAndCloud`) được bọc thêm `stripDeleted()` — đảm bảo dữ liệu đã xóa ở nơi khác trước khi thiết bị này từng đăng nhập sẽ không bị "hồi sinh nhầm" qua màn hình Gộp/Khôi phục.

**Chưa làm** (không cấp bách, tự purge tombstone cũ — bảng sẽ giữ các dòng đã xóa mãi mãi thay vì biến mất hẳn; với quy mô cá nhân của app này không đáng lo, nhưng nếu operator muốn dọn hẳn sau này cần thêm 1 job xóa cứng các dòng `deleted_at` cũ hơn X ngày).

QA: mở rộng `runCloudMergeLogicQA` thêm 6 assertion (xóa từ thiết bị khác propagate đúng + không đụng dữ liệu khác, `stripDeleted` hoạt động đúng, màn hình đăng nhập lần đầu không hồi sinh nhầm, upsert xóa đúng tombstone cũ cho cả definition lẫn event). **125/126 PASS**.

## Việc còn mở (chưa làm, không chặn sử dụng)

- **Chưa purge tombstone cũ** (xem mục "Đồng bộ xóa chéo thiết bị" — không cấp bách ở quy mô cá nhân).
- Test E2E thật cho luồng đăng nhập/đồng bộ/RLS/xóa-chéo-thiết-bị với Supabase project thật (có credentials rồi, đã hoạt động trên thiết bị thật qua Vercel, chưa có bộ test tự động riêng cho luồng cloud có phiên đăng nhập thật vì rủi ro ghi dữ liệu test vào tài khoản thật).
- **⚠️ Nhắc lại: `supabase/migrations/0002_soft_delete.sql` phải được chạy trên Supabase project thật trước khi deploy bản này** — chưa chạy thì mọi thao tác xóa lúc đã đăng nhập sẽ lỗi.
- `Icon.theme` mới thêm (icon chuyển đổi giao diện) dùng hình tròn nửa sáng nửa tối đơn giản — có thể tinh chỉnh lại nếu operator muốn icon khác.
