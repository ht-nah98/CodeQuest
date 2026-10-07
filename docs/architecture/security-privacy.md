# Bảo mật & quyền riêng tư của trẻ

Nguồn chuẩn cho: dữ liệu nào được thu, ai đọc được, các biện pháp kỹ thuật.

## 1. Dữ liệu thu thập
| Dữ liệu | Có thu? | Ghi chú |
|---|---|---|
| Biệt danh (không cần tên thật) | ✔ | Huấn luyện viên đặt cùng bé |
| Avatar (chọn từ bộ có sẵn) | ✔ | Không tải ảnh lên |
| Tiến độ, lượt chơi, sổ xu, huy hiệu | ✔ | Để học và để huấn luyện viên theo dõi |
| Tác phẩm sáng tạo (workspace JSON) | ✔ | Chỉ chia sẻ trong nhóm khi bé bấm "Khoe" |
| Họ tên thật, ngày sinh, trường, ảnh, giọng nói, vị trí, email của bé | ✘ | Không bao giờ |
| Analytics / tracking bên thứ ba, quảng cáo | ✘ | Không bao giờ |

## 2. Đồng ý của phụ huynh
Trước khi tạo tài khoản cho 5 bạn, huấn luyện viên gửi phụ huynh một trang mô tả ngắn: dữ liệu ở §1, ai xem được (chỉ huấn luyện viên), xóa thế nào. Mẫu nằm ở `docs/playbooks/playtest.md` §5.

## 3. Biện pháp kỹ thuật
- Supabase **RLS bật trên mọi bảng** (xem `data-sync-auth.md` §3). Có test SQL cho từng policy (GĐ 2).
- Khóa `service_role` **chỉ** nằm trong Edge Function (biến môi trường của Supabase), không bao giờ có trong frontend hay trong repo.
- Frontend chỉ có `anon key` + URL (công khai theo thiết kế của Supabase, an toàn khi RLS đúng).
- `.env*` nằm trong `.gitignore`; có `.env.example` liệt kê tên biến, không có giá trị.
- PIN 4 số chỉ là khóa cục bộ, lưu dạng hash, không phải cơ chế bảo mật tài khoản.
- Mã ghép máy: 6 số, hạn 10 phút, dùng một lần, lưu dạng hash (có pepper). Mỗi lúc chỉ có mã khi huấn luyện viên đang mở hộp "Ghép máy". Edge Function `pair-device` giới hạn **toàn cục** 10 lần thử sai / 10 phút (đếm trong bảng `pairing_attempts`); vượt ngưỡng thì vô hiệu mọi mã đang mở. (Không giới hạn "theo mã" được, vì một lần đoán sai không cho biết bé đang nhắm mã nào.)
- Code của bé chạy trong `js-interpreter`: không truy cập được DOM, mạng hay bộ nhớ của trang.
- **Không gọi bên thứ ba lúc chạy:** font tự host trong `public/fonts`; media của Blockly tự host trong `public/blockly-media` (mặc định Blockly tải từ `static.blockly.com`, phải ghi đè bằng `media`, xem `blockly-integration.md` §12).
- **Content Security Policy** (header trong `vercel.json`):
  ```
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  media-src 'self' blob:;
  worker-src 'self' blob:;
  connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co;
  frame-ancestors 'none'; base-uri 'self'; object-src 'none'
  ```
  `style-src 'unsafe-inline'` là bắt buộc: Blockly tự chèn thẻ `<style>` lúc inject. PixiJS phải import `pixi.js/unsafe-eval` để **không** cần `'unsafe-eval'` trong `script-src`. Zod 4 chạy `jitless` (`apps/web/public/boot/zod-jitless.js`, script thường nạp trước bundle) vì phép thử `new Function` của nó, dù bị bắt lỗi, vẫn bị báo là vi phạm CSP. `worker-src 'self'` cho service worker (P2-09) và Web Worker; `manifest.webmanifest` thuộc `default-src 'self'`.
  Kiểm tự động: `vite preview` gửi đúng chính sách này (bỏ phần Supabase, xem `PREVIEW_CSP` trong `apps/web/vite.config.ts`), e2e `pwa-offline.spec.ts` **đỏ** khi có sự kiện `securitypolicyviolation`. Header CSP thật vào `vercel.json` ở task P2-18 (cần URL project Supabase cho `connect-src`); khi đó giữ `PREVIEW_CSP` khớp với nó.
- Không có chat, không có nội dung do người lạ tạo.

## 4. Xóa dữ liệu
Huấn luyện viên xóa một học sinh → xóa toàn bộ dòng của học sinh đó (cascade) + `auth.users` tương ứng. Trên máy của bé: Cài đặt → "Xóa hồ sơ trên máy này".
